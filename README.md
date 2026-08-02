# Ali Cook

A gazetteer of places worth going to. Countries, places within them, and
places to stay, each scored out of five on one question: would I tell someone
else to go?

Live: https://fuiyoh.netlify.app

## The homepage rule

The homepage only ever shows real photographs, never a drawn plate. It pulls
directly from the handful of places, stays and journal entries that carry a
real `image`, rather than from "top rated" or "recently added" queries that
could silently surface a plate as soon as content changes. Sections with
nothing real to show yet (browse by type, browse by continent) are plain text
link rows instead of image tiles, so there is never a partial grid of some
photographs and some illustrations sitting side by side.

Everywhere else on the site, plates still fill in for places without a
photograph yet, captioned as such.

## Why it looks like this

An image-led magazine layout, in the family of Oneika the Traveller and The
Blonde Abroad: full-bleed hero with the headline over it, three-up featured
cards, image tiles for every category, an about block, a newsletter band. It
replaced an index-style listing design that read, fairly, like a menu.

Warm paper, deep sea teal, ink. Georgia carries the headlines with italics
on the accent words; the system sans is reserved for eyebrows, buttons and
anything that behaves like a label. The signature is the score stamp: a
rotated passport-style roundel on every card carrying the mark out of five.

Images come from two sources and share one shape, so either can fill any slot:

- **Photographs**, prepared by `tools/process_photos.py` into wide, square and
  portrait crops. Real, and captioned with what they show.
- **Plates**, drawn by `tools/make_plates.py`, standing in wherever there is
  no photograph yet. Captioned "drawn plate, not a photograph" on every page
  they appear on.

`src/_data/media.js` merges both into one lookup. A place, stay or journal
entry with an `image` key uses that photograph; anything without falls back to
its generated plate, and the plate caption appears automatically. Add a
`gallery` array of media keys and the page grows a captioned photo grid.

Original camera files live in `tools/input/` and are not committed.

Plates are deterministic. `tools/plate-jobs.json` maps every place, stay type
and stay to a scene and a seed, so the same slug always draws the same plate
and regenerating produces no diff. Eight scenes: coast, atoll, fjord,
mountain, forest, moor, dune, city.

Each plate is drawn three times, at wide, square and portrait, rather than
cropped from one master, so the horizon sits correctly in a banner, a tile
and a card alike.

## Performance

The site is static HTML with **one stylesheet and no JavaScript at all**. No
web fonts, no CDN, no analytics, no third-party requests, even with the
layout now leaning on imagery. Plates are WebP, roughly 8 KB each, served
with `srcset` and explicit width and height plus a 20px blur-up, so nothing
shifts as they load. The newsletter form posts to Netlify Forms and needs no
JavaScript.

An earlier version hid most of the page behind `opacity: 0` and only revealed
it once GSAP had loaded from a CDN, which meant that if the CDN was blocked or
slow the page rendered as headings and empty space. Nothing on this site is
hidden by default. That is a rule, not a preference.

Typography uses the system stack: the platform UI face for display, Georgia
for reading copy, the platform monospace for data. Nothing is downloaded.

The stylesheet URL carries a content hash so it can be cached for a year and
still update the moment it changes.

## JavaScript

The site is no longer zero-script. Two small, dependency-free vanilla JS
files were added, both written for this site rather than pulled from a CDN:

- `assets/js/lightbox.js` (site-wide) — click any photograph tagged
  `data-lightbox="group"` to expand it, with keyboard, on-screen and swipe
  navigation between every other image sharing that group. Everything still
  works without it; images are ordinary `<img>` tags in the document flow.
- `assets/js/globe.js` (destinations index only) — a canvas-drawn rotating
  globe using plain orthographic projection maths, no WebGL and no library.
  Auto-rotates, drag to spin, click a mark to visit that country. The marks
  are real `<a>` elements the script only repositions, so they stay
  keyboard-reachable, and a flat, always-clickable 2D map sits underneath as
  a fallback that needs no script at all.

Still true: no web fonts, no analytics, no CDN, no third-party requests.

## Structure

    /                                    front page
    /destinations/                       all regions
    /destinations/{region}/              countries in a region
    /destinations/{region}/{country}/    country record, places within it
    /destinations/{region}/{country}/{place}/
    /stays/                              all stay types
    /stays/{type}/                       camping, hotel, rural, hot-tub,
                                         sauna, forest, beach, pool
    /stays/{type}/{stay}/                one stay, reviewed
    /journal/                            longer write-ups
    /journal/{entry}/
    /about/

A stay is nested under the **first** entry in its `types` list, and that is
the only URL it ever has. A stay tagged `["forest", "hot-tub", "rural"]` lives
at `/stays/forest/{slug}/` and is listed on all three type pages and on its
place page, every one of them linking to that same address. One canonical per
stay, no faceted duplicates. To refile a stay, reorder its `types` array and
add the old address to the redirect list.

`sitemap.xml` and `robots.txt` are both generated. robots disallows nothing
and points at the sitemap. Every page declares `hreflang` for `en-gb` and
`x-default`, in the head and in the sitemap.

## The map and globe

`tools/build_world_map.py` fetches Natural Earth's 110m land polygons at
build time (not at runtime — nothing is fetched by a visitor's browser),
decimates them for size, and writes two files:

- `src/_data/worldrings.json` — simplified `[lon, lat]` rings, embedded only
  on the destinations page for the globe to project live as it rotates.
- `src/_data/worldpath.json` — the same coastline pre-projected to a flat
  equirectangular SVG path, for the static 2D map. No JavaScript involved.

Country coordinates live on each entry in `content/countries.js` (`lat`,
`lng`). `atlas.js` projects them to a flat-map percentage position at build
time; the globe projects the same numbers live, client-side, as it turns.

One thing worth knowing about the globe's rendering: several of Natural
Earth's landmasses (Africa+Eurasia, the Americas) are a single polygon each,
spanning more longitude than any one hemisphere can show at once. The globe
draws each contiguous *visible* run of a landmass's points as its own shape
rather than requiring the whole polygon to be on-screen, so a supercontinent
crossing the horizon still renders its visible portion instead of vanishing
outright. This was checked by rasterising the exact projection math in
Python before shipping it, at several rotations, rather than assumed.

## Content

Plain data modules in `content/`, assembled into a cross-linked graph by
`src/_data/atlas.js`:

- `regions.js`, `countries.js`, `places.js` — the geography
- `stay-types.js` — the eight browsable types
- `stays.js` — one reviewed stay per entry

Journal entries are separate, in `src/_data/entries.js`, and link to a place
by `placeSlug`. Anything flagged `placeholder: true` is unfinished and is
tagged as such in the interface.

Original photographs are preserved in `photos-archive/` and are not deployed.
`tools/` holds the scripts that resized them, kept for when they come back.

## Running it

```bash
npm install
npm start          # localhost:8080
npm run build      # writes to _site/
```
