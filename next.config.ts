import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The link-preview image reads these font files; make sure they ship with it.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-*.woff"],
  },
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
