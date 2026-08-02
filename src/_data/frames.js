import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, f), "utf8"));

const photos = read("photos.json");
const plates = read("plates.json");

// Written per frame rather than generated, because alt text that describes
// nothing is worse than none at all.
const described = {
  "310A8215": {
    alt: "Hogwarts Castle at Islands of Adventure, towers and spires rising from a rock outcrop under flat grey cloud, dark conifers along the bottom of the frame.",
    caption: "The grey sky I spent all evening resenting, doing the work.",
  },
  "310A8058": {
    alt: "Spaceship Earth lit in blue and green at night, seen down the Epcot entrance plaza, with the monorail beam cutting across the left of the frame and a woman in a yellow dress walking away from camera.",
    caption: "Handheld at 1/30. The monorail beam and the yellow dress were both luck.",
  },
  "310A8067": {
    alt: "Spaceship Earth lit in pink and gold against a black sky, framed by the silhouettes of dark trees.",
    caption: "Same sphere, twelve minutes later, entirely different building.",
  },
  "310A8169": {
    alt: "The Betty Boop store at Universal Studios Florida, with a giant purple piano, a comic strip mural and a palm tree against a bright blue sky.",
    caption: "Hard midday sun, which for once is the correct light for the subject.",
  },
  "plate-lagoon": { alt: "Placeholder plate: a turquoise lagoon under high sun, with palms at the edge of the frame.", caption: "Placeholder plate. Awaiting a frame." },
  "plate-sunset-beach": { alt: "Placeholder plate: an orange sunset over the sea with palm trees in silhouette.", caption: "Placeholder plate. Awaiting a frame." },
  "plate-headland": { alt: "Placeholder plate: a headland dropping into deep blue water in afternoon light.", caption: "Placeholder plate. Awaiting a frame." },
  "plate-alpine-lake": { alt: "Placeholder plate: a cold alpine lake with cloud sitting below the peaks.", caption: "Placeholder plate. Awaiting a frame." },
  "plate-overwater": { alt: "Placeholder plate: villas on stilts over an atoll at dusk, under a pink and purple sky.", caption: "Placeholder plate. Awaiting a frame." },
  "plate-dune": { alt: "Placeholder plate: a desert dune ridge in low sun.", caption: "Placeholder plate. Awaiting a frame." },
  "plate-jungle": { alt: "Placeholder plate: a misty green jungle gorge in flat morning light.", caption: "Placeholder plate. Awaiting a frame." },
};

// One shape for both, so templates never have to know which is which.
const frames = {};

for (const [ref, p] of Object.entries(photos)) {
  frames[ref] = {
    ...p,
    ...(described[ref] || { alt: "", caption: "" }),
    placeholder: false,
    srcset: `${p.src}-900.jpg 900w, ${p.src}-2000.jpg 2000w`,
    fallback: `${p.src}-2000.jpg`,
  };
}

for (const [ref, p] of Object.entries(plates)) {
  frames[ref] = {
    ...p,
    ...(described[ref] || { alt: "", caption: "" }),
    exif: null,
    srcset: `${p.src}.jpg ${p.w}w`,
    fallback: `${p.src}.jpg`,
  };
}

export default frames;
