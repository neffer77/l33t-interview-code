#!/usr/bin/env python3
"""Key the magenta backdrop out of a generated sprite sheet and slice it into
individual PNGs.

Generators rarely return the flat #FF00FF we ask for — the backdrop often comes
back as a gradient, and if the file arrives as JPEG the "flat" colour is a cloud
of compression noise. So the backdrop is removed by FLOOD FILLING inward from
the sheet border with a colour tolerance, seeded at many points along the edge.
That tracks a gradient (each seed covers its own local band) and, because it
only removes backdrop connected to the edge, it will not punch holes in colours
inside a sprite that happen to look similar.

  python3 tools/sprite-slice.py sheet.png --cols 6 --rows 5 --out assets/icons \
      --names rest,commute,... [--tol 60] [--scale 32]
"""
import argparse, os, sys
from PIL import Image, ImageDraw

SENTINEL = (1, 2, 3)


def key_background(im, tol, defringe=2):
    """Flood the edge-connected backdrop with SENTINEL, then map it to alpha.

    JPEG sheets smear the hard backdrop/sprite boundary into a halo of blended
    pixels that the flood fill cannot reach (each is too different from its
    seed). So after keying, run `defringe` erosion passes that clear any pixel
    touching transparency whose colour still sits near a sampled backdrop
    colour. Always prefer a PNG sheet: then the halo never exists.
    """
    rgb = im.convert("RGB")
    w, h = rgb.size
    step = max(2, min(w, h) // 120)
    seeds = []
    for x in range(0, w, step):
        seeds += [(x, 0), (x, h - 1)]
    for y in range(0, h, step):
        seeds += [(0, y), (w - 1, y)]
    px = rgb.load()
    bg_samples = []
    for s in seeds:
        if px[s] == SENTINEL:
            continue
        bg_samples.append(px[s])
        ImageDraw.floodfill(rgb, s, SENTINEL, thresh=tol)
    out = im.convert("RGBA")
    op, rp = out.load(), rgb.load()
    cleared = 0
    for y in range(h):
        for x in range(w):
            if rp[x, y] == SENTINEL:
                op[x, y] = (0, 0, 0, 0)
                cleared += 1

    # Enclosed holes — a gear's centre, a padlock's keyhole — are backdrop that
    # the edge flood can never reach. Clear them by colour distance instead.
    # Safe because the backdrop magenta sits far from every palette colour
    # (the plum gear is ~175 away from #FF00FF, the red bolt ~225).
    if bg_samples:
        hole = float(tol)
        for y in range(h):
            for x in range(w):
                if op[x, y][3] == 0:
                    continue
                r, g, b, _a = op[x, y]
                for br, bg_, bb in bg_samples:
                    if ((r - br) ** 2 + (g - bg_) ** 2 + (b - bb) ** 2) ** .5 < hole:
                        op[x, y] = (0, 0, 0, 0)
                        cleared += 1
                        break

    if defringe and bg_samples:
        near = float(tol) * 1.6
        for _ in range(defringe):
            doomed = []
            for y in range(h):
                for x in range(w):
                    if op[x, y][3] == 0:
                        continue
                    if not any(0 <= x + dx < w and 0 <= y + dy < h
                               and op[x + dx, y + dy][3] == 0
                               for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                        continue
                    r, g, b, _a = op[x, y]
                    for br, bg_, bb in bg_samples:
                        if ((r - br) ** 2 + (g - bg_) ** 2 + (b - bb) ** 2) ** .5 < near:
                            doomed.append((x, y))
                            break
            if not doomed:
                break
            for q in doomed:
                op[q] = (0, 0, 0, 0)
            cleared += len(doomed)
    return out, cleared / float(w * h)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet")
    ap.add_argument("--cols", type=int, required=True)
    ap.add_argument("--rows", type=int, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--names", default="", help="comma-separated, row-major")
    ap.add_argument("--prefix", default="sprite")
    ap.add_argument("--tol", type=int, default=60)
    ap.add_argument("--scale", type=int, default=0,
                    help="longest edge in px after nearest-neighbour downscale")
    ap.add_argument("--defringe", type=int, default=2,
                    help="erosion passes to strip a JPEG halo (0 for clean PNG sheets)")
    ap.add_argument("--keep-empty", action="store_true")
    a = ap.parse_args()

    im = Image.open(a.sheet)
    keyed, frac = key_background(im, a.tol, a.defringe)
    W, H = keyed.size
    cw, ch = W / a.cols, H / a.rows
    names = [n.strip() for n in a.names.split(",") if n.strip()]
    os.makedirs(a.out, exist_ok=True)

    written, empty = [], []
    for r in range(a.rows):
        for c in range(a.cols):
            i = r * a.cols + c
            cell = keyed.crop((int(c * cw), int(r * ch),
                               int((c + 1) * cw), int((r + 1) * ch)))
            bbox = cell.getbbox()          # trim the transparent margin
            name = names[i] if i < len(names) else f"{a.prefix}-r{r+1}c{c+1}"
            if not bbox:
                empty.append(name)
                if not a.keep_empty:
                    continue
            else:
                cell = cell.crop(bbox)
            if a.scale and max(cell.size) > a.scale:
                k = a.scale / float(max(cell.size))
                cell = cell.resize((max(1, round(cell.width * k)),
                                    max(1, round(cell.height * k))),
                                   Image.NEAREST)
            cell.save(os.path.join(a.out, name + ".png"))
            written.append(name)

    print(f"{os.path.basename(a.sheet)}: backdrop removed {frac*100:.0f}% of pixels "
          f"-> {len(written)} sprites in {a.out}")
    if empty:
        print(f"  {len(empty)} empty cell(s): {', '.join(empty)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
