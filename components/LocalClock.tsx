"use client";

import { useEffect, useRef, useState } from "react";
import { RELOCATION_CITIES } from "@/lib/relocation";
import type { SiteWeather } from "@/lib/weather";

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
 * Hovering the block (or tapping it on a phone) swaps the date and time for
 * "Open to relocation" with the yellow highlighter, and the weather line
 * flips through the cities I'd move to, each with its own weather. The
 * yellow is the marker bar behind ink text, not yellow text: yellow letters
 * on white can't be read (see the accent note in globals.css). Screen
 * readers get the same news as a sentence, without needing the hover.
 *
 * The time depends on the visitor's clock, so the server renders a blank of
 * the same shape and the client fills it in after hydration; nothing shifts.
 * The blank's sample text lives in a data attribute drawn by CSS, not in the
 * HTML text: crawlers and answer engines read the server HTML, and they
 * were picking up a made-up date and "34°F and partly cloudy" as facts.
 */
export function LocalClock() {
  const [now, setNow] = useState<Date | null>(null);
  // undefined while loading, null if the weather couldn't be fetched.
  const [weather, setWeather] = useState<SiteWeather | null | undefined>(undefined);
  const [relocating, setRelocating] = useState(false);
  const [cityIndex, setCityIndex] = useState(0);
  const clockRef = useRef<HTMLParagraphElement>(null);
  const lastPointer = useRef<string>("mouse");

  // Logan's weather comes from /api/weather, which the server caches for 15
  // minutes, so this is a cheap cached response rather than a call to
  // Open-Meteo per visit.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: SiteWeather | null) => {
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

  // Each showing starts from the first city.
  const showRelocation = (on: boolean) => {
    if (on) setCityIndex(0);
    setRelocating(on);
  };

  // While the relocation note shows, step through the cities.
  useEffect(() => {
    if (!relocating) return;
    const id = window.setInterval(
      () => setCityIndex((i) => (i + 1) % RELOCATION_CITIES.length),
      CITY_MS,
    );
    return () => window.clearInterval(id);
  }, [relocating]);

  // On a phone the note is toggled by a tap, so a tap anywhere else puts the
  // clock back.
  useEffect(() => {
    if (!relocating) return;
    const away = (event: PointerEvent) => {
      if (!clockRef.current?.contains(event.target as Node)) setRelocating(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [relocating]);

  if (!now) {
    return (
      <p className="local-clock" aria-hidden="true" data-nosnippet="">
        <span className="local-clock-blank invisible" data-shape={"Wednesday, September 30\nUtah, 10:00:00 AM"} />
        <span className="local-weather local-clock-blank invisible" data-shape="34°F and partly cloudy" />
      </p>
    );
  }

  const city = RELOCATION_CITIES[cityIndex].name;
  const cityWeather = weather?.cities?.find((entry) => entry.name === city);

  return (
    <p
      ref={clockRef}
      className="local-clock"
      data-relocating={relocating ? "" : undefined}
      onPointerDown={(event) => {
        lastPointer.current = event.pointerType;
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") showRelocation(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") showRelocation(false);
      }}
      onClick={() => {
        if (lastPointer.current === "touch") showRelocation(!relocating);
      }}
    >
      <span className="local-clock-swap">
        <time dateTime={now.toISOString()} className="local-clock-now">
          {dateFormat.format(now)}
          <br />
          Utah, {timeFormat.format(now)}
        </time>
        <span className="local-clock-relocate" aria-hidden="true">
          <span className="local-clock-marker">Open to</span>
          <br />
          <span className="local-clock-marker">relocation</span>
        </span>
      </span>
      {weather !== null && (
        // Kept invisible (same shape) until the weather arrives, so the line
        // doesn't pop in and push things down.
        <span
          className={weather ? "local-weather" : "local-weather local-clock-blank invisible"}
          aria-hidden={weather ? (relocating ? true : undefined) : true}
          data-shape={weather ? undefined : "34°F and partly cloudy"}
        >
          {weather &&
            (relocating ? (
              <span key={city} className="local-weather-city">
                {city}
                {cityWeather && `, ${describeWeather(cityWeather)}`}
              </span>
            ) : (
              describeWeather(weather)
            ))}
        </span>
      )}
      <span className="sr-only">
        {" "}
        Open to relocating to {listCities()}.
      </span>
    </p>
  );
}

/** How long each city stays on the weather line while hovered. */
const CITY_MS = 1600;

function describeWeather(weather: { temperature: number; conditions: string }) {
  return `${weather.temperature}°F${weather.conditions ? ` and ${weather.conditions}` : ""}`;
}

/** "San Francisco, New York, Portland or Austin". */
function listCities() {
  const names = RELOCATION_CITIES.map((city) => city.name);
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}
