"""Prepare real photographs for the web.

Produces the same three shapes as the placeholder plates (wide, square,
portrait) so a photograph can drop into any slot a plate currently fills.
Each shape is centre-cropped with a slight upward bias, because people and
horizons both tend to sit above the middle of a frame.

Run from the repo root:  python3 tools/process_photos.py
"""

import base64
import io
import json
import os

from PIL import Image, ImageOps

SRC = "tools/input"
OUT = "src/assets/photos"
os.makedirs(OUT, exist_ok=True)

SHAPES = {
    "wide": (1500, 844, 0.44),
    "sq": (1000, 1000, 0.44),
    "port": (840, 1120, 0.42),
}

# key: (filename, alt, caption)
PHOTOS = {
    # --- The Boathouse, United Kingdom -------------------------------
    "boathouse-exterior": ("IMG_2635.jpeg",
        "A timber boathouse on brick piers standing over a lake, with a pantiled roof, a rustic pole balustrade along its deck and two children on the lawn in front of it.",
        "The whole building stands over the water on brick piers."),
    "boathouse-deck-dusk": ("IMG_2639.jpeg",
        "Dusk over a lily-covered lake seen from inside a boathouse, framed by the dark curve of a timber arch and a rustic balustrade.",
        "The arch does the framing for you. This is straight out of the door."),
    "boathouse-watching": ("IMG_2638.jpeg",
        "Two children in silhouette leaning on a boathouse balustrade, watching a pink and orange sunset over a still lake.",
        "Seven in the evening and nobody suggested going inside."),
    "boathouse-living": ("IMG_2637.jpeg",
        "The interior of a boathouse with a high vaulted ceiling of dark timber trusses, a brick and oak fireplace with a wood burner, and pale sofas.",
        "The roof is the room. Trusses right up to the ridge."),
    "boathouse-through": ("IMG_2636.jpeg",
        "A dark boathouse interior looking out through open doors to a bright deck with a folding chair and table, and the lake beyond.",
        "Inside is dark on purpose, which makes the doorway do all the work."),
    "boathouse-lake": ("IMG_2633.png",
        "A still lake at sunset with an orange band on the horizon, dark treeline either side and a tower on the hill to the right.",
        "The lake at its best, about twenty minutes after the sun goes."),

    # --- Nydri and Lefkada, Greece -----------------------------------
    "helidona-pool": ("IMG_1520.jpeg",
        "A blue tiled swimming pool with a dolphin mosaic on the floor, a vine-covered pergola to one side, a chocolate labrador on the edge and hills running down to a bay behind.",
        "The pool, the pergola, the bay, and the dog that comes with the house."),
    "nydri-harbour": ("IMG_1725.jpeg",
        "Nydri harbour with speedboats and yachts moored along the front, a palm tree in the foreground and a steep green mountain rising behind the town.",
        "Nydri harbour. Every one of these boats is available by the day."),
    "lefkada-cove": ("IMG_1558.jpeg",
        "A turquoise cove with completely clear water over pale pebbles, a steep scrub-covered headland on the left and open sea beyond.",
        "The water really is this colour, and this is an ordinary phone photograph."),
    "lefkada-beach-above": ("IMG_1550.jpeg",
        "A white pebble beach with rows of coloured sunloungers seen from a steep path above, backed by cliffs and turquoise water.",
        "The walk down is the price of admission."),
    "lefkada-beachclub": ("IMG_1700.jpeg",
        "A beach club with a white canopy, sunloungers on grass, palm trees and a line of umbrellas along the sand, with a mountain behind and windsurfers offshore.",
        "Vasiliki, an hour south, where the wind comes up every afternoon."),
    "lefkada-boat": ("IMG_1585.jpeg",
        "The bow of an inflatable boat crossing flat blue water towards green islands, with a child leaning over the side watching the water.",
        "Hire a boat. It is the single best thing to do on this island."),
    "lefkada-taverna": ("IMG_2510.jpeg",
        "A narrow Greek alley with a taverna's tables laid under a huge canopy of bright pink bougainvillea, a chalkboard sign in the foreground.",
        "Lefkada town at five, before anyone sits down to eat."),
    "lefkada-sunset-sea": ("IMG_2512.jpeg",
        "A wide sandy beach at sunset with the sun low over the sea, two children in pink rings at the water's edge in silhouette.",
        "West coast, so the sun goes down into the water rather than behind a hill."),
    "lefkada-terrace-night": ("310A5310.jpeg",
        "A restaurant terrace after dark, tables lit by small lamps, an infinity pool glowing blue and the last band of orange on the horizon over the sea.",
        "Worth booking the second sitting for this rather than the first."),
    "lefkada-terrace-sun": ("56c9684b-2cb2-4f08-b1b5-8ac0b47539d6.jpeg",
        "A busy restaurant terrace at sunset, diners in silhouette against a low sun over the sea, a waiter carrying a tray and a musician at a keyboard.",
        "Everybody stops eating for about four minutes when the sun hits the water."),
    "lefkada-dinner": ("IMG_1791.jpeg",
        "A steak on a white plate with basil and burrata, lit warm by a table lamp, with a hazy sunset over the sea behind.",
        "Thirty euros, and the view is free."),
}


def crop(im, ratio, bias):
    w, h = im.size
    target = ratio
    if w / h > target:
        nw = int(h * target)
        left = (w - nw) // 2
        return im.crop((left, 0, left + nw, h))
    nh = int(w / target)
    top = int((h - nh) * bias)
    return im.crop((0, top, w, top + nh))


manifest = {}

for key, (fname, alt, caption) in PHOTOS.items():
    path = os.path.join(SRC, fname)
    if not os.path.exists(path):
        print("missing", fname)
        continue
    src = ImageOps.exif_transpose(Image.open(path)).convert("RGB")

    entry = {"alt": alt, "caption": caption, "photo": True, "file": fname}
    for shape, (tw, th, bias) in SHAPES.items():
        im = crop(src, tw / th, bias).resize((tw, th), Image.LANCZOS)
        im.save(f"{OUT}/{key}-{shape}.webp", "WEBP", quality=68, method=6)
        sw, sh = tw // 2, th // 2
        im.resize((sw, sh), Image.LANCZOS).save(
            f"{OUT}/{key}-{shape}-sm.webp", "WEBP", quality=64, method=6)

        tiny = im.copy()
        tiny.thumbnail((20, 20), Image.LANCZOS)
        buf = io.BytesIO()
        tiny.save(buf, "WEBP", quality=40)
        entry[shape] = {
            "src": f"/assets/photos/{key}-{shape}",
            "w": tw, "h": th, "sw": sw,
            "lqip": "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode(),
        }
    manifest[key] = entry
    print("ok", key)

json.dump(manifest, open("src/_data/photos.json", "w"), indent=1)
print("photographs:", len(manifest))
