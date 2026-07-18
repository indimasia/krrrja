// Shared vocab for job posting fields (form selects, detail display, validation).

export const JOB_TYPES = ["full_time", "part_time", "contract", "temporary", "internship"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
};

export const WORKPLACE_TYPES = ["on_site", "hybrid", "remote"] as const;
export type WorkplaceType = (typeof WORKPLACE_TYPES)[number];

export const WORKPLACE_TYPE_LABELS: Record<WorkplaceType, string> = {
  on_site: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const CURRENCIES = ["USD", "IDR", "EUR", "GBP", "SGD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  IDR: "Rp",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
};

export function isJobType(value: string): value is JobType {
  return (JOB_TYPES as readonly string[]).includes(value);
}

export function isWorkplaceType(value: string): value is WorkplaceType {
  return (WORKPLACE_TYPES as readonly string[]).includes(value);
}

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: Currency = "USD",
): string | null {
  const symbol = CURRENCY_SYMBOLS[currency];
  const fmt = (n: number) => `${symbol}${n.toLocaleString("en-US")}`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}/yr`;
  if (min != null) return `From ${fmt(min)}/yr`;
  if (max != null) return `Up to ${fmt(max)}/yr`;
  return null;
}
