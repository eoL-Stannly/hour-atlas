"""Simplify Natural Earth 110m land polygons for use on the site.

Produces three things from one source of truth:
  1. src/_data/worlddots.json — an equal-area scatter of [lon, lat] points
     that fall on land, used by the globe. Points, not polygons, so there
     is no polygon-clipping to get wrong at the horizon.
  2. src/_data/worldpath.json — an equirectangular SVG path for the flat
     2D map, which needs no JavaScript at all.
  3. src/_data/worldrings.json — simplified rings, kept for reference.

Run from the repo root:  python3 tools/build_world_map.py
"""

import json
import math
import os
import urllib.request

SRC = "/tmp/land.geojson"
URL = ("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
       "master/geojson/ne_110m_land.geojson")

STEP = 3
MIN_RING_LEN = 6
DOT_SPACING_DEG = 1.7   # roughly even spacing across the sphere


def load():
    if not os.path.exists(SRC):
        urllib.request.urlretrieve(URL, SRC)
    return json.load(open(SRC))


def decimate(ring):
    if len(ring) <= MIN_RING_LEN * STEP:
        return ring
    out = ring[::STEP]
    if out[-1] != ring[-1]:
        out.append(ring[-1])
    return out


def rings_from_geometry(geom, simplify=True):
    t = geom["type"]
    if t == "Polygon":
        polys = [geom["coordinates"]]
    elif t == "MultiPolygon":
        polys = geom["coordinates"]
    else:
        return []
    out = []
    for poly in polys:
        for ring in poly:
            r = decimate(ring) if simplify else ring
            if len(r) >= MIN_RING_LEN:
                out.append(r)
    return out


data = load()

# Full-resolution rings drive the land test, so coastlines stay accurate
# even though the drawn geometry elsewhere is simplified.
full_rings = []
for feat in data["features"]:
    full_rings.extend(rings_from_geometry(feat["geometry"], simplify=False))

simple_rings = []
for feat in data["features"]:
    simple_rings.extend(rings_from_geometry(feat["geometry"], simplify=True))


def bbox(ring):
    lons = [p[0] for p in ring]
    lats = [p[1] for p in ring]
    return min(lons), max(lons), min(lats), max(lats)


boxed = [(bbox(r), r) for r in full_rings]


def on_land(lon, lat):
    for (lo0, lo1, la0, la1), ring in boxed:
        if lon < lo0 or lon > lo1 or lat < la0 or lat > la1:
            continue
        inside = False
        n = len(ring)
        j = n - 1
        for i in range(n):
            xi, yi = ring[i]
            xj, yj = ring[j]
            if (yi > lat) != (yj > lat):
                x_at = (xj - xi) * (lat - yi) / (yj - yi) + xi
                if lon < x_at:
                    inside = not inside
            j = i
        if inside:
            return True
    return False


dots = []
lat = -89.0
while lat <= 89.0:
    # Widen longitude spacing towards the poles so dots stay evenly spread
    # on the sphere rather than bunching up at the top and bottom.
    circumference_factor = max(math.cos(math.radians(lat)), 0.02)
    lon_step = DOT_SPACING_DEG / circumference_factor
    lon = -180.0
    while lon < 180.0:
        if on_land(lon, lat):
            dots.append([round(lon, 1), round(lat, 1)])
        lon += lon_step
    lat += DOT_SPACING_DEG

# Flattened to [lon, lat, lon, lat, ...]; the brackets on 4k nested pairs
# cost more bytes than the coordinates themselves.
flat = [c for pair in dots for c in pair]
json.dump(flat, open("src/_data/worlddots.json", "w"), separators=(",", ":"))
print(f"land dots: {len(dots)} ({len(flat)} coords)")

rings_out = [[[round(lo, 1), round(la, 1)] for lo, la in r] for r in simple_rings]
json.dump(rings_out, open("src/_data/worldrings.json", "w"), separators=(",", ":"))
print(f"rings: {len(rings_out)}")

# --- flat equirectangular SVG path, for the no-JS 2D map ------------------
W, H = 1000, 500


def project(lon, lat):
    return round((lon + 180) / 360 * W, 1), round((90 - lat) / 180 * H, 1)


parts = []
for ring in rings_out:
    pts = [project(lon, lat) for lon, lat in ring]
    parts.append("M" + " L".join(f"{x},{y}" for x, y in pts) + " Z")

path = " ".join(parts)
json.dump({"d": path, "w": W, "h": H}, open("src/_data/worldpath.json", "w"))
print(f"svg path length: {len(path)} chars")
