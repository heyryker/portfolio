"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { landingWasShown } from "./LandingMarker";
import { wipeOut } from "./wipe";

/** Set when a case study is open over another page; null on its own page. */
const OverlayContext = createContext<{ close: () => void } | null>(null);

export function useCaseStudyOverlay() {
  return useContext(OverlayContext);
}

/**
 * A case study opened from inside the site: it covers the page underneath
 * (usually the landing page, with its meeples) instead of replacing it, while
 * the URL still changes to /work/<slug>. It wipes up when it opens and back
 * down however it closes, the browser's back button included (see wipe.ts).
 *
 * While it's open the page beneath is inert, which also pauses the meeples,
 * so they pick up exactly where they were when it closes.
 */
export function CaseStudyOverlay({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const scrollTop = useRef(0);

  const close = useCallback(() => {
    // Back to the page it was opened from, so the history stays tidy. If the
    // landing page never loaded (the visitor arrived on a case study's own
    // URL), there's nothing to go back to, so go there instead.
    if (landingWasShown()) router.back();
    else router.push("/");
  }, [router]);

  useEffect(() => {
    const node = ref.current;
    const page = document.querySelector<HTMLElement>("[data-page]");
    const opener = document.activeElement as HTMLElement | null;
    page?.setAttribute("inert", "");
    document.documentElement.style.overflow = "hidden";
    node?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      page?.removeAttribute("inert");
      document.documentElement.style.overflow = "";
      if (node) wipeOut(node, scrollTop.current);
      // Hand focus back to the label that opened it.
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [close]);

  return (
    <OverlayContext value={{ close }}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onScroll={(e) => {
          scrollTop.current = e.currentTarget.scrollTop;
        }}
        className="case-wipe-in fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-bg outline-none"
      >
        {children}
      </div>
    </OverlayContext>
  );
}
