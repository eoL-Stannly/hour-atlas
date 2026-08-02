# Stannly

A travel journal built around photographs. Each entry is a set of frames from
one place, an honest review of whether it was worth going, and the exposure
details under every picture.

Live: https://fuiyoh.netlify.app

## How it is put together

- **Eleventy 3** static site. One entry file drives the home feed, the entry
  pages, the contact sheet, the footer and the sitemap.
- **GSAP + ScrollTrigger** for the opening sequence, the clip-path wipes and
  the in-frame parallax. **Lenis** for smooth scrolling.
- Photographs are resized at build prep time into 900px and 2000px versions
  and served with `srcset`. Every frame carries a 24px base64 blur-up so the
  layout never shifts while an image loads.
- No framework, no CSS build step, no client-side routing.

## Structure

    /                                   journal feed
    /journal/{entry}/                   a written entry with its frames
    /destinations/                      all regions
    /destinations/{region}/             countries in a region
    /destinations/{region}/{country}/   country facts, places within it
    /destinations/{region}/{country}/{place}/
    /stays/                             all stay types
    /stays/{type}/                      camping, hotel, rural, hot-tub,
                                        sauna, forest, beach, pool
    /stay/{slug}/                       one stay, reviewed
    /contact-sheet/                     every frame

Stay *types* live under `/stays/`, individual stays under `/stay/`. The
singular and plural keep the two namespaces from colliding.

The directory graph is assembled in `src/_data/atlas.js` from the plain
content files in `content/`. Children carry their parents' names as strings
rather than object references, so nothing in the graph is circular.

## Content

Journal entries and frames live in two data files.

`src/_data/entries.js` holds the journal. Each entry carries its place, dates,
prose, verdict, score out of five, where I stayed, and the list of frame
references it uses.

`src/_data/frames.js` merges two sources into one shape:

- `photos.json`, generated from real camera JPEGs, carrying real EXIF
- `plates.json`, generated placeholder artwork for entries that have no
  photographs yet

Alt text and captions are written by hand in `frames.js`, one per frame.

### Placeholders

Entries flagged `placeholder: true` are filler. Their pictures are drawn
rather than photographed and their words are invented. To replace one:

1. Add the JPEGs to `tools/` input and re-run the photo script
2. Swap the `plate-*` references in the entry for the new frame refs
3. Delete the `placeholder: true` flag and write the real entry

## Tools

Run both from the repo root. `tools/process_photos.py` resizes camera JPEGs, pulls EXIF and writes
`photos.json`. `tools/make_plates.py` draws the placeholder plates and writes
`plates.json`. Both are deterministic and only need re-running when the
pictures change, so their output is committed.

## Running it

```bash
npm install
npm start          # dev server on localhost:8080
npm run build      # writes to _site/
```

## Accessibility

`prefers-reduced-motion` disables Lenis, the parallax, the wipes and every
reveal. The lightbox is keyboard driven, with arrow keys and escape, and
returns focus to whatever opened it. Every frame has written alt text.
