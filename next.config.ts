import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@zxing/browser"],
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
