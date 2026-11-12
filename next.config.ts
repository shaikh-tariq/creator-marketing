import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kept simple on purpose: pages render per request unless they are fully static.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
