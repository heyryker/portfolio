import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // /chartahealth is a static mirror of Charta Health's homepage with Ryker's
  // redesign changes (public/chartahealth). It lives outside the app so none
  // of the site's layout, analytics or cookie notice applies to it.
  async rewrites() {
    return [{ source: "/chartahealth", destination: "/chartahealth/index.html" }];
  },
  partialPrefetching: true,
  // Case studies (and later the blog) are MDX files in /content, imported by
  // their routes rather than used as pages, so no `pageExtensions` change.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default createMDX()(nextConfig);
