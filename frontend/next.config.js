/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    optimizeCss: false, // disable Lightning CSS
  },
};

module.exports = nextConfig;
