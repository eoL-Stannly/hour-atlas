import rawRegions from "../../content/regions.js";
import rawCountries from "../../content/countries.js";
import rawPlaces from "../../content/places.js";
import rawTypes from "../../content/stay-types.js";
import rawStays from "../../content/stays.js";
import entries from "./entries.js";

/* Builds the directory graph once, at build time. Children carry their
   parents' names as plain strings rather than object references, so
   nothing here is circular and templates can walk it in either direction. */

const byslug = (list) => Object.fromEntries(list.map((x) => [x.slug, x]));

const regionsBySlug = byslug(rawRegions);
const countriesBySlug = byslug(rawCountries);
const placesBySlug = byslug(rawPlaces);
const typesBySlug = byslug(rawTypes);

const countryUrl = (c) => `/destinations/${c.region}/${c.slug}/`;
const placeUrl = (p) => {
  const c = countriesBySlug[p.country];
  return `/destinations/${c.region}/${c.slug}/${p.slug}/`;
};

// --- stays -----------------------------------------------------------
const stays = rawStays.map((s) => {
  const place = placesBySlug[s.place];
  const country = countriesBySlug[place.country];
  return {
    ...s,
    url: `/stay/${s.slug}/`,
    placeName: place.name,
    placeUrl: placeUrl(place),
    countryName: country.name,
    countrySlug: country.slug,
    countryUrl: countryUrl(country),
    regionSlug: country.region,
    regionName: regionsBySlug[country.region].name,
    typeObjects: s.types
      .map((t) => typesBySlug[t])
      .filter(Boolean)
      .map((t) => ({ slug: t.slug, name: t.name, url: `/stays/${t.slug}/` })),
    frameCount: (s.frames || []).length,
  };
});

const staysForPlace = (slug) => stays.filter((s) => s.place === slug);

// --- places ----------------------------------------------------------
const places = rawPlaces.map((p) => {
  const country = countriesBySlug[p.country];
  const own = staysForPlace(p.slug);
  return {
    ...p,
    url: placeUrl(p),
    countryName: country.name,
    countryUrl: countryUrl(country),
    regionSlug: country.region,
    regionName: regionsBySlug[country.region].name,
    stays: own,
    stayCount: own.length,
    fromPrice: own.length ? Math.min(...own.map((s) => s.price)) : null,
    entries: entries
      .filter((e) => e.placeSlug === p.slug)
      .map((e) => ({ slug: e.slug, place: e.place, title: e.place, month: e.month, url: `/journal/${e.slug}/` })),
  };
});

const placesForCountry = (slug) => places.filter((p) => p.country === slug);

// --- countries -------------------------------------------------------
const countries = rawCountries.map((c) => {
  const own = placesForCountry(c.slug);
  const stayCount = own.reduce((n, p) => n + p.stayCount, 0);
  return {
    ...c,
    url: countryUrl(c),
    regionSlug: c.region,
    regionName: regionsBySlug[c.region].name,
    places: own,
    placeCount: own.length,
    stayCount,
  };
});

// --- regions ---------------------------------------------------------
const regions = rawRegions.map((r) => {
  const own = countries.filter((c) => c.region === r.slug);
  return {
    ...r,
    url: `/destinations/${r.slug}/`,
    countries: own,
    countryCount: own.length,
    placeCount: own.reduce((n, c) => n + c.placeCount, 0),
    stayCount: own.reduce((n, c) => n + c.stayCount, 0),
  };
});

// --- stay types ------------------------------------------------------
const types = rawTypes.map((t) => {
  const own = stays.filter((s) => s.types.includes(t.slug));
  return {
    ...t,
    url: `/stays/${t.slug}/`,
    stays: own,
    stayCount: own.length,
    fromPrice: own.length ? Math.min(...own.map((s) => s.price)) : null,
  };
});

export default {
  regions,
  countries,
  places,
  stays,
  types,
  totals: {
    regions: regions.length,
    countries: countries.length,
    places: places.length,
    stays: stays.length,
    types: types.length,
  },
};
