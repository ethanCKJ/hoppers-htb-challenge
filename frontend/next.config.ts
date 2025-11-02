import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    optimizeCss: false, // ✅ disables lightningcss
  },
};

export default nextConfig;
