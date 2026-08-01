# Hour Atlas

Six holiday destinations arranged by the hour their light is best, with the
cabins, riads, ryokan and villas worth booking in each. A concept site: the
places, seasons and flight times are real, the properties are illustrative.

Live: https://hour-atlas.netlify.app

## The idea

Most travel sites sort by country or by price. This one sorts by time of day.
The six destinations run from Lofoten at 00:14 under the midnight sun to
Santorini at 19:42, and the page background is a sky that keeps pace with the
list: the gradient, the sun's position and the clock in the masthead are all
interpolated between destinations on scroll.

There are no photographs. Skylines are hand-drawn SVG silhouettes and every
colour on the page comes from the sky layer, so the palette is a single
monochrome frame of ink and chalk with all hue supplied by the hour.

## Stack

- [Eleventy 3](https://www.11ty.dev/) for static generation, with destination
  pages built by pagination from one data file
- [GSAP](https://gsap.com/) + ScrollTrigger for the reveal and parallax work
- [Lenis](https://lenis.darkroom.engineering/) for smooth scrolling
- No build step for CSS or JS, no framework, no client-side routing
- Netlify for hosting

## Running it

```bash
npm install
npm start          # dev server on localhost:8080
npm run build      # writes to _site/
```

## Editing content

Everything lives in `src/_data/destinations.js`. Each entry carries its copy,
its stays, its palette (`sky`, `ink`, `sun`) and its two SVG horizon layers.
Add an entry and the home page section, the detail page, the stays index, the
sitemap and the sky keyframes all follow. Keep `minutes` in step with `time`,
and keep the array ordered by `minutes` so the day still runs forwards.

## Accessibility

`prefers-reduced-motion` disables Lenis, the parallax, the grain and every
reveal, and the page renders in full. Focus states are visible throughout, and
the layout is readable without JavaScript.
