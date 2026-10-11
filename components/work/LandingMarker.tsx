"use client";

import { useEffect } from "react";

let shown = false;

/** True once the landing page has rendered in this tab (no full reload since). */
export function landingWasShown() {
  return shown;
}

/**
 * Rendered on the landing page so a case study opened over it knows that
 * "close" can simply go back in history.
 */
export function LandingMarker() {
  useEffect(() => {
    shown = true;
  }, []);
  return null;
}
