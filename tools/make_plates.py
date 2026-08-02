"""Draw the placeholder plates.

These are not photographs. They are procedurally drawn landscape panels,
deterministic from a seed, produced so every record on the site has
something in its frame while the real pictures are still on a card
somewhere. Delete a plate reference and the page renders without it.

Run from the repo root:  python3 tools/make_plates.py
"""

import base64
import io
import json
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = "src/assets/plates"

# Three shapes, because the layout uses plates as banners, as square tiles
# and as portrait cards. Each is drawn at its own aspect rather than cropped,
# so the horizon and the composition sit correctly in every one.
RATIOS = {
    "wide": [(1600, 900), (800, 450)],
    "sq":   [(1100, 1100), (550, 550)],
    "port": [(900, 1200), (450, 600)],
}
os.makedirs(OUT, exist_ok=True)


# ----------------------------------------------------------- colour utils

def rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float)


def vgrad(w, h, stops):
    ys = np.linspace(0, 1, h)
    out = np.zeros((h, 3))
    for i in range(len(stops) - 1):
        p0, c0 = stops[i]
        p1, c1 = stops[i + 1]
        m = (ys >= p0) & (ys <= p1)
        if m.any():
            t = ((ys[m] - p0) / max(1e-6, p1 - p0))[:, None]
            out[m] = rgb(c0) * (1 - t) + rgb(c1) * t
    out[ys < stops[0][0]] = rgb(stops[0][1])
    out[ys > stops[-1][0]] = rgb(stops[-1][1])
    return np.repeat(out[:, None, :], w, axis=1)


def radial(w, h, cx, cy, r):
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx - cx * w) ** 2 + (yy - cy * h) ** 2) / (r * w)
    return np.clip(1 - d, 0, 1)


def noise(w, h, rng, octaves=5, base=3):
    acc = np.zeros((h, w)); amp = 1.0; total = 0.0
    for o in range(octaves):
        n = base * (2 ** o)
        small = rng.random((max(2, n), max(2, int(n * w / h))))
        img = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        acc += np.asarray(img, float) / 255.0 * amp
        total += amp; amp *= 0.5
    return acc / total


def layer(w, h, colour, alpha=1.0):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fill = tuple(int(c) for c in rgb(colour)) + (int(255 * alpha),)
    return im, ImageDraw.Draw(im), fill


def ridge(prng, x0, x1, base, height, rough, points=9):
    xs = np.linspace(x0, x1, points)
    ys = [base - height * prng.uniform(0.3, 1.0) for _ in xs]
    out = []
    for i in range(len(xs) - 1):
        for s in range(7):
            t = s / 7
            out.append((xs[i] * (1 - t) + xs[i + 1] * t,
                        ys[i] * (1 - t) + ys[i + 1] * t + prng.uniform(-rough, rough)))
    out.append((xs[-1], ys[-1]))
    return out


def conifer(draw, x, y, size, fill, prng):
    for i in range(3):
        t = i / 3
        half = size * 0.3 * (1 - t * 0.45)
        top = y - size * (0.42 + t * 0.29)
        bot = y - size * t * 0.3
        draw.polygon([(x, top), (x + half, bot), (x - half, bot)], fill=fill)
    draw.rectangle([x - size * 0.035, y - size * 0.06, x + size * 0.035, y], fill=fill)


def palm(draw, x, y, size, fill, lean, prng):
    pts = [(x + lean * size * (i / 23) ** 2, y - size * (i / 23)) for i in range(24)]
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i + 1]], fill=fill, width=max(1, int(size * 0.03 * (1 - i / 24)) + 1))
    tx, ty = pts[-1]
    for f in range(7):
        a = math.pi * (0.1 + 0.8 * f / 6) + prng.uniform(-0.05, 0.05)
        L = size * prng.uniform(0.4, 0.58)
        ex, ey = tx - math.cos(a) * L, ty - math.sin(a) * L * 0.7
        mx, my = (tx + ex) / 2, min(ty, ey) - L * 0.22
        poly = []
        for d in (-1, 1):
            rng_ = range(15) if d < 0 else range(14, -1, -1)
            for s in rng_:
                t = s / 14
                px = (1 - t) ** 2 * tx + 2 * (1 - t) * t * mx + t ** 2 * ex
                py = (1 - t) ** 2 * ty + 2 * (1 - t) * t * my + t ** 2 * ey
                poly.append((px, py + d * size * 0.04 * math.sin(math.pi * t)))
        draw.polygon(poly, fill=fill)


