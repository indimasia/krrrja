import type { NextConfig } from "next";

// @napi-rs/canvas only — pdf-parse loads it via a dynamic require the tracer
// can't see, and these globs are proven to deploy + fix DOMMatrix at runtime.
//
// pdfjs-dist is deliberately ABSENT here. Any glob that touches it (top-level
// or .pnpm spelling) crashes Vercel's packager with "ENOTDIR: not a directory,
// mkdir .../.pnpm/node_modules/pdfjs-dist" — the glob copy collides with the
// symlink entries NFT already traced for pdf.mjs. Its worker is instead pulled
// in by a static import reference in lib/screening/extract.ts, which NFT
// traces through pnpm symlinks correctly.
const PDF_TRACE_INCLUDES = [
  "./node_modules/@napi-rs/canvas/**",
  "./node_modules/@napi-rs/canvas-*/**",
];

const nextConfig: NextConfig = {
  // Native/wasm deps must stay external — bundling breaks their worker + binary
  // loading. pdf-parse (pdfjs worker + @napi-rs/canvas) and tesseract.js (wasm
  // core + lang data) both do runtime file/worker loading.
  serverExternalPackages: ["pdf-parse", "tesseract.js", "@napi-rs/canvas", "pdfjs-dist"],

  // Vercel's file tracer misses @napi-rs/canvas's .node binary (dynamic
  // require inside the external pdf-parse) — without it the lambda's
  // require("@napi-rs/canvas") fails, the DOMMatrix polyfill is never set, and
  // PDF parsing throws "ReferenceError: DOMMatrix is not defined". Force it in.
  //
  // Scope to ONLY the PDF routes — NOT "/**". A "/**" key bloats every route's
  // function past Vercel's per-lambda size cap, its auto-merge of small
  // functions fails, and the app ships 21 separate functions — over the Hobby
  // 12-function limit.
  //
  // Every route whose function can run extractPdfText — matches the routes
  // whose .nft.json traces pdf.worker.mjs. /admin/jobs/[id] is here because
  // the upload Server Action posts to the job-detail page's own function.
  outputFileTracingIncludes: {
    "/admin/jobs/[id]": PDF_TRACE_INCLUDES,
    "/admin/jobs/[id]/candidates": PDF_TRACE_INCLUDES,
    "/api/jobs/parse-jd": PDF_TRACE_INCLUDES,
  },
};

export default nextConfig;
