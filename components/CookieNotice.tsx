"use client";

import { useState, useSyncExternalStore } from "react";
import { GA_MEASUREMENT_ID } from "@/lib/site";

const STORAGE_KEY = "ga-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/*
 * The opt-in notice for GA cookies, shown only to visitors who look like
 * they're in Europe. GA enforces the consent default by the visitor's real
 * location (components/GoogleAnalytics.tsx); the static site can't read that,
 * so the notice goes by the browser's time zone instead. A European time zone
 * outside the EU just sees an unneeded notice; nobody gets cookies they
 * didn't agree to either way.
 */
function looksEuropean() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone.startsWith("Europe/");
  } catch {
    return false;
  }
}

function needsAsking() {
  if (!GA_MEASUREMENT_ID || !looksEuropean()) return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === null;
  } catch {
    // Storage blocked: ask every visit rather than never.
    return true;
  }
}

// Nothing to subscribe to: the answer only changes through this component.
const subscribe = () => () => {};

export function CookieNotice() {
  // Read on the client only; the static HTML never includes the notice.
  const ask = useSyncExternalStore(subscribe, needsAsking, () => false);
  const [answered, setAnswered] = useState(false);

  if (!ask || answered) return null;

  const answer = (choice: "granted" | "denied") => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {}
    if (choice === "granted") window.gtag?.("consent", "update", { analytics_storage: "granted" });
    setAnswered(true);
  };

  return (
    <div className="cookie-notice" role="region" aria-label="Cookie notice">
      {/* TODO(ryker): approve line */}
      <p>I count visits with Google Analytics. Okay to set a cookie?</p>
      <div className="cookie-notice-actions">
        <button type="button" onClick={() => answer("granted")}>
          Sure
        </button>
        <button type="button" onClick={() => answer("denied")}>
          No thanks
        </button>
      </div>
    </div>
  );
}
