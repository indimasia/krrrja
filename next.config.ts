import type { NextConfig } from "next";

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
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/@napi-rs/canvas/**",
      "./node_modules/@napi-rs/canvas-*/**",
      // pdfjs-dist ships its worker as a dynamically-imported .mjs
      // (legacy/build/pdf.worker.mjs). It's a transitive dep of the external
      // pdf-parse, so the tracer never sees the static reference and drops the
      // worker + its build files from the lambda — "Cannot find module
      // .../pdf.worker.mjs". Force the whole package in. Glob both the
      // symlinked path and the real pnpm store path.
      "./node_modules/pdfjs-dist/**",
      "./node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/**",
    ],
  },
};

export default nextConfig;
