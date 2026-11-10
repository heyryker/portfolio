"use client";

import { useEffect, useState } from "react";

const ZONE = "America/Denver";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZoneName: "short",
});

function read(now: Date) {
  const parts = timeFormat.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: dateFormat.format(now),
    hour: get("hour"),
    minute: get("minute"),
    period: get("dayPeriod"),
    zone: get("timeZoneName"),
    iso: now.toISOString(),
  };
}

/**
 * Today's date and my local time in Utah, live, under my name on the landing
 * page (after studio sites that show where they are and what time it is
 * there). It tells a recruiter at a glance whether I'm awake.
 *
 * The time depends on the visitor's clock, so the server renders a blank of
 * the same shape and the client fills it in after hydration; nothing shifts.
 * The colon blinks unless the visitor prefers reduced motion (see
 * `.local-clock` in globals.css).
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
    <p className="local-clock">
      <span>Utah</span>
      <span aria-hidden="true">·</span>
      {now ? (
        <time dateTime={now.iso}>
          {now.date}
          <span aria-hidden="true"> · </span>
          {now.hour}
          <span className="local-clock-colon">:</span>
          {now.minute} {now.period} {now.zone}
        </time>
      ) : (
        // Same shape as a real date and time, invisible, so the width is right.
        <span className="invisible">Tue, Nov 10 · 10:00 AM MST</span>
      )}
    </p>
  );
}
