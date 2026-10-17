import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deploys build into a side folder, then swap it in (see scripts/deploy.sh).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // a stray package-lock.json in the home folder must not be taken as the workspace root
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
