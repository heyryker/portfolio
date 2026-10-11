"use client";

import { useEffect, useRef } from "react";
import { wipeOut } from "./wipe";

/**
 * Wraps a case study on its own URL so leaving it (back to the landing page,
 * say) wipes it down like closing the overlay does. It arrives without a wipe,
 * since it's what a shared link opens.
 */
export function WipeOnLeave({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    let scrollY = window.scrollY;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (node) wipeOut(node, scrollY);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