# ---------------------------------------------------------------- palettes

PALETTES = {
    "coast": [
        (["#1d5f92", "#79b3cf", "#dceaea"], ["#1f8fa0", "#3fb3ac", "#a9dfd0"], "#16303a", 0.52, (0.72, 0.16, "#fff6e0", 0.45)),
        (["#3a2a55", "#a8556a", "#f0a46b"], ["#b4664f", "#67405a", "#2a1c33"], "#1b1428", 0.56, (0.4, 0.5, "#ffdca6", 0.7)),
        (["#123049", "#41708f", "#9dbcc9"], ["#1c4a63", "#123a4f", "#0d2634"], "#0d1e2a", 0.5, (0.26, 0.2, "#e8f1f5", 0.35)),
    ],
    "atoll": [
        (["#1477a8", "#4fb6cd", "#bfe6e6"], ["#28b0ae", "#4fd3c0", "#c3ecd6"], "#0d3038", 0.5, (0.68, 0.12, "#ffffff", 0.42)),
        (["#20406e", "#7a6d94", "#e6a681"], ["#a9765f", "#4b4a6e", "#1d2340"], "#141b2c", 0.55, (0.55, 0.48, "#ffd9a8", 0.62)),
        (["#0f6d8e", "#57b7c4", "#d6ecdf"], ["#1f9f9c", "#43c2ae", "#9fe0c6"], "#0b2c30", 0.48, (0.3, 0.14, "#ffffff", 0.4)),
    ],
    "fjord": [
        (["#16233f", "#4a5c8c", "#e0a377"], None, "#0b1220", 0.62, (0.24, 0.56, "#ffd9a0", 0.6)),
        (["#1b3348", "#5d86a4", "#c3dbe4"], None, "#101d2a", 0.6, (0.7, 0.2, "#ffffff", 0.38)),
        (["#221c3a", "#4d5f8e", "#8fb0c4"], None, "#0d1220", 0.58, (0.5, 0.4, "#dfe9f2", 0.42)),
    ],
    "mountain": [
        (["#1a3247", "#628fae", "#cfe0e8"], None, "#12222f", 0.66, (0.68, 0.24, "#ffffff", 0.4)),
        (["#2d2340", "#7b5f7d", "#e3a984"], None, "#171429", 0.64, (0.36, 0.42, "#ffdcb0", 0.6)),
        (["#20343a", "#5c8079", "#c2d4c4"], None, "#131f22", 0.68, (0.75, 0.18, "#f2f7ee", 0.36)),
    ],
    "forest": [
        (["#7d9c86", "#b3cbb0", "#dde9d4"], None, "#142a1e", 0.62, (0.5, 0.12, "#ffffff", 0.4)),
        (["#26402f", "#5d7f5c", "#a9c49a"], None, "#0f1f16", 0.6, (0.32, 0.26, "#e6f0d8", 0.42)),
        (["#2b3a53", "#6f8a86", "#c8cfa8"], None, "#131c22", 0.64, (0.7, 0.3, "#ffe9bc", 0.5)),
    ],
    "moor": [
        (["#3f5b78", "#8fa8b4", "#d5d6c2"], None, "#2b3324", 0.6, (0.3, 0.22, "#fff4d8", 0.42)),
        (["#4a3a52", "#9c7671", "#d9b389"], None, "#2c2622", 0.58, (0.66, 0.36, "#ffddaa", 0.55)),
        (["#22384a", "#5a7a86", "#adc0b4"], None, "#1b2620", 0.62, (0.44, 0.16, "#e9f0e4", 0.34)),
    ],
    "dune": [
        (["#3d2a4a", "#96543f", "#f0bd6d"], None, "#2c1a12", 0.5, (0.34, 0.44, "#ffe2a3", 0.66)),
        (["#1f4e73", "#c98d54", "#f2d9a5"], None, "#48280f", 0.46, (0.7, 0.36, "#fff0c8", 0.5)),
    ],
    "city": [
        (["#0a1024", "#25325c", "#5e5480"], None, "#070a16", 0.72, (0.8, 0.5, "#ffd9a0", 0.35)),
        (["#101a30", "#3a4a72", "#8a7b96"], None, "#0a0f1c", 0.7, (0.2, 0.55, "#ffe2b0", 0.4)),
    ],
}


