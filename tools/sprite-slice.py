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


def autogrid(im, gap=6):
    """Find sprite cells by looking at where the art actually is.

    A fixed rows x cols grid assumes every row is the same height. Generators
    do not honour that — rows come back unevenly spaced, and a fixed grid then
    slices every sprite across a cell boundary. So instead: project the opaque
    pixels onto each axis, split into runs wherever there is a clear gap of
    empty space, and treat each run as a real boundary. Returns a list of
    (left, top, right, bottom) boxes in reading order.
    """
    w, h = im.size
    px = im.load()

    def runs(occupied, limit):
        out, start = [], None
        for i in range(limit):
            if occupied[i] and start is None:
                start = i
            elif not occupied[i] and start is not None:
                if i - start > 2:
                    out.append((start, i))
                start = None
        if start is not None and limit - start > 2:
            out.append((start, limit))
        # merge runs separated by less than `gap` — a sprite can have internal
        # transparent scanlines (a gap between a roof and a chimney, say)
        merged = []
        for r in out:
            if merged and r[0] - merged[-1][1] < gap:
                merged[-1] = (merged[-1][0], r[1])
            else:
                merged.append(list(r))
        return [tuple(m) for m in merged]

    rowfull = [any(px[x, y][3] > 8 for x in range(w)) for y in range(h)]
    boxes = []
    for (top, bot) in runs(rowfull, h):
        colfull = [any(px[x, y][3] > 8 for y in range(top, bot)) for x in range(w)]
        for (left, right) in runs(colfull, w):
            boxes.append((left, top, right, bot))
    return boxes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet")
    ap.add_argument("--cols", type=int)
    ap.add_argument("--rows", type=int)
    ap.add_argument("--auto", action="store_true",
                    help="detect cells from the art instead of assuming a fixed grid")
    ap.add_argument("--gap", type=int, default=6)
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
    names = [n.strip() for n in a.names.split(",") if n.strip()]
    os.makedirs(a.out, exist_ok=True)

    if a.auto:
        # Rows separate cleanly (clear horizontal gaps between them) but the
        # sprites within a row nearly touch, because each sits on a wide base
        # that abuts its neighbour. So detect the row bands from the art and
        # split each band into `cols` equal columns, which ARE regular.
        px = keyed.load()
        rowfull = [any(px[x, y][3] > 8 for x in range(W)) for y in range(H)]
        bands, start = [], None
        for i in range(H):
            if rowfull[i] and start is None:
                start = i
            elif not rowfull[i] and start is not None:
                if i - start > 8:
                    bands.append((start, i))
                start = None
        if start is not None and H - start > 8:
            bands.append((start, H))
        cols = a.cols or 6
        cells = [(int(c * W / cols), t, int((c + 1) * W / cols), b)
                 for (t, b) in bands for c in range(cols)]
        print(f"  detected {len(bands)} row bands: "
              + ", ".join(f"{t}-{b}" for t, b in bands))
    else:
        if not (a.cols and a.rows):
            print("need --cols/--rows, or --auto", file=sys.stderr)
            return 1
        cw, ch = W / a.cols, H / a.rows
        cells = [(int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch))
                 for r in range(a.rows) for c in range(a.cols)]

    written, empty = [], []
    if True:
        for i, box in enumerate(cells):
            cell = keyed.crop(box)
            bbox = cell.getbbox()          # trim the transparent margin
            name = names[i] if i < len(names) else f"{a.prefix}-{i+1:02d}"
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
          f"-> {len(written)} sprites in {a.out}"
          + (f" (auto-detected {len(cells)} cells)" if a.auto else ""))
    if empty:
        print(f"  {len(empty)} empty cell(s): {', '.join(empty)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
