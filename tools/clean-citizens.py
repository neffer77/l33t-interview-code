#!/usr/bin/env python3
"""Clean the citizen sprites so they read against the road.

  python3 tools/clean-citizens.py assets/src/citizens            # in place
  python3 tools/clean-citizens.py assets/src/citizens --out DIR  # preview

Then repack the atlas:

  python3 tools/pack-atlas.py assets/src/icons assets/src/citizens \
      assets/src/world --out assets/city --pad 2

The citizens were sliced from a sheet and never went through the pass the world
art gets, so three things were wrong with them on the map:

  * Debris. Short bars of the neighbouring row were cut in below the feet of most
    roles. They float detached under the figure; the merchant's are yellow and
    blue, so they are not shadows. Anything lying wholly below the body goes.
  * Magenta fringe. The sheet's magenta backdrop bled into the edge pixels, worst
    on the messenger. Fringe on the silhouette is dropped (the outline replaces
    it); fringe inside the figure takes its neighbours' colour.
  * No separation. The figures are drawn in the same muted tans, browns and greys
    as the cobbles, so on a road they share both hue and value and dissolve into
    it. A 1px dark outline, the standard fix for pixel characters on busy ground,
    gives each one an edge the eye can find.

Idempotent: a sprite that already carries the outline is left alone, so running
this twice does not grow every figure by another pixel.
"""
import argparse, colorsys, glob, os, sys
from PIL import Image

OUTLINE = (34, 24, 20, 255)   # dark warm brown: reads as an edge, not a black stroke


def is_magenta(p):
    """Magenta by hue, not brightness. Most of the bleed is dark — the backdrop
    blended into the original linework, e.g. (51,0,42), (66,0,68) — so a
    brightness test misses nearly all of it. No figure wears purple (the keeper's
    blue, the merchant's red sash and the scholar's teal all sit outside this
    band), so hue alone is a safe discriminator."""
    r, g, b, a = p
    if a == 0:
        return False
    h, s, _ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    # Saturation floor is low on purpose: the bleed also sits in the light edge
    # pixels as a faint lilac. Nothing legitimate lives in this hue band.
    return 270 / 360 <= h <= 345 / 360 and s > 0.15


def components(im):
    """8-connected opaque regions, largest first."""
    w, h = im.size
    px = im.load()
    seen, out = set(), []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0 or (x, y) in seen:
                continue
            stack, comp = [(x, y)], []
            seen.add((x, y))
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and px[nx, ny][3] > 0:
                            seen.add((nx, ny))
                            stack.append((nx, ny))
            out.append(comp)
    return sorted(out, key=len, reverse=True)


def drop_debris(im):
    """Remove fragments lying wholly below or above the body. Position, not size:
    a held lantern or book is small too, but it overlaps the body's rows."""
    comps = components(im)
    if len(comps) < 2:
        return 0
    body_rows = {y for _, y in comps[0]}
    top, bot = min(body_rows), max(body_rows)
    px, dropped = im.load(), 0
    for comp in comps[1:]:
        rows = {y for _, y in comp}
        if min(rows) > bot or max(rows) < top:
            for x, y in comp:
                px[x, y] = (0, 0, 0, 0)
            dropped += len(comp)
    return dropped


def defringe(im):
    w, h = im.size
    px = im.load()
    fixed = 0
    for y in range(h):
        for x in range(w):
            if not is_magenta(px[x, y]):
                continue
            ns = [px[x + dx, y + dy] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                  if 0 <= x + dx < w and 0 <= y + dy < h]
            if any(n[3] == 0 for n in ns) or len(ns) < 4:
                px[x, y] = (0, 0, 0, 0)          # on the edge: the outline takes over
            elif colorsys.rgb_to_hsv(*(c / 255 for c in px[x, y][:3]))[2] < 0.35:
                px[x, y] = OUTLINE                # dark bleed was linework: keep it a line
            else:
                good = [n for n in ns if not is_magenta(n)]
                if good:
                    px[x, y] = tuple(sum(c[i] for c in good) // len(good) for i in range(3)) + (255,)
            fixed += 1
    return fixed


def has_outline(im):
    """True when every opaque pixel touching transparency is already OUTLINE."""
    w, h = im.size
    px = im.load()
    edge = 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < w and 0 <= ny < h) or px[nx, ny][3] == 0:
                    if px[x, y] != OUTLINE:
                        return False
                    edge += 1
                    break
    return edge > 0


def outline(im):
    """Grow the canvas one pixel each side and ring the silhouette. Orthogonal
    neighbours only, so corners stay open the way hand-drawn outlines do."""
    w, h = im.size
    out = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))
    out.paste(im, (1, 1))
    src, px = out.copy().load(), out.load()
    for y in range(h + 2):
        for x in range(w + 2):
            if src[x, y][3] != 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w + 2 and 0 <= ny < h + 2 and src[nx, ny][3] != 0:
                    px[x, y] = OUTLINE
                    break
    return out


def trim(im):
    """Crop to the figure. Dropping the debris left empty rows under the feet, and
    the game anchors a citizen by its bottom edge, so without this every figure
    floated a few pixels above its own shadow."""
    box = im.getbbox()
    return im.crop(box) if box and box != (0, 0) + im.size else im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--out")
    a = ap.parse_args()
    dst = a.out or a.src
    os.makedirs(dst, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(a.src, "cit-*.png"))):
        im = Image.open(f).convert("RGBA")
        name = os.path.basename(f)
        if has_outline(im):
            out = trim(im)
            out.save(os.path.join(dst, name))
            print(f"{name}: already clean" + ("" if out.size == im.size else
                  f", trimmed {im.size[0]}x{im.size[1]} -> {out.size[0]}x{out.size[1]}"))
            continue
        d, m = drop_debris(im), defringe(im)
        out = trim(outline(im))
        out.save(os.path.join(dst, name))
        print(f"{name}: {im.size[0]}x{im.size[1]} -> {out.size[0]}x{out.size[1]}"
              f"  debris -{d}px  fringe {m}px")
    return 0


if __name__ == "__main__":
    sys.exit(main())
