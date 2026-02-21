import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Silence "Critical dependency" warnings from three.js internals */
  webpack: (config) => {
    config.module = config.module ?? {};
    config.module.unknownContextCritical = false;
    return config;
  },
};

export default nextConfig;
