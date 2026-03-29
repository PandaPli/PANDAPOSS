import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "pandaposs.com" }],
        destination: "https://www.pandaposs.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
