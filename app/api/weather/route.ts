import { getLoganWeather } from "@/lib/weather";

/**
 * Logan's current weather for the line under my name (LocalClock.tsx).
 * The answer comes from a cached helper, so this route is prerendered and
 * revalidated every 15 minutes rather than run per visit.
 */
export async function GET() {
  const weather = await getLoganWeather();
  return Response.json(weather);
}
