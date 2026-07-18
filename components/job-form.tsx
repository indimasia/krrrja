"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { DownloadIcon, Loader2Icon, UploadCloudIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createJobOpening, updateJobOpening, type JobFormState } from "@/lib/actions/jobs";
import {
  JOB_TYPES,
  JOB_TYPE_LABELS,
  WORKPLACE_TYPES,
  WORKPLACE_TYPE_LABELS,
  CURRENCIES,
  CURRENCY_SYMBOLS,
  type JobType,
  type WorkplaceType,
  type Currency,
} from "@/lib/job-fields";

type ParsedJdFields = {
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

// "Load filament" styled JD upload: PDF in, form fields out — nothing submits
// until the user reviews and hits Save. Spool glyph + feed-progress bar riff
// on a 3D-printer filament loader instead of a plain file input.
function JdFilamentUpload({ onParsed }: { onParsed: (fields: ParsedJdFields) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const load = async (file: File) => {
    setFileName(file.name);
    setStatus("loading");
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/jobs/parse-jd", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Auto-fill failed.");
      onParsed(data.fields as ParsedJdFields);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Auto-fill failed.");
    }
  };

  return (
    <div className="space-y-2">
      <Label>JD file upload</Label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) load(file);
        }}
        className="glass group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-dashed border-primary-emphasis/40 p-4 transition-colors hover:border-primary-emphasis"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) load(file);
          }}
        />

        {/* Filament spool glyph — rim spins while a parse is "extruding". */}
        <svg
          viewBox="0 0 48 48"
          className={`size-11 shrink-0 text-primary-emphasis ${status === "loading" ? "animate-spin" : ""}`}
          style={{ animationDuration: "2.5s" }}
        >
          <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 3" opacity="0.5" />
          <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="24" cy="24" r="4" fill="currentColor" />
        </svg>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {fileName ?? "Load JD filament"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {status === "loading" && "Extruding fields from PDF…"}
            {status === "done" && "Fields loaded below — review before saving."}
            {status === "error" && error}
            {status === "idle" && "Drop a JD PDF, or click to feed one in — fields below auto-fill, nothing submits yet."}
          </p>
          {status === "loading" && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-primary-surface">
              <div className="h-full w-1/3 animate-[filament-feed_1.1s_ease-in-out_infinite] rounded-full bg-primary-emphasis" />
            </div>
          )}
        </div>

        {status === "loading" ? (
          <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloudIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5" />
        )}
      </div>
      <a
        href="/templates/jd-template.docx"
        download
        className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        <DownloadIcon className="size-3" />
        Download JD template
      </a>
      <style>{`
        @keyframes filament-feed {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}

type JobFormValues = {
  id: string;
  title: string;
  description: string;
  criteria: string;
  skills: string[];
  requirements: string;
  jobType: JobType;
  workplaceType: WorkplaceType;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: Currency;
  attachmentName: string | null;
};

// LinkedIn-style skill chips: type + Enter/comma to add, chip × to remove.
// Submitted as a single comma-joined hidden field.
function SkillsInput({ initial }: { initial: string[] }) {
  const [skills, setSkills] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  const addSkill = (raw: string) => {
    const value = raw.trim().replace(/,+$/, "").trim();
    setDraft("");
    if (!value) return;
    setSkills((prev) =>
      prev.some((s) => s.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value],
    );
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name="skills" value={skills.join(",")} />
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <Badge key={skill} variant="outline" className="gap-1 rounded-full border-transparent bg-primary-surface pr-1 text-primary-ink">
              {skill}
              <button
                type="button"
                aria-label={`Remove ${skill}`}
                className="rounded-full p-0.5 hover:bg-foreground/10"
                onClick={() => setSkills((prev) => prev.filter((s) => s !== skill))}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        id="skills-input"
        value={draft}
        placeholder="e.g. Node.js — press Enter to add"
        onChange={(e) => {
          if (e.target.value.includes(",")) addSkill(e.target.value);
          else setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addSkill(draft);
          }
        }}
        onBlur={() => addSkill(draft)}
      />
    </div>
  );
}

// Create mode when `job` is absent; edit mode pre-fills and updates in place.
export function JobForm({ job }: { job?: JobFormValues }) {
  const action = job ? updateJobOpening.bind(null, job.id) : createJobOpening;
  const [state, formAction, pending] = useActionState<JobFormState, FormData>(action, null);
  const cancelHref = job ? `/admin/jobs/${job.id}` : "/admin/jobs";

  // JD auto-fill overwrites these defaults and remounts the fields below
  // (via `fillKey`) so uncontrolled inputs pick up the new defaultValue —
  // nothing here submits on its own, only Save does.
  const [values, setValues] = useState<JobFormValues>(
    () =>
      job ?? {
        id: "",
        title: "",
        description: "",
        criteria: "",
        skills: [],
        requirements: "",
        jobType: "full_time",
        workplaceType: "on_site",
        salaryMin: null,
        salaryMax: null,
        currency: "USD",
        attachmentName: null,
      },
  );
  const [fillKey, setFillKey] = useState(0);

  const applyParsed = (fields: ParsedJdFields) => {
    setValues((prev) => ({
      ...prev,
      title: fields.title || prev.title,
      description: fields.description || prev.description,
      requirements: fields.requirements || prev.requirements,
      criteria: fields.criteria || prev.criteria,
      skills: fields.skills.length > 0 ? fields.skills : prev.skills,
      jobType: fields.job_type,
      workplaceType: fields.workplace_type,
      salaryMin: fields.salary_min,
      salaryMax: fields.salary_max,
      currency: fields.currency,
    }));
    setFillKey((k) => k + 1);
  };

  return (
    <form action={formAction} className="space-y-5">
      <JdFilamentUpload onParsed={applyParsed} />

      <div key={fillKey} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Job title</Label>
          <Input id="title" name="title" placeholder="e.g. Senior Backend Engineer" defaultValue={values.title} required />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job_type">Job type</Label>
            <Select name="job_type" defaultValue={values.jobType}>
              <SelectTrigger id="job_type" className="h-9 w-full rounded-xl">
                <SelectValue>{(value: JobType) => JOB_TYPE_LABELS[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {JOB_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workplace_type">Workplace</Label>
            <Select name="workplace_type" defaultValue={values.workplaceType}>
              <SelectTrigger id="workplace_type" className="h-9 w-full rounded-xl">
                <SelectValue>{(value: WorkplaceType) => WORKPLACE_TYPE_LABELS[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {WORKPLACE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {WORKPLACE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Estimated salary range</Label>
          <div className="flex items-center gap-2">
            <Select name="currency" defaultValue={values.currency}>
              <SelectTrigger id="currency" className="h-9 w-24 rounded-xl shrink-0">
                <SelectValue>{(value: Currency) => `${CURRENCY_SYMBOLS[value]} ${value}`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {CURRENCY_SYMBOLS[currency]} {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              name="salary_min"
              type="number"
              min={0}
              step={1000}
              placeholder="Min (e.g. 60000)"
              defaultValue={values.salaryMin ?? ""}
              aria-label="Minimum salary"
            />
            <span className="text-sm text-muted-foreground">–</span>
            <Input
              name="salary_max"
              type="number"
              min={0}
              step={1000}
              placeholder="Max (e.g. 90000)"
              defaultValue={values.salaryMax ?? ""}
              aria-label="Maximum salary"
            />
          </div>
          <p className="text-xs text-muted-foreground">Annual, optional — shown to your team only.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Job description</Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Responsibilities, team, what success looks like..."
            defaultValue={values.description}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="requirements">Requirements</Label>
          <Textarea
            id="requirements"
            name="requirements"
            rows={4}
            placeholder="Must-have qualifications, education, experience level..."
            defaultValue={values.requirements}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attachment">Attachment</Label>
          <Input
            id="attachment"
            name="attachment"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          <p className="text-xs text-muted-foreground">
            {job?.attachmentName
              ? `Current file: ${job.attachmentName} — choosing a new file replaces it.`
              : "Optional — attach the full JD as PDF or Word, max 5MB."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills-input">Skills</Label>
          <SkillsInput initial={values.skills} />
          <p className="text-xs text-muted-foreground">Add the skills a strong candidate should have.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="criteria">Screening criteria</Label>
          <Textarea
            id="criteria"
            name="criteria"
            rows={5}
            placeholder="e.g. 5+ yrs Node.js, distributed systems experience, startup background preferred"
            defaultValue={values.criteria}
            required
          />
          <p className="text-xs text-muted-foreground">
            Free text — AI treats this as the primary constraint when scoring CVs.
          </p>
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="rounded-full px-5">
          {pending ? (job ? "Saving..." : "Creating...") : job ? "Save changes" : "Create job opening"}
        </Button>
        <Button type="button" variant="outline" className="rounded-full px-5" render={<Link href={cancelHref}>Cancel</Link>} />
      </div>
    </form>
  );
}
