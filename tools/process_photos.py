"""Resize the camera JPEGs for the web and write out an EXIF manifest.

Produces, for each frame:
  <ref>-2000.jpg   long edge 2000px, for lead and lightbox use
  <ref>-900.jpg    long edge 900px, for grid and strip use
plus a 24px blur-up data URI so the layout never jumps while loading.
"""

import base64
import glob
import io
import json
import os
from fractions import Fraction

from PIL import Image, ImageOps
from PIL.ExifTags import TAGS

SRC = "tools/input"
OUT = "src/assets/photos"
os.makedirs(OUT, exist_ok=True)


def shutter(exposure):
    if not exposure:
        return None
    f = Fraction(float(exposure)).limit_denominator(8000)
    if f >= 1:
        return f"{float(f):g}s"
    return f"1/{round(1 / float(f))}"


manifest = {}

for path in sorted(glob.glob(os.path.join(SRC, "*.JPG"))):
    ref = os.path.basename(path).split("_")[-1].replace(".JPG", "")
    im = Image.open(path)

    exif = im.getexif()
    ifd = exif.get_ifd(0x8769)
    tags = {TAGS.get(k, k): v for k, v in ifd.items()}

    im = ImageOps.exif_transpose(im).convert("RGB")
    w, h = im.size

    for edge in (2000, 900):
        copy = im.copy()
        copy.thumbnail((edge, edge), Image.LANCZOS)
        copy.save(
            os.path.join(OUT, f"{ref}-{edge}.jpg"),
            "JPEG",
            quality=82,
            optimize=True,
            progressive=True,
        )

    tiny = im.copy()
    tiny.thumbnail((24, 24), Image.LANCZOS)
    buf = io.BytesIO()
    tiny.save(buf, "JPEG", quality=40)
    lqip = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    dt = str(tags.get("DateTimeOriginal", ""))
    manifest[ref] = {
        "ref": ref,
        "src": f"/assets/photos/{ref}",
        "w": w,
        "h": h,
        "ratio": round(w / h, 4),
        "lqip": lqip,
        "exif": {
            "focal": f"{int(tags['FocalLength'])}mm" if tags.get("FocalLength") else None,
            "aperture": f"f/{float(tags['FNumber']):g}" if tags.get("FNumber") else None,
            "shutter": shutter(tags.get("ExposureTime")),
            "iso": tags.get("ISOSpeedRatings"),
            "body": "Canon EOS R7",
            "lens": tags.get("LensModel"),
            "date": dt[:10].replace(":", "-") if dt else None,
            "time": dt[11:16] if dt else None,
        },
    }
    print(ref, im.size, manifest[ref]["exif"]["focal"], manifest[ref]["exif"]["shutter"])

with open("src/_data/photos.json", "w") as fh:
    json.dump(manifest, fh, indent=2)

print("frames:", len(manifest))
