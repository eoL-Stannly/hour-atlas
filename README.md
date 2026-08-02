# Ali Cook

A gazetteer of places worth going to. Countries, places within them, and
places to stay, each scored out of five on one question: would I tell someone
else to go?

Live: https://fuiyoh.netlify.app

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
