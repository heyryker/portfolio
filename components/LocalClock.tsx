"use client";

import { useEffect, useState } from "react";

const ZONE = "America/Denver";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

/**
 * Today's date and my local time in Utah, ticking every second, under my
 * name (after studio sites like Porto Rocha's, which show the date and the
 * time in their city). It tells a recruiter at a glance whether I'm awake.
 *
 * The time depends on the visitor's clock, so the server renders a blank of
 * the same shape and the client fills it in after hydration; nothing shifts.
 */
export function LocalClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) {
    return (
      <p className="local-clock" aria-hidden="true">
        <span className="invisible">
          Wednesday, September 30
          <br />
          Utah, 10:00:00 AM
        </span>
      </p>
    );
  }

  return (
    <p className="local-clock">
      <time dateTime={now.toISOString()}>
        {dateFormat.format(now)}
        <br />
        Utah, {timeFormat.format(now)}
      </time>
    </p>
  );
}
