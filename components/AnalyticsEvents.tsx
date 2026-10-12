"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { PROFILES, RESUME } from "@/lib/site";

/**
 * One click listener for the whole site, so links in server components
 * (menu, footer, case studies, About) are tracked without each needing to be
 * a client component. It only reads the clicked link; it never changes or
 * delays navigation.
 */
export function AnalyticsEvents() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      const href = link.getAttribute("href") ?? "";
      const from = window.location.pathname;

      if (href === RESUME || href.endsWith(".pdf")) {
        trackEvent("Resume", { action: link.hasAttribute("download") ? "download" : "open", from });
      } else if (href.startsWith("mailto:")) {
        trackEvent("Email click", { from });
      } else if (href.startsWith("tel:")) {
        trackEvent("Phone click", { from });
      } else if (href.startsWith(PROFILES.linkedin) || href.startsWith(PROFILES.github)) {
        trackEvent("Profile click", { site: href.includes("linkedin") ? "linkedin" : "github", from });
      } else {
        const work = /^\/work\/([\w-]+)\/?$/.exec(href);
        if (work) trackEvent("Case study open", { slug: work[1], from });
      }
    };
    // Capture phase, so it still sees clicks that a component stops from bubbling.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