# ------------------------------------------------------------ scene bodies

def body_coast(base, w, h, hy, prng, ink):
    im, d, f = layer(w, h, ink, 1.0)
    d.polygon([(0, h)] + ridge(prng, 0, w * 0.44, h * 0.86, h * 0.3, h * 0.01, 7) + [(w * 0.44, h)], fill=f)
    base.paste(im, (0, 0), im)
    im2, d2, f2 = layer(w, h, ink, 0.9)
    d2.polygon([(w, h)] + ridge(prng, w, w * 0.62, h * 0.94, h * 0.16, h * 0.008, 6) + [(w * 0.62, h)], fill=f2)
    base.paste(im2, (0, 0), im2)


def body_atoll(base, w, h, hy, prng, ink):
    im, d, f = layer(w, h, ink, 1.0)
    d.polygon([(0, h), (0, h * 0.9), (w, h * 0.86), (w, h)], fill=f)
    for x, s, lean in [(0.08, 0.4, 0.2), (0.16, 0.3, 0.16), (0.9, 0.36, -0.2), (0.97, 0.26, -0.16)]:
        palm(d, x * w, h * 0.93, h * s, f, lean, prng)
    base.paste(im, (0, 0), im)


def body_fjord(base, w, h, hy, prng, ink):
    im, d, f = layer(w, h, ink, 1.0)
    pts = [(0, hy)]
    for i in range(9):
        x = w * i / 8
        pts.append((x, hy - h * prng.uniform(0.12, 0.34)))
        pts.append((x + w / 16, hy - h * prng.uniform(0.04, 0.16)))
    pts.append((w, hy))
    d.polygon(pts, fill=f)
    d.rectangle([0, hy, w, h], fill=tuple(list(f[:3]) + [90]))
    base.paste(im, (0, 0), im)


def body_mountain(base, w, h, hy, prng, ink):
    im, d, f = layer(w, h, ink, 0.55)
    d.polygon([(0, hy)] + ridge(prng, 0, w, hy, h * 0.34, h * 0.012, 11) + [(w, hy)], fill=f)
    base.paste(im, (0, 0), im)
    im2, d2, f2 = layer(w, h, ink, 1.0)
    d2.polygon([(0, hy)] + ridge(prng, 0, w, hy, h * 0.2, h * 0.01, 9) + [(w, hy)], fill=f2)
    d2.rectangle([0, hy, w, h], fill=f2)
    base.paste(im2, (0, 0), im2)


def body_forest(base, w, h, hy, prng, ink):
    for i, (alpha, blur, off, sz) in enumerate([(0.45, 7, 0.02, 0.3), (0.7, 3, 0.07, 0.4), (1.0, 0, 0.14, 0.55)]):
        im, d, f = layer(w, h, ink, alpha)
        y = hy + h * off
        d.rectangle([0, y + h * sz * 0.32, w, h], fill=f)
        x = -w * 0.02
        while x < w * 1.02:
            conifer(d, x, y + h * sz * 0.34, h * sz * prng.uniform(0.72, 1.15), f, prng)
            x += w * (0.055 - i * 0.008)
        if blur:
            im = im.filter(ImageFilter.GaussianBlur(blur))
        base.paste(im, (0, 0), im)


def body_moor(base, w, h, hy, prng, ink):
    for alpha, drop, ht in [(0.5, 0.02, 0.14), (0.75, 0.09, 0.12), (1.0, 0.18, 0.1)]:
        im, d, f = layer(w, h, ink, alpha)
        y = hy + h * drop
        d.polygon([(0, h)] + ridge(prng, 0, w, y, h * ht, h * 0.006, 8) + [(w, h)], fill=f)
        base.paste(im, (0, 0), im)


def body_dune(base, w, h, hy, prng, ink):
    for alpha, drop, ht in [(0.55, 0.04, 0.13), (0.8, 0.16, 0.14), (1.0, 0.3, 0.15)]:
        im, d, f = layer(w, h, ink, alpha)
        y = hy + h * drop
        d.polygon([(0, h)] + ridge(prng, 0, w, y, h * ht, h * 0.003, 5) + [(w, h)], fill=f)
        base.paste(im, (0, 0), im)


