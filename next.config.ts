import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/wasm deps must stay external — bundling breaks their worker + binary
  // loading. pdf-parse (pdfjs worker + @napi-rs/canvas) and tesseract.js (wasm
  // core + lang data) both do runtime file/worker loading.
  //
  // NOTE: pdf-parse's runtime deps (pdfjs worker, @napi-rs/canvas binary) are
  // pulled into the Vercel lambdas by the file-tracing anchor imports in
  // lib/screening/extract.ts — NOT via outputFileTracingIncludes. Glob
  // includes broke two ways here: "/**" keys bloat every function over the
  // Hobby 12-function limit, and route keys containing [id] are parsed as
  // glob character classes so they never match their route.
  serverExternalPackages: ["pdf-parse", "tesseract.js", "@napi-rs/canvas", "pdfjs-dist"],
};

export default nextConfig;
