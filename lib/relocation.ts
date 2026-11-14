/**
 * The cities I'd most happily move to, in the order the weather line under
 * my name flips through them while someone hovers the clock (LocalClock.tsx).
 * lib/weather.ts fetches their weather alongside Logan's.
 */
export const RELOCATION_CITIES = [
  { name: "San Francisco", latitude: 37.775, longitude: -122.419 },
  { name: "New York", latitude: 40.713, longitude: -74.006 },
  { name: "Portland", latitude: 45.515, longitude: -122.679 },
  { name: "Austin", latitude: 30.267, longitude: -97.743 },
] as const;
