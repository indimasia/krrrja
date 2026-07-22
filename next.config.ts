import type { NextConfig } from "next";

const PDF_TRACE_INCLUDES = [
  "./node_modules/@napi-rs/canvas/**",
  "./node_modules/@napi-rs/canvas-*/**",
  "./node_modules/pdfjs-dist/**",
  "./node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/**",
];

const nextConfig: NextConfig = {
  // Native/wasm deps must stay external — bundling breaks their worker + binary
  // loading. pdf-parse (pdfjs worker + @napi-rs/canvas) and tesseract.js (wasm
  // core + lang data) both do runtime file/worker loading.
  serverExternalPackages: ["pdf-parse", "tesseract.js", "@napi-rs/canvas"],

  // Vercel's file tracer misses @napi-rs/canvas's platform .node binary because
  // it's a *transitive* dep of the external pdf-parse and loaded via dynamic
  // require. Without the binary the lambda's require("@napi-rs/canvas") fails,
  // so pdf-parse never sets globalThis.DOMMatrix and PDF parsing throws
  // "ReferenceError: DOMMatrix is not defined". Force the binaries in. Local
  // dev is unaffected (full node_modules present).
  // Force the PDF native deps into the lambda. pdf-parse's transitive deps
  // (@napi-rs/canvas for the DOMMatrix polyfill; pdfjs-dist's dynamically
  // imported pdf.worker.mjs) aren't seen by Vercel's file tracer, so without
  // this they're dropped and PDF parsing dies at runtime.
  //
  // Scope to ONLY the two routes that touch pdf-parse — NOT "/**". A "/**" key
  // bloats EVERY route's function with these heavy binaries, which pushes each
  // past Vercel's per-lambda size cap so its auto-merge of small functions
  // fails; the app then ships 21 separate functions and blows the Hobby
  // 12-function limit. Narrow scope keeps the other ~19 routes small and
  // mergeable.
  outputFileTracingIncludes: {
    "/admin/jobs/[id]/candidates": PDF_TRACE_INCLUDES,
    "/api/jobs/parse-jd": PDF_TRACE_INCLUDES,
  },
};

export default nextConfig;
