import "server-only";

import { PDFParse } from "pdf-parse";

// PDF text extraction with an OCR fallback for scanned / image-only CVs.
//
// Order: pdf-parse pulls the embedded text layer (fast, ~100ms). Word/Docs
// exports land here. If the layer is empty or negligible — a scanned page, a
// photo of a resume, an image-only export — we rasterise each page and run
// tesseract.js OCR over it. Only genuinely unreadable files (blank, corrupt)
// fall through to the "no text" failure.
//
// Result is a discriminated union so callers can tell a real parse ERROR
// (retryable) apart from a genuinely EMPTY document (not retryable) — the old
// code swallowed every failure to "" and mislabelled all of them "scanned".

// Vercel file-tracing anchors. pdf-parse loads both of these via computed
// dynamic imports/requires the tracer can't see, so they get dropped from the
// lambda and PDF parsing dies at runtime:
//   - pdfjs's worker → "Setting up fake worker failed: Cannot find module
//     .../pdf.worker.mjs"
//   - @napi-rs/canvas (source of the DOMMatrix polyfill) → "ReferenceError:
//     DOMMatrix is not defined"
// Literal import specifiers here make NFT include the real files in every
// route that can reach extractPdfText (both packages are in
// serverExternalPackages, so these stay on-disk references instead of being
// bundled). The condition is never true at runtime — nothing is loaded or
// executed. Do NOT replace this with outputFileTracingIncludes globs: route
// keys containing [id] are parsed as glob character classes and never match,
// and globs into pnpm's store crash the packager with ENOTDIR.
if (process.env.__TRACE_PDF_DEPS__) {
  // @ts-expect-error — the worker build ships no type declarations; this
  // import exists only as a file-tracing anchor and never runs.
  void import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  void import("@napi-rs/canvas");
}

const MIN_TEXT_CHARS = 20; // below this the embedded layer is treated as absent
const OCR_MAX_PAGES = 5; // bound OCR cost — CVs are 1-2 pages in practice
const OCR_SCALE = 2; // upscale render for legible glyphs

export type ExtractResult =
  | { ok: true; text: string; method: "text" | "ocr" }
  | { ok: false; reason: "empty" | "error"; message: string };

export async function extractPdfText(bytes: Uint8Array): Promise<ExtractResult> {
  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: bytes });

    const text = ((await parser.getText()).text ?? "").trim();
    if (text.length >= MIN_TEXT_CHARS) {
      return { ok: true, text, method: "text" };
    }

    // No usable text layer — try OCR before giving up.
    const ocr = await ocrPdf(parser);
    if (ocr.trim().length >= MIN_TEXT_CHARS) {
      return { ok: true, text: ocr.trim(), method: "ocr" };
    }

    return { ok: false, reason: "empty", message: "No text found in PDF, including after OCR." };
  } catch (err) {
    // A real parse/render failure — corrupt file, unsupported encoding, or a
    // runtime dependency issue. Distinct from an empty document.
    return { ok: false, reason: "error", message: err instanceof Error ? err.message : String(err) };
  } finally {
    await parser?.destroy();
  }
}

async function ocrPdf(parser: PDFParse): Promise<string> {
  const shot = await parser.getScreenshot({ scale: OCR_SCALE, imageBuffer: true, first: 1, last: OCR_MAX_PAGES });
  const pages = shot.pages ?? [];
  if (pages.length === 0) return "";

  // Lazy-import: tesseract.js pulls a wasm core + language data (cached after
  // first use). Keep it out of the module graph for text-layer PDFs.
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const parts: string[] = [];
    for (const page of pages) {
      if (!page.data) continue;
      const { data } = await worker.recognize(Buffer.from(page.data));
      if (data.text) parts.push(data.text);
    }
    return parts.join("\n\n");
  } finally {
    await worker.terminate();
  }
}
