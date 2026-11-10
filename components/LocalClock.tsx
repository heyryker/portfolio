"use client";

import { useEffect, useState } from "react";
import type { LoganWeather } from "@/lib/weather";

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
 * Under it, smaller and gray, the weather in Logan, where I live.
 *
 * The time depends on the visitor's clock, so the server renders a blank of
 * the same shape and the client fills it in after hydration; nothing shifts.
 */
export function LocalClock() {
  const [now, setNow] = useState<Date | null>(null);
  // undefined while loading, null if the weather couldn't be fetched.
  const [weather, setWeather] = useState<LoganWeather | null | undefined>(undefined);

  // Logan's weather comes from /api/weather, which the server caches for 15
  // minutes, so this is a cheap cached response rather than a call to
  // Open-Meteo per visit.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: LoganWeather | null) => {
        if (!cancelled) setWeather(data && typeof data.temperature === "number" ? data : null);
      })
      .catch(() => {
        if (!cancelled) setWeather(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        <span className="local-weather invisible">34°F and partly cloudy</span>
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
      {weather !== null && (
        // Kept invisible (same shape) until the weather arrives, so the line
        // doesn't pop in and push things down.
        <span
          className={weather ? "local-weather" : "local-weather invisible"}
          aria-hidden={weather ? undefined : true}
        >
          {weather
            ? `${weather.temperature}°F${weather.conditions ? ` and ${weather.conditions}` : ""}`
            : "34°F and partly cloudy"}
        </span>
      )}
    </p>
  );
}
