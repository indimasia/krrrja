// AI scoring provider seam. The worker (lib/screening/process.ts) only knows
// this interface — swapping mock → OpenAI gpt-4o later means adding a provider
// here and setting AI_PROVIDER=openai + OPENAI_API_KEY. No worker changes.

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

// ── Provider selection ───────────────────────────────────────────────────

export function getScorer(): Scorer {
  const provider = process.env.AI_PROVIDER ?? "mock";
  switch (provider) {
    case "mock":
      return mockScorer;
    case "openai":
      // Deliberate: OpenAI integration is a later build step (needs SDK + key).
      // Failing loudly beats silently mock-scoring real customer data.
      throw new Error("AI_PROVIDER=openai is not implemented yet. Unset AI_PROVIDER or use 'mock'.");
    default:
      throw new Error(`Unknown AI_PROVIDER "${provider}".`);
  }
}
