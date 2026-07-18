import "server-only";

// Parses raw JD text (extracted from an uploaded PDF) into the job form's
// field shape, so the form can auto-fill without a submit. Mirrors the
// provider-seam pattern in lib/ai/scorer.ts: "mock" (heuristic, no key) and
// "openrouter" (same AI_PROVIDER env toggle as the CV scorer).

import { JOB_TYPES, WORKPLACE_TYPES, CURRENCIES, type JobType, type WorkplaceType, type Currency } from "@/lib/job-fields";

export type ParsedJdFields = {
  title: string;
  description: string;
  requirements: string;
  criteria: string;
  skills: string[];
  job_type: JobType;
  workplace_type: WorkplaceType;
  salary_min: number | null;
  salary_max: number | null;
  currency: Currency;
};

function validateParsedFields(raw: unknown): ParsedJdFields {
  if (typeof raw !== "object" || raw === null) throw new Error("JD parser output is not an object.");
  const obj = raw as Record<string, unknown>;

  const str = (key: string) => (typeof obj[key] === "string" ? (obj[key] as string).trim() : "");
  const skills = Array.isArray(obj.skills)
    ? obj.skills.filter((s): s is string => typeof s === "string" && s.trim() !== "").slice(0, 30)
    : [];

  const job_type = (JOB_TYPES as readonly string[]).includes(obj.job_type as string)
    ? (obj.job_type as JobType)
    : "full_time";
  const workplace_type = (WORKPLACE_TYPES as readonly string[]).includes(obj.workplace_type as string)
    ? (obj.workplace_type as WorkplaceType)
    : "on_site";
  const currency = (CURRENCIES as readonly string[]).includes(obj.currency as string)
    ? (obj.currency as Currency)
    : "USD";

  const num = (key: string): number | null => {
    const v = obj[key];
    return typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null;
  };
  let salary_min = num("salary_min");
  let salary_max = num("salary_max");
  if (salary_min != null && salary_max != null && salary_min > salary_max) {
    [salary_min, salary_max] = [salary_max, salary_min];
  }

  return {
    title: str("title"),
    description: str("description"),
    requirements: str("requirements"),
    criteria: str("criteria"),
    skills,
    job_type,
    workplace_type,
    salary_min,
    salary_max,
    currency,
  };
}

// ── Mock provider ────────────────────────────────────────────────────────
// Deterministic line-based heuristic so the upload → autofill flow is
// exercisable without an OpenRouter key.

function mockParse(text: string): ParsedJdFields {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const title = lines[0]?.slice(0, 120) ?? "";
  const body = lines.slice(1).join("\n");

  const skillsLine = lines.find((l) => /^skills?:/i.test(l));
  const skills = skillsLine
    ? skillsLine.replace(/^skills?:/i, "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30)
    : [];

  const remoteMatch = /remote/i.test(text) ? "remote" : /hybrid/i.test(text) ? "hybrid" : "on_site";
  const typeMatch = /part.time/i.test(text)
    ? "part_time"
    : /contract/i.test(text)
      ? "contract"
      : /intern/i.test(text)
        ? "internship"
        : /temporary/i.test(text)
          ? "temporary"
          : "full_time";

  return validateParsedFields({
    title,
    description: body.slice(0, 4000),
    requirements: "",
    criteria: "",
    skills,
    job_type: typeMatch,
    workplace_type: remoteMatch,
    salary_min: null,
    salary_max: null,
    currency: "USD",
  });
}

// ── OpenRouter provider ──────────────────────────────────────────────────

const MAX_JD_CHARS = 24_000;

const SYSTEM_PROMPT = `You extract structured job posting fields from raw job description text (which may come from a messy PDF text layer). Return strict JSON only, no prose, no markdown fences. Exact shape:
{"title": <string>, "description": <string>, "requirements": <string>, "criteria": <string>, "skills": [<string>, ...], "job_type": "full_time"|"part_time"|"contract"|"temporary"|"internship", "workplace_type": "on_site"|"hybrid"|"remote", "salary_min": <integer or null>, "salary_max": <integer or null>, "currency": "USD"|"IDR"|"EUR"|"GBP"|"SGD"}

Rules:
- "description" is the role/responsibilities narrative; "requirements" is must-have qualifications; "criteria" is a short free-text screening constraint you infer from the requirements (what a strong candidate must show).
- "skills" is a flat list of concrete skills/technologies, no duplicates.
- Only set salary_min/salary_max if a number is explicitly stated; otherwise null.
- Do not invent facts absent from the text.`;

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("JD parser output contains no JSON object.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function openRouterParse(text: string): Promise<ParsedJdFields> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set.");
  const baseUrl = (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const model = process.env.OPENROUTER_MODEL ?? "tencent/hy3:free";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text.slice(0, MAX_JD_CHARS) },
      ],
    }),
  });

  if (!res.ok) {
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

  return validateParsedFields(extractJson(content));
}

export async function parseJdText(text: string): Promise<ParsedJdFields> {
  const provider = process.env.AI_PROVIDER ?? "mock";
  switch (provider) {
    case "mock":
      return mockParse(text);
    case "openrouter":
      return openRouterParse(text);
    default:
      throw new Error(`Unknown AI_PROVIDER "${provider}".`);
  }
}
