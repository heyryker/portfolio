"use client";

import { useEffect, useState } from "react";

const ZONE = "America/Denver";

const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const zoneFormat = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, timeZoneName: "short" });

function read(now: Date) {
  const parts = timeFormat.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const zone = zoneFormat.formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "";
  return { hour: get("hour"), minute: get("minute"), period: get("dayPeriod"), zone, iso: now.toISOString() };
}

/**
 * My local time in Utah, live, for the landing page header (after the
 * studio sites that show where they are and what time it is there). It
 * tells a recruiter at a glance whether I'm awake.
 *
 * The time depends on the visitor's clock, so the server renders only the
 * place and the client fills the time in after hydration; the slot keeps its
 * width, so nothing shifts. The colon blinks with the seconds unless the
 * visitor prefers reduced motion (see `.local-clock` in globals.css).
 */
export function LocalClock() {
  const [now, setNow] = useState<ReturnType<typeof read> | null>(null);

  useEffect(() => {
    const tick = () => setNow(read(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="local-clock pointer-events-auto">
      <span>Utah</span>
      <time className="local-clock-time" dateTime={now?.iso} aria-live="off">
        {now ? (
          <>
            {now.hour}
            <span className="local-clock-colon">:</span>
            {now.minute} {now.period}
            <span className="local-clock-zone"> {now.zone}</span>
          </>
        ) : (
          // Same shape as a real time, invisible, so the width is right.
          <span className="invisible">10:00 AM MST</span>
        )}
      </time>
    </p>
  );
}
