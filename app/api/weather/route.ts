import { getSiteWeather } from "@/lib/weather";

/**
 * Logan's current weather (and the relocation cities') for the line under my name (LocalClock.tsx).
 * The answer comes from a cached helper, so this route is prerendered and
 * revalidated every 15 minutes rather than run per visit.
 */
export async function GET() {
  const weather = await getSiteWeather();
  return Response.json(weather);
}
