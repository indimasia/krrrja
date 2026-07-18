import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/data/org";
import { canManageJobOpenings } from "@/lib/permissions";
import { extractPdfText } from "@/lib/screening/extract";
import { parseJdText } from "@/lib/ai/jd-parser";

// Parses an uploaded JD PDF into job form fields for client-side autofill.
// Never writes to the DB — the form still requires an explicit submit.
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!canManageJobOpenings(ctx.role)) {
    return NextResponse.json({ error: "Only org admins can use JD auto-fill." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be 5MB or smaller." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "JD auto-fill only supports PDF right now." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extracted = await extractPdfText(bytes);
  if (!extracted.ok) {
    return NextResponse.json({ error: "Could not read text from this PDF." }, { status: 422 });
  }

  try {
    const fields = await parseJdText(extracted.text);
    return NextResponse.json({ fields });
  } catch (err) {
    console.error("[jd-parser] parse failed:", err);
    return NextResponse.json({ error: "Auto-fill failed — try again or fill the form manually." }, { status: 502 });
  }
}
