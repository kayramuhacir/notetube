import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/generate": ["./scripts/render-rtl-pdf.cjs", "./src/fonts/**/*"],
  },
};

export default nextConfig;