def body_city(base, w, h, hy, prng, ink):
    im, d, f = layer(w, h, ink, 1.0)
    d.rectangle([0, hy + h * 0.12, w, h], fill=f)
    x = 0
    while x < w:
        bw = w * prng.uniform(0.03, 0.08)
        bh = h * prng.uniform(0.08, 0.3)
        d.rectangle([x, hy + h * 0.12 - bh, x + bw * 0.92, hy + h * 0.13], fill=f)
        x += bw
    base.paste(im, (0, 0), im)


BODIES = {"coast": body_coast, "atoll": body_atoll, "fjord": body_fjord,
          "mountain": body_mountain, "forest": body_forest, "moor": body_moor,
          "dune": body_dune, "city": body_city}


def draw(scene, seed, w, h):
    rng = np.random.default_rng(seed)
    prng = random.Random(seed)
    pals = PALETTES[scene]
    sky_c, sea_c, ink, horizon, sun = pals[seed % len(pals)]

    arr = vgrad(w, h, [(0.0, sky_c[0]), (0.42, sky_c[1]), (max(0.5, horizon), sky_c[2])])

    cx, cy, col, strength = sun
    glow = radial(w, h, cx, cy, 0.5) ** 2.1
    arr += glow[:, :, None] * (rgb(col) - arr) * strength
    disc = radial(w, h, cx, cy, 0.055)
    arr += (disc > 0.02)[:, :, None] * (rgb(col) - arr) * 0.8

    cloud = np.clip((noise(w, h, rng) - 0.5) * 2.2, 0, 1)
    band = np.clip(1 - np.abs(np.linspace(0, 1, h) - horizon * 0.55) / 0.6, 0, 1)[:, None]
    arr += (cloud * band * 0.45)[:, :, None] * (255 - arr) * 0.5

    hy = int(h * horizon)
    if sea_c:
        arr[hy:] = vgrad(w, h - hy, [(0.0, sea_c[0]), (0.3, sea_c[1]), (1.0, sea_c[2])])
        rows = np.linspace(0, 1, h - hy)[:, None]
        arr[hy:] += ((noise(w, h - hy, rng, 3, 2) - 0.5) * 22 * (1 - rows))[:, :, None]
        spec = np.clip(1 - np.abs(np.mgrid[0:h - hy, 0:w][1] - cx * w) / (w * 0.05), 0, 1)
        spec *= np.clip(1 - rows * 1.2, 0, 1)
        wob = np.sin(np.mgrid[0:h - hy, 0:w][0] * 0.7) * 0.5 + 0.5
        arr[hy:] += (spec * wob * 0.5)[:, :, None] * (rgb(col) - arr[hy:])

    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    BODIES[scene](img, w, h, hy, prng, ink)

    a = np.asarray(img, float) + rng.normal(0, 2.6, (h, w, 1))
    yy, xx = np.mgrid[0:h, 0:w]
    vig = np.sqrt(((xx / w) - 0.5) ** 2 + ((yy / h) - 0.5) ** 2) / 0.72
    a *= (1 - 0.2 * np.clip(vig, 0, 1) ** 2)[:, :, None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB")


jobs = json.load(open("tools/plate-jobs.json"))
manifest = {}

for job in jobs:
    entry = {
        "scene": job["scene"],
        "alt": f"Placeholder plate for {job['label']}: a drawn {job['scene']} scene, not a photograph.",
    }
    for shape, sizes in RATIOS.items():
        big_w, big_h = sizes[0]
        img = draw(job["scene"], job["seed"], big_w, big_h)
        img.save(f"{OUT}/{job['key']}-{shape}.webp", "WEBP", quality=74, method=6)
        sw, sh = sizes[1]
        img.resize((sw, sh), Image.LANCZOS).save(
            f"{OUT}/{job['key']}-{shape}-sm.webp", "WEBP", quality=70, method=6)

        tiny = img.copy(); tiny.thumbnail((20, 20), Image.LANCZOS)
        buf = io.BytesIO(); tiny.save(buf, "WEBP", quality=40)
        entry[shape] = {
            "src": f"/assets/plates/{job['key']}-{shape}",
            "w": big_w, "h": big_h, "sw": sw,
            "lqip": "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode(),
        }
    manifest[job["key"]] = entry

json.dump(manifest, open("src/_data/plates.json", "w"), indent=1)
print("drew", len(manifest), "plates")
