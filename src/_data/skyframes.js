import destinations from "./destinations.js";

// Only the values the sky engine needs at runtime, so the horizon path data
// does not get shipped twice on every page.
export default destinations.map((d) => ({
  slug: d.slug,
  name: d.name,
  minutes: d.minutes,
  ink: d.ink,
  sky: d.sky,
  sun: d.sun,
}));
