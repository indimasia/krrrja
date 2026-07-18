// AI scoring provider seam. The worker (lib/screening/process.ts) only knows
// this interface. Providers: "mock" (deterministic heuristic, no key) and
// "openrouter" (OpenAI-compatible chat completions — set AI_PROVIDER=openrouter
// + OPENROUTER_API_KEY, optionally OPENROUTER_MODEL / OPENROUTER_BASE_URL).

export type ScoreResult = {
  score: number; // integer 0-100
  summary: [string, string, string]; // exactly 3 short bullets
  red_flags: string[]; // can be empty
};

export type ScorerInput = {
  jobTitle: string;
  jobDescription: string;
  criteria: string;
  cvText: string;
};

export interface Scorer {
  name: string;
  score(input: ScorerInput): Promise<ScoreResult>;
}

// Enforces the strict output contract regardless of provider: score integer
// 0-100, summary exactly 3 non-empty strings, red_flags array of strings.
// Throws on violation so the worker's retry path kicks in.
export function validateScoreResult(raw: unknown): ScoreResult {
  if (typeof raw !== "object" || raw === null) throw new Error("Scorer output is not an object.");
  const obj = raw as Record<string, unknown>;

  const score = obj.score;
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error("Scorer output: score must be an integer 0-100.");
  }

  const summary = obj.summary;
  if (!Array.isArray(summary) || summary.length !== 3 || summary.some((s) => typeof s !== "string" || s.trim() === "")) {
    throw new Error("Scorer output: summary must be exactly 3 non-empty strings.");
  }

  const redFlags = obj.red_flags;
  if (!Array.isArray(redFlags) || redFlags.some((s) => typeof s !== "string")) {
    throw new Error("Scorer output: red_flags must be an array of strings.");
  }

  return { score, summary: summary as [string, string, string], red_flags: redFlags as string[] };
}

// ── Mock provider ────────────────────────────────────────────────────────
// Deterministic keyword-overlap heuristic so the full pipeline (queue, retry,
// dashboard ranking) is exercised end-to-end without an OpenAI key. Scores are
// stable for the same CV + criteria, and vary across CVs so ranking is visible.

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length >= 3);
}

const mockScorer: Scorer = {
  name: "mock",
  async score({ criteria, jobDescription, cvText }) {
    const cvTokens = new Set(tokenize(cvText));
    const wantTokens = [...new Set(tokenize(`${criteria} ${jobDescription}`))];

    const matched = wantTokens.filter((t) => cvTokens.has(t));
    const overlap = wantTokens.length > 0 ? matched.length / wantTokens.length : 0;
    // 20-95 band: overlap dominates, small bonus for substantial CV text.
    const lengthBonus = Math.min(cvText.length / 4000, 1) * 10;
    const score = Math.round(Math.min(95, 20 + overlap * 65 + lengthBonus));

    const red_flags: string[] = [];
    if (cvText.trim().length < 300) red_flags.push("CV text is very short — file may be image-only or truncated.");
    if (matched.length === 0) red_flags.push("No overlap found between CV and the stated criteria.");

    return validateScoreResult({
      score,
      summary: [
        `Matched ${matched.length} of ${wantTokens.length} criteria/description terms${matched.length > 0 ? ` (e.g. ${matched.slice(0, 3).join(", ")})` : ""}.`,
        `CV contains ${cvText.trim().length} characters of extracted text.`,
        "Scored by mock provider — heuristic keyword overlap, not an AI assessment.",
      ],
      red_flags,
    });
  },
};

// ── OpenRouter provider ──────────────────────────────────────────────────
// OpenAI-compatible /chat/completions over fetch — no SDK dependency. The
// model must return the strict JSON contract; anything else throws and the
// worker's retry path (max 3 attempts) kicks in.

// Keeps prompt size bounded for long CVs; the head of a CV carries the signal
// (contact, experience, skills), so plain truncation is fine for MVP.
const MAX_CV_CHARS = 24_000;

const SYSTEM_PROMPT = `You are a CV screening assistant. You compare one candidate CV against a job opening and return a strict JSON assessment.

Rules:
- Treat the stated criteria as the primary constraint; the job description is secondary context.
- Do not infer facts absent from the CV text. If something is not stated, it does not count.
- Use neutral language. Avoid inferring or mentioning sensitive attributes (age, gender, ethnicity, religion, health, etc.).
- red_flags are concrete, evidence-based concerns (e.g. unexplained gaps, missing must-have criteria), not speculation.

Respond with JSON only — no prose, no markdown fences. Exact shape:
{"score": <integer 0-100>, "summary": [<string>, <string>, <string>], "red_flags": [<string>, ...]}
"summary" must be exactly 3 short bullets. "red_flags" may be empty.`;

function extractJson(text: string): unknown {
  // Models sometimes wrap output in ```json fences or lead with prose despite
  // instructions — recover the first top-level object instead of failing.
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Scorer output contains no JSON object.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

const openRouterScorer: Scorer = {
  name: "openrouter",
  async score({ jobTitle, jobDescription, criteria, cvText }) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set.");
    const baseUrl = (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
    const model = process.env.OPENROUTER_MODEL ?? "tencent/hy3:free";

    const userPrompt = [
      `Job title: ${jobTitle}`,
      `Job description:\n${jobDescription}`,
      `Criteria (primary constraint):\n${criteria}`,
      `CV text:\n${cvText.slice(0, MAX_CV_CHARS)}`,
    ].join("\n\n");

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        // Note: not every OpenRouter model supports json_schema (tencent/hy3
        // does, and rejects plain json_object). validateScoreResult remains
        // the real gate either way.
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "cv_score",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["score", "summary", "red_flags"],
              properties: {
                score: { type: "integer", minimum: 0, maximum: 100 },
                summary: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
                red_flags: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      // Body often carries the useful detail (rate limit, invalid model);
      // logged by the worker, never stored user-facing.
      const body = await res.text().catch(() => "");
      throw new Error(`OpenRouter request failed (${res.status}): ${body.slice(0, 500)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };
    if (data.error?.message) throw new Error(`OpenRouter error: ${data.error.message}`);
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter response has no message content.");

    return validateScoreResult(extractJson(content));
  },
};

// ── Provider selection ───────────────────────────────────────────────────

export function getScorer(): Scorer {
  const provider = process.env.AI_PROVIDER ?? "mock";
  switch (provider) {
    case "mock":
      return mockScorer;
    case "openrouter":
      return openRouterScorer;
    default:
      throw new Error(`Unknown AI_PROVIDER "${provider}".`);
  }
}
