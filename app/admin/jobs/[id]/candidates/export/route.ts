import { NextResponse } from "next/server";
import { getJobOpening } from "@/lib/data/jobs";
import { getOrgContext } from "@/lib/data/org";
import { filterCandidates, listCandidates, parseCandidateFilters } from "@/lib/data/candidates";
import { canExportData } from "@/lib/permissions";

function csvField(value: string | number | null): string {
  const s = value === null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

// CSV export of a job opening's candidates. Admin-only: members get a real
// 403 here even if they craft the URL directly — UI hiding is not the gate.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ctx = await getOrgContext();
  if (!ctx) return new NextResponse("Unauthorized", { status: 401 });
  if (ctx.suspended) return new NextResponse("Forbidden: organization suspended", { status: 403 });
  if (!canExportData(ctx.role)) return new NextResponse("Forbidden: admin role required", { status: 403 });

  // getJobOpening reads through RLS — returns null for other orgs' jobs.
  const job = await getJobOpening(id);
  if (!job) return new NextResponse("Not found", { status: 404 });

  // Same filter params as the candidates page — the CSV mirrors the table view.
  const { status, q, from, to } = parseCandidateFilters(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const candidates = filterCandidates(await listCandidates(id, ctx.orgId, { status }), { q, from, to });

  const header = ["file_name", "score", "status", "summary", "red_flags", "notes", "uploaded_at"];
  const rows = candidates.map((c) =>
    [
      csvField(c.fileName),
      csvField(c.score),
      csvField(c.status),
      csvField(c.summary.join(" | ")),
      csvField(c.redFlags.join(" | ")),
      csvField(c.notes),
      csvField(c.createdAt),
    ].join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");
  const fileName = `${job.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-candidates.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
