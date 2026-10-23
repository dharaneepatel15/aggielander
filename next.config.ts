import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve the Aggielander single-page app (public/aggielander.html) at the root URL.
  async rewrites() {
    return [{ source: "/", destination: "/aggielander.html" }];
  },
  cacheComponents: true,
  partialPrefetching: true,
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
