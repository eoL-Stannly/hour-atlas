"""Simplify the Natural Earth 110m land polygons for use on the site.

Produces two things from one source of truth:
  1. src/_data/worldrings.json — simplified [lon, lat] rings, embedded on
     the destinations page for the client-side globe to project live as it
     rotates.
  2. An equirectangular SVG path (printed to stdout, pasted into
     src/_includes/world-path.njk) for the static 2D map, which needs no
     JavaScript at all.

Simplification is a plain decimation (keep every Nth point) rather than a
proper Douglas-Peucker pass, which is coarse but fine at the size this
renders on screen and keeps the tool dependency-free.

Run from the repo root:  python3 tools/build_world_map.py
"""

import json

SRC = "/tmp/land.geojson"
STEP = 3          # keep every 3rd point
MIN_RING_LEN = 6   # drop slivers that would vanish at this scale


def decimate(ring):
    if len(ring) <= MIN_RING_LEN * STEP:
        return ring
    out = ring[::STEP]
    if out[-1] != ring[-1]:
        out.append(ring[-1])
    return out


def rings_from_geometry(geom):
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
            d = decimate(ring)
            if len(d) >= MIN_RING_LEN:
                out.append(d)
    return out


data = json.load(open(SRC))
rings = []
for feat in data["features"]:
    rings.extend(rings_from_geometry(feat["geometry"]))

# Round coordinates to keep the JSON small; a tenth of a degree is around
# 11km at the equator, which is far finer than this ever needs to be.
rings = [[[round(lon, 1), round(lat, 1)] for lon, lat in ring] for ring in rings]

json.dump(rings, open("src/_data/worldrings.json", "w"), separators=(",", ":"))

total_pts = sum(len(r) for r in rings)
print(f"rings: {len(rings)}  points: {total_pts}")

# --- flat equirectangular SVG path, for the no-JS 2D map ------------------
W, H = 1000, 500


def project(lon, lat):
    x = (lon + 180) / 360 * W
    y = (90 - lat) / 180 * H
    return round(x, 1), round(y, 1)


parts = []
for ring in rings:
    pts = [project(lon, lat) for lon, lat in ring]
    d = "M" + " L".join(f"{x},{y}" for x, y in pts) + " Z"
    parts.append(d)

path = " ".join(parts)
open("src/_data/worldpath.json", "w").write(json.dumps({"d": path, "w": W, "h": H}))
print(f"svg path length: {len(path)} chars")
