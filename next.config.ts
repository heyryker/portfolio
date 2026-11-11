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
  // Always revalidate the concept page so edits show up without a hard refresh
  // (its stylesheet, script and illustrations carry content-hash query strings).
  async headers() {
    return [{ source: "/chartahealth", headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }] }];
  },
  // The Motion case study was split into TRON partner ads and Lucid Suite
  // videos. Old links land on the TRON one, which had most of the old page.
  // Not permanent, so browsers don't cache it if the slug is ever reused.
  async redirects() {
    return [
      { source: "/work/motion", destination: "/work/tron-partner-ads", permanent: false },
      // Lately @ Lucid moved from the blog to the case studies on 2026-11-11.
      { source: "/blog/lately-at-lucid", destination: "/work/lately-at-lucid", permanent: false },
    ];
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
