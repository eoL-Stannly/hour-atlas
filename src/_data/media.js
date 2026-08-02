import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, f), "utf8"));

/* Photographs and drawn plates share one shape, so any slot in the layout
   takes either. A photograph always wins where one exists. */
const plates = read("plates.json");
const photos = read("photos.json");

export default { ...plates, ...photos };
