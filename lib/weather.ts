import { cacheLife } from "next/cache";

/** Logan, Utah (Cache Valley), where I live. */
const LOGAN = { latitude: 41.737, longitude: -111.834 };

export type LoganWeather = {
  /** Whole degrees Fahrenheit. */
  temperature: number;
  /** A short, lowercase description, e.g. "light snow" (empty if unknown). */
  conditions: string;
};

/**
 * WMO weather codes as Open-Meteo reports them, in plain words that read
 * well after "and": "Logan, 34°F and light snow".
 * https://open-meteo.com/en/docs#weather_variable_documentation
 */
function describe(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? "sunny" : "clear";
  if (code === 1) return isDay ? "mostly sunny" : "mostly clear";
  if (code === 2) return "partly cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "foggy";
  if (code >= 51 && code <= 57) return "drizzly";
  if (code === 61 || code === 80) return "light rain";
  if (code === 63 || code === 81) return "rainy";
  if (code === 65 || code === 82) return "pouring";
  if (code === 66 || code === 67) return "freezing rain";
  if (code === 71 || code === 85) return "light snow";
  if (code === 73 || code === 77) return "snowy";
  if (code === 75 || code === 86) return "heavy snow";
  if (code >= 95) return "stormy";
  return "";
}

/**
 * Current weather in Logan from Open-Meteo (free, no key). Cached on the
 * server so Open-Meteo is asked at most every 15 minutes no matter how many
 * people visit; every visitor in between gets the cached answer. Returns
 * null when Open-Meteo can't be reached, and the line under my name simply
 * leaves the weather out.
 */
export async function getLoganWeather(): Promise<LoganWeather | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 86_400 });

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LOGAN.latitude));
  url.searchParams.set("longitude", String(LOGAN.longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,is_day");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", "America/Denver");

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      current?: { temperature_2m?: number; weather_code?: number; is_day?: number };
    };
    const current = data.current;
    if (typeof current?.temperature_2m !== "number" || typeof current.weather_code !== "number") {
      return null;
    }
    return {
      temperature: Math.round(current.temperature_2m),
      conditions: describe(current.weather_code, current.is_day !== 0),
    };
  } catch {
    return null;
  }
}
