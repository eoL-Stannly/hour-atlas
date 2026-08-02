import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* A short content hash on the stylesheet URL, so the asset can be cached
   for a year and still update the moment it changes. */
const css = path.join(path.dirname(fileURLToPath(import.meta.url)), "../assets/main.css");

export default {
  css: "/assets/main.css?v=" + createHash("sha1").update(fs.readFileSync(css)).digest("hex").slice(0, 8),
};
