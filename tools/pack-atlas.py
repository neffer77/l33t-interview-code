#!/usr/bin/env python3
"""Pack loose sprite PNGs into one texture atlas Phaser can load directly.

  python3 tools/pack-atlas.py assets/src/icons assets/src/citizens \
      --out assets/city --pad 2

Writes <out>.png plus <out>.json in Phaser's JSON-Hash format, so the game can
do  this.load.atlas('city','assets/city.png','assets/city.json')  and then
address any sprite by its file name:  this.add.image(x, y, 'city', 'zone-civic').
"""
import argparse, json, os, sys, glob
from PIL import Image


def pack(images, pad):
    """Shelf-pack tallest-first into a squarish sheet."""
    items = sorted(images, key=lambda kv: -kv[1].height)
    total = sum((im.width + pad) * (im.height + pad) for _, im in items)
    width = max(int((total ** .5) * 1.15), max(im.width for _, im in items) + pad * 2)
    placed, x, y, shelf = {}, pad, pad, 0
    for name, im in items:
        if x + im.width + pad > width:
            x, y, shelf = pad, y + shelf + pad, 0
        placed[name] = (x, y)
        x += im.width + pad
        shelf = max(shelf, im.height)
    height = y + shelf + pad
    return placed, width, height


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dirs", nargs="+")
    ap.add_argument("--out", required=True, help="path without extension")
    ap.add_argument("--pad", type=int, default=2)
    a = ap.parse_args()

    images = []
    for d in a.dirs:
        for f in sorted(glob.glob(os.path.join(d, "*.png"))):
            images.append((os.path.splitext(os.path.basename(f))[0],
                           Image.open(f).convert("RGBA")))
    if not images:
        print("no PNGs found", file=sys.stderr)
        return 1
    names = [n for n, _ in images]
    if len(set(names)) != len(names):
        dupes = {n for n in names if names.count(n) > 1}
        print(f"duplicate frame names across folders: {sorted(dupes)}", file=sys.stderr)
        return 1

    placed, W, H = pack(images, a.pad)
    sheet = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    frames = {}
    for name, im in images:
        x, y = placed[name]
        sheet.paste(im, (x, y), im)
        frames[name] = {
            "frame": {"x": x, "y": y, "w": im.width, "h": im.height},
            "rotated": False, "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": im.width, "h": im.height},
            "sourceSize": {"w": im.width, "h": im.height},
        }

    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    sheet.save(a.out + ".png")
    with open(a.out + ".json", "w") as fh:
        json.dump({"frames": frames,
                   "meta": {"image": os.path.basename(a.out) + ".png",
                            "size": {"w": W, "h": H}, "scale": "1"}}, fh, indent=1)
    kb = os.path.getsize(a.out + ".png") / 1024.0
    print(f"{len(frames)} frames -> {a.out}.png ({W}x{H}, {kb:.0f} KB) + {a.out}.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
