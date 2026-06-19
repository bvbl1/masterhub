import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /** Declares Turbopack for `next dev`; avoids conflict with custom `webpack` below (Next 16 defaults to Turbopack). */
  turbopack: {},
  /** Lower peak RAM during `next build --webpack` (helps Docker / small CI runners). */
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/masterhub-media/**",
      },
    ],
  },
};

export default nextConfig;
