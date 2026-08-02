"""Generate placeholder plates for entries that have no photograph yet.

These are procedurally drawn scenes, not photographs. They exist so the
layout can be judged with something in every frame, and they are meant to be
deleted the moment a real JPEG replaces them. Everything is deterministic:
the same seed always draws the same plate.
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
os.makedirs(OUT, exist_ok=True)


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)


def vgrad(w, h, stops):
    """stops: list of (position 0-1, hex)."""
    ys = np.linspace(0, 1, h)
    out = np.zeros((h, 3))
    for i in range(len(stops) - 1):
        p0, c0 = stops[i]
        p1, c1 = stops[i + 1]
        m = (ys >= p0) & (ys <= p1)
        if not m.any():
            continue
        t = ((ys[m] - p0) / max(1e-6, p1 - p0))[:, None]
        out[m] = hexrgb(c0) * (1 - t) + hexrgb(c1) * t
    out[ys < stops[0][0]] = hexrgb(stops[0][1])
    out[ys > stops[-1][0]] = hexrgb(stops[-1][1])
    return np.repeat(out[:, None, :], w, axis=1)


def radial(w, h, cx, cy, radius):
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx - cx * w) ** 2 + (yy - cy * h) ** 2) / (radius * w)
    return np.clip(1 - d, 0, 1)


def fractal_noise(w, h, rng, octaves=5, base=4):
    acc = np.zeros((h, w))
    amp = 1.0
    total = 0.0
    for o in range(octaves):
        n = base * (2 ** o)
        small = rng.random((max(2, n), max(2, int(n * w / h))))
        img = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        acc += np.asarray(img, dtype=np.float64) / 255.0 * amp
        total += amp
        amp *= 0.5
    return acc / total


def to_img(arr):
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def silhouette(w, h, colour, opacity=1.0):
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    return layer, ImageDraw.Draw(layer), tuple(int(c) for c in hexrgb(colour)) + (int(255 * opacity),)


def palm(draw, x, y, size, fill, lean=0.18, fronds=8, seed=0):
    rng = random.Random(seed)
    pts = []
    for i in range(24):
        t = i / 23
        pts.append((x + lean * size * t * t, y - size * t))
    for i in range(len(pts) - 1):
        wdt = max(1, int(size * 0.035 * (1 - i / len(pts)) + 1))
        draw.line([pts[i], pts[i + 1]], fill=fill, width=wdt)
    tipx, tipy = pts[-1]
    for f in range(fronds):
        a = math.pi * (0.08 + 0.84 * f / max(1, fronds - 1)) + rng.uniform(-0.06, 0.06)
        length = size * rng.uniform(0.42, 0.62)
        ex = tipx - math.cos(a) * length
        ey = tipy - math.sin(a) * length * 0.72
        mx = (tipx + ex) / 2
        my = min(tipy, ey) - length * 0.22
        poly = []
        steps = 14
        for s in range(steps + 1):
            t = s / steps
            px = (1 - t) ** 2 * tipx + 2 * (1 - t) * t * mx + t ** 2 * ex
            py = (1 - t) ** 2 * tipy + 2 * (1 - t) * t * my + t ** 2 * ey
            poly.append((px, py - size * 0.035 * math.sin(math.pi * t)))
        for s in range(steps, -1, -1):
            t = s / steps
            px = (1 - t) ** 2 * tipx + 2 * (1 - t) * t * mx + t ** 2 * ex
            py = (1 - t) ** 2 * tipy + 2 * (1 - t) * t * my + t ** 2 * ey
            poly.append((px, py + size * 0.045 * math.sin(math.pi * t)))
        draw.polygon(poly, fill=fill)


def ridge(rng, x0, x1, y_base, height, roughness, points=9):
    xs = np.linspace(x0, x1, points)
    ys = [y_base - height * rng.uniform(0.35, 1.0) for _ in xs]
    out = []
    for i in range(len(xs) - 1):
        for s in range(6):
            t = s / 6
            y = ys[i] * (1 - t) + ys[i + 1] * t + rng.uniform(-roughness, roughness)
            out.append((xs[i] * (1 - t) + xs[i + 1] * t, y))
    out.append((xs[-1], ys[-1]))
    return out


def finish(base, w, h, rng, grain=7.0, vignette=0.24):
    arr = np.asarray(base, dtype=np.float64)
    n = rng.normal(0, grain, (h, w, 1))
    arr = arr + n
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx / w) - 0.5) ** 2 + ((yy / h) - 0.5) ** 2) / 0.72
    arr *= (1 - vignette * np.clip(d, 0, 1) ** 2)[:, :, None]
    return to_img(arr)


# ----------------------------------------------------------------- scenes

def scene(name, w, h, seed, sky, horizon, sea, sun, build):
    rng = np.random.default_rng(seed)
    prng = random.Random(seed)

    arr = vgrad(w, h, sky)

    if sun:
        cx, cy, rad, col, strength = sun
        glow = radial(w, h, cx, cy, rad) ** 2.1
        arr += glow[:, :, None] * (hexrgb(col) - arr) * strength
        disc = radial(w, h, cx, cy, rad * 0.13)
        arr += (disc > 0.02)[:, :, None] * (hexrgb(col) - arr) * 0.85

    clouds = fractal_noise(w, h, rng, octaves=5, base=3)
    cmask = np.clip((clouds - 0.5) * 2.4, 0, 1)
    band = np.clip(1 - np.abs(np.linspace(0, 1, h) - horizon * 0.55) / 0.55, 0, 1)[:, None]
    arr += (cmask * band * 0.5)[:, :, None] * (255 - arr) * 0.55

    hy = int(h * horizon)
    if sea:
        sea_arr = vgrad(w, h - hy, sea)
        block = arr[hy:].copy()
        arr[hy:] = sea_arr
        streak = fractal_noise(w, h - hy, rng, octaves=3, base=2)
        rows = np.linspace(0, 1, h - hy)[:, None]
        arr[hy:] += ((streak - 0.5) * 26 * (1 - rows))[:, :, None]
        if sun:
            colcx = sun[0] * w
            spec = np.clip(1 - np.abs(np.mgrid[0:h - hy, 0:w][1] - colcx) / (w * 0.055), 0, 1)
            spec *= np.clip(1 - rows * 1.15, 0, 1)
            wob = np.sin(np.mgrid[0:h - hy, 0:w][0] * 0.7) * 0.5 + 0.5
            arr[hy:] += (spec * wob * 0.55)[:, :, None] * (hexrgb(sun[3]) - arr[hy:])
        del block

    base = to_img(arr)
    base = base.filter(ImageFilter.GaussianBlur(0.6))

    build(base, w, h, hy, prng)

    img = finish(base, w, h, rng)
    img.save(os.path.join(OUT, name + ".jpg"), "JPEG", quality=84, optimize=True, progressive=True)

    tiny = img.copy()
    tiny.thumbnail((24, 24), Image.LANCZOS)
    buf = io.BytesIO()
    tiny.save(buf, "JPEG", quality=40)
    return {
        "w": w,
        "h": h,
        "lqip": "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode(),
    }


plates = {}


def register(name, meta):
    plates[name] = dict(meta, ref=name, src=f"/assets/plates/{name}", placeholder=True,
                        ratio=round(meta["w"] / meta["h"], 4))


# 1. Midday lagoon, sand in the foreground
def lagoon(base, w, h, hy, prng):
    layer, draw, fill = silhouette(w, h, "#0d2a2c", 0.9)
    draw.polygon([(0, h), (0, int(h * 0.9)), (w, int(h * 0.86)), (w, h)], fill=(214, 198, 168, 255))
    base.paste(layer, (0, 0), layer)
    layer2, draw2, fill2 = silhouette(w, h, "#12312e", 0.95)
    for i, (x, s) in enumerate([(0.06, 0.46), (0.14, 0.34), (0.93, 0.4)]):
        palm(draw2, x * w, h * 0.93, h * s, fill2, lean=0.2 if x < 0.5 else -0.2, seed=prng.randint(0, 99))
    base.paste(layer2, (0, 0), layer2)


register("plate-lagoon", scene(
    "plate-lagoon", 2000, 1333, 11,
    sky=[(0.0, "#1d6fae"), (0.42, "#5fa8cf"), (0.52, "#c9e4ec")],
    horizon=0.52,
    sea=[(0.0, "#2fa3ad"), (0.28, "#37c3bd"), (0.7, "#7fdcc9"), (1.0, "#bfe9d4")],
    sun=(0.72, 0.1, 0.5, "#fffaf0", 0.5),
    build=lagoon,
))


# 2. Sunset over a beach, palms hard against the light
def sunsetbeach(base, w, h, hy, prng):
    layer, draw, fill = silhouette(w, h, "#2a1220", 1.0)
    draw.polygon([(0, h), (0, int(h * 0.88)), (w, int(h * 0.83)), (w, h)], fill=fill)
    for x, s in [(0.1, 0.62), (0.2, 0.44), (0.82, 0.55), (0.92, 0.38)]:
        palm(draw, x * w, h * 0.9, h * s, fill, lean=0.22 if x < 0.5 else -0.24, seed=prng.randint(0, 99))
    base.paste(layer, (0, 0), layer)


register("plate-sunset-beach", scene(
    "plate-sunset-beach", 2000, 1333, 23,
    sky=[(0.0, "#25204f"), (0.3, "#7a3a63"), (0.46, "#d9613f"), (0.56, "#f6b25c")],
    horizon=0.58,
    sea=[(0.0, "#c96a44"), (0.25, "#7c3f52"), (1.0, "#2b1a33")],
    sun=(0.46, 0.55, 0.42, "#ffe6ad", 0.72),
    build=sunsetbeach,
))


# 3. Headland dropping into deep water, late afternoon
def headland(base, w, h, hy, prng):
    layer, draw, fill = silhouette(w, h, "#1b2b33", 1.0)
    pts = [(0, h)] + ridge(prng, 0, w * 0.42, h * 0.82, h * 0.34, h * 0.012, 7) + [(w * 0.42, h)]
    draw.polygon(pts, fill=fill)
    base.paste(layer, (0, 0), layer)
    l2, d2, f2 = silhouette(w, h, "#0f1c22", 1.0)
    pts2 = [(w, h)] + ridge(prng, w, w * 0.66, h * 0.9, h * 0.2, h * 0.01, 6) + [(w * 0.66, h)]
    d2.polygon(pts2, fill=f2)
    base.paste(l2, (0, 0), l2)


register("plate-headland", scene(
    "plate-headland", 2000, 1333, 37,
    sky=[(0.0, "#2f6f9e"), (0.4, "#8ec0d8"), (0.5, "#e2ead9")],
    horizon=0.5,
    sea=[(0.0, "#1f6d86"), (0.4, "#14566e"), (1.0, "#0b3murky")] if False else
        [(0.0, "#1f6d86"), (0.4, "#14566e"), (1.0, "#0b3547")],
    sun=(0.28, 0.16, 0.44, "#fff3d6", 0.42),
    build=headland,
))


# 4. Cold alpine lake, cloud sitting in the valley
def alpine(base, w, h, hy, prng):
    l1, d1, f1 = silhouette(w, h, "#4b5f77", 0.85)
    d1.polygon([(0, hy)] + ridge(prng, 0, w, hy, h * 0.3, h * 0.014, 11) + [(w, hy)], fill=f1)
    base.paste(l1, (0, 0), l1)
    l2, d2, f2 = silhouette(w, h, "#263444", 1.0)
    d2.polygon([(0, hy)] + ridge(prng, 0, w, hy, h * 0.2, h * 0.01, 9) + [(w, hy)], fill=f2)
    base.paste(l2, (0, 0), l2)
    l3, d3, f3 = silhouette(w, h, "#e8eef2", 0.5)
    d3.rectangle([0, hy - h * 0.045, w, hy + h * 0.01], fill=f3)
    l3 = l3.filter(ImageFilter.GaussianBlur(26))
    base.paste(l3, (0, 0), l3)


register("plate-alpine-lake", scene(
    "plate-alpine-lake", 2000, 1333, 51,
    sky=[(0.0, "#16283b"), (0.35, "#4d7896"), (0.58, "#b8d3e0")],
    horizon=0.62,
    sea=[(0.0, "#40647c"), (0.35, "#27455c"), (1.0, "#14293a")],
    sun=(0.66, 0.28, 0.4, "#ffffff", 0.4),
    build=alpine,
))


# 5. Dusk over an atoll, water villas on stilts
def overwater(base, w, h, hy, prng):
    layer, draw, fill = silhouette(w, h, "#191029", 1.0)
    for i, (x, s) in enumerate([(0.2, 0.1), (0.34, 0.085), (0.47, 0.075)]):
        bw, bh = w * s, h * s * 0.7
        bx, by = x * w, hy + h * 0.05 + i * h * 0.03
        draw.polygon([(bx, by), (bx + bw / 2, by - bh * 0.75), (bx + bw, by), (bx + bw, by + bh * 0.32), (bx, by + bh * 0.32)], fill=fill)
        for k in range(4):
            px = bx + bw * (0.1 + 0.26 * k)
            draw.line([(px, by + bh * 0.32), (px, by + bh * 0.8)], fill=fill, width=max(2, int(w * 0.0028)))
    draw.rectangle([w * 0.19, hy + h * 0.125, w * 0.78, hy + h * 0.138], fill=fill)
    for x, s in [(0.9, 0.34), (0.97, 0.26)]:
        palm(draw, x * w, h * 0.98, h * s, fill, lean=-0.22, seed=prng.randint(0, 99))
    base.paste(layer, (0, 0), layer)


register("plate-overwater", scene(
    "plate-overwater", 2000, 1333, 67,
    sky=[(0.0, "#1a1740"), (0.3, "#5b3b73"), (0.48, "#c56b7d"), (0.56, "#f0a877")],
    horizon=0.56,
    sea=[(0.0, "#a86a76"), (0.2, "#5c4370"), (1.0, "#211a3d")],
    sun=(0.6, 0.52, 0.4, "#ffd9a8", 0.6),
    build=overwater,
))


# 6. Dune ridge in low sun, portrait frame
def dune(base, w, h, hy, prng):
    for i, (col, base_y, ht, alpha) in enumerate([
        ("#c07a3c", 0.62, 0.1, 0.9),
        ("#a55f2e", 0.74, 0.12, 0.95),
        ("#6f3a1e", 0.88, 0.14, 1.0),
    ]):
        layer, draw, fill = silhouette(w, h, col, alpha)
        pts = [(0, h)] + ridge(prng, 0, w, h * base_y, h * ht, h * 0.004, 6) + [(w, h)]
        draw.polygon(pts, fill=fill)
        base.paste(layer, (0, 0), layer)


register("plate-dune", scene(
    "plate-dune", 1333, 2000, 83,
    sky=[(0.0, "#3d2a4a"), (0.3, "#96543f"), (0.48, "#e0954a"), (0.56, "#f5c877")],
    horizon=0.58,
    sea=None,
    sun=(0.34, 0.44, 0.38, "#ffe2a3", 0.66),
    build=dune,
))


# 7. Jungle gorge in flat morning light, portrait frame
def jungle(base, w, h, hy, prng):
    for i, (col, x0, x1, alpha, blur) in enumerate([
        ("#3f5c46", -0.1, 0.55, 0.75, 8),
        ("#2b4433", 0.45, 1.1, 0.85, 4),
        ("#152a1e", -0.05, 1.05, 1.0, 0),
    ]):
        layer, draw, fill = silhouette(w, h, col, alpha)
        pts = [(x0 * w, h)] + ridge(prng, x0 * w, x1 * w, h * (0.5 + i * 0.12), h * 0.3, h * 0.02, 8) + [(x1 * w, h)]
        draw.polygon(pts, fill=fill)
        if blur:
            layer = layer.filter(ImageFilter.GaussianBlur(blur))
        base.paste(layer, (0, 0), layer)
    l, d, f = silhouette(w, h, "#dff0e6", 0.55)
    d.ellipse([w * 0.28, h * 0.52, w * 0.72, h * 0.86], fill=f)
    l = l.filter(ImageFilter.GaussianBlur(60))
    base.paste(l, (0, 0), l)


register("plate-jungle", scene(
    "plate-jungle", 1333, 2000, 97,
    sky=[(0.0, "#7fa08a"), (0.35, "#b7cdb4"), (0.6, "#dfe9d6")],
    horizon=0.6,
    sea=None,
    sun=(0.5, 0.14, 0.5, "#ffffff", 0.45),
    build=jungle,
))


with open("src/_data/plates.json", "w") as fh:
    json.dump(plates, fh, indent=2)

print(json.dumps({k: (v["w"], v["h"]) for k, v in plates.items()}, indent=2))
