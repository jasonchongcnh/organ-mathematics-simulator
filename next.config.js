/** @type {import('next').NextConfig} */
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
