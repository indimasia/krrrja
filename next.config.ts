import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/wasm deps must stay external — bundling breaks their worker + binary
  // loading. pdf-parse (pdfjs worker + @napi-rs/canvas) and tesseract.js (wasm
  // core + lang data) both do runtime file/worker loading.
  serverExternalPackages: ["pdf-parse", "tesseract.js", "@napi-rs/canvas"],
};

export default nextConfig;
