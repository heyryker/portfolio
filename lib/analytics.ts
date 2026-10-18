/**
 * Custom analytics events (CLAUDE.md §1): the two actions that
 * matter are a hiring manager contacting Ryker or getting the resume, and
 * the step before that, opening a case study.
 *
 * Event names are short and fixed so they group cleanly in the dashboard.
 * Values are strings only (Vercel drops nested data).
 *
 * Each event goes to both Vercel and Google Analytics. Vercel only shows
 * custom events on the Pro plan, so on Hobby GA is where they're readable.
 */
import { track } from "@vercel/analytics";

export type EventName =
  | "Case study open"
  | "Resume"
  | "Email click"
  | "Email copy"
  | "Phone click"
  | "Profile click"
  | "Meeple play";

export function trackEvent(name: EventName, data: Record<string, string> = {}) {
  send(name, data);
}

function send(name: EventName, data: Record<string, string>) {
  track(name, data);
  // GA event names are snake_case by convention: "Case study open" -> case_study_open.
  window.gtag?.("event", name.toLowerCase().replace(/ /g, "_"), data);
}

/**
 * Track an event at most once per browser tab session. Used for meeple play,
 * which can fire dozens of times a minute and would otherwise eat the
 * analytics event allowance.
 */
export function trackOnce(name: EventName, key: string, data: Record<string, string> = {}) {
  const storageKey = `tracked:${name}:${key}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
  } catch {
    // Storage blocked (private mode, etc.): fall through and track anyway.
  }
  send(name, data);
}
