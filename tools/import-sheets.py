#!/usr/bin/env python3
"""Cut generated sprite sheets into game-ready sprites.

  python3 tools/import-sheets.py                 # all sheets in assets/src/sheets
  python3 tools/import-sheets.py --preview DIR   # also write contact sheets to DIR

Then repack the atlas:

  python3 tools/pack-atlas.py assets/src/icons assets/src/citizens \
      assets/src/world --out assets/city --pad 2

Needs Pillow and numpy. The sheets come from an image generator (prompts in the
"Codeopolis Sprite Prompts" page), drawn on a flat magenta background and
usually saved as JPEG, so nothing about them is pixel-exact: the magenta is
smeared into the edges, sprites are not on a grid, and every sprite is drawn at
whatever size the generator liked. This puts them on the game's terms:

  citizens   12 x 6 grid, one person per row: 6 walk frames facing the camera,
             then 6 walking away. One scale for the whole sheet so a person is
             the same size in every frame, and each frame is placed by its head
             so the walk does not jitter. 20 x 24 frames, outlined -> 22 x 26.
  buildings  freeform sheet; sprites are found as separate blobs and picked by
             position into Level 1-3 (BUILDING_PICKS). Each is scaled so its ground
             base is exactly one tile wide, whatever size it was drawn at.
  large      5 x 2 grid of 2x2 buildings and 2x2 construction stages, scaled so
             the base is exactly two tiles wide.
  icons      4 x 4 grid of interface icons, written as 64 x 64 images for the
             page (not the atlas), with soft edges for the browser to scale.

Building anchor contract (read by building-tier-visuals.js): every world
sprite is centred on its base, and the front corner of the base's top face sits
BASE_PAD * footprint pixels above the bottom of the image.
"""
import argparse, json, os, sys
from collections import deque
import numpy as np
from PIL import Image

SHEETS = 'assets/src/sheets'
BASE_PAD = 4                   # px of base edge kept below the front corner, per footprint cell
OUTLINE = (34, 24, 20, 255)
ROLES = ['builder', 'scholar', 'merchant', 'gardener', 'keeper', 'messenger']
ICONS = ['credits', 'insight', 'materials', 'trade', 'research', 'compute', 'infrastructure', 'stability',
         'streak', 'momentum', 'energy', 'population', 'happiness', 'build-boost', 'hint', 'goal']
# Where each pick sits on sheet-buildings (x, y in sheet pixels; see --preview).
# The sheet drew more variants than asked for; these are the clearest Level 1 -> 2 -> 3.
# Picked by position, not by blob number, so a change in how blobs are found
# cannot quietly swap a park for a windmill.
BUILDING_PICKS = {
    'house': ((75, 74), (159, 72), (267, 69)),
    'market': ((632, 75), (751, 82), (912, 74)),
    'foundry': ((155, 165), (225, 234), (414, 228)),
    'observatory': ((791, 167), (871, 245), (950, 243)),
    'park': ((75, 355), (227, 362), (416, 357)),
    'solar': ((552, 337), (670, 359), (909, 357)),
    'tower': ((75, 514), (393, 498), (472, 499)),
    'academy': ((552, 521), (711, 506), (951, 509)),
}
LARGE_CELLS = [['bld-transit-1', 'bld-transit-2', 'bld-transit-3', 'build2-foundation', 'build2-frame'],
               ['bld-lab-1', 'bld-lab-2', 'bld-lab-3', 'build2-scaffold', 'build2-shell']]


# ---- masks -----------------------------------------------------------------
def load(name):
    return np.array(Image.open(os.path.join(SHEETS, name)).convert('RGB')).astype(np.int16)


def magenta(rgb):
    """The backdrop by colour, not value: JPEG moves it around (253,56,250),
    (245,45,242)... Red and blue high, green well below both. The art has no
    colour like this (keeper blue, merchant red and the teal robes all fail)."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (r > 140) & (b > 140) & (g < np.minimum(r, b) * 0.62 + 20)


def erode(mask, n=1):
    m = mask.copy()
    for _ in range(n):
        m[1:, :] &= mask[:-1, :]; m[:-1, :] &= mask[1:, :]; m[:, 1:] &= mask[:, :-1]; m[:, :-1] &= mask[:, 1:]
        mask = m.copy()
    return m


def despill(rgb, fg):
    """Edge pixels carry some backdrop: pull the shared red+blue excess over
    green back out, so a fringe reads as the sprite's own colour, not pink."""
    out = rgb.copy()
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    excess = np.clip(np.minimum(r, b) - g - 24, 0, None)
    edge = fg & ~erode(fg, 2)
    out[..., 0] = np.where(edge, r - excess, r)
    out[..., 2] = np.where(edge, b - excess, b)
    return np.clip(out, 0, 255)


def runs(v, th=1):
    out, on = [], False
    for i, x in enumerate(v > th):
        if x and not on: st, on = i, True
        if not x and on: out.append((st, i)); on = False
    if on: out.append((st, len(v)))
    return out


def components(fg):
    """4-connected blobs: (label image, [[x0,y0,x1,y1,count,label], ...])."""
    H, W = fg.shape
    lab = np.zeros((H, W), np.int32)
    out, n = [], 0
    ys, xs = np.nonzero(fg)
    for y, x in zip(ys, xs):
        if lab[y, x]: continue
        n += 1; q = deque([(y, x)]); lab[y, x] = n; x0 = x1 = x; y0 = y1 = y; cnt = 0
        while q:
            cy, cx = q.popleft(); cnt += 1
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < H and 0 <= nx < W and fg[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; q.append((ny, nx))
                    x0, x1, y0, y1 = min(x0, nx), max(x1, nx), min(y0, ny), max(y1, ny)
        out.append([x0, y0, x1, y1, cnt, n])
    return lab, out


def sprites(fg, big=1200, near=14):
    """Blobs big enough to be a sprite, with small detached bits (sparkles,
    windmill sails) folded into the sprite they sit on."""
    lab, comps = components(fg)
    groups = [dict(box=c[:4], labels={c[5]}) for c in comps if c[4] >= big]
    for c in comps:
        if not (25 <= c[4] < big): continue
        cx, cy = (c[0] + c[2]) / 2, (c[1] + c[3]) / 2
        dist = lambda g: max(g['box'][0] - cx, 0, cx - g['box'][2]) + max(g['box'][1] - cy, 0, cy - g['box'][3])
        g = min(groups, key=dist)
        if dist(g) < near:
            b = g['box']; g['box'] = [min(b[0], c[0]), min(b[1], c[1]), max(b[2], c[2]), max(b[3], c[3])]
            g['labels'].add(c[5])
    groups.sort(key=lambda g: (g['box'][3] // 70, g['box'][0]))
    return lab, groups


# ---- pixels ----------------------------------------------------------------
def rgba(rgb, mask):
    a = np.dstack([rgb.astype(np.uint8), (mask * 255).astype(np.uint8)])
    return Image.fromarray(a, 'RGBA')


def scale(im, size):
    """Resize through premultiplied alpha so transparent pixels do not bleed
    their (magenta) colour into the edge."""
    return im.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA')


def harden(im, cut=110):
    a = np.array(im); a[..., 3] = np.where(a[..., 3] >= cut, 255, 0); return Image.fromarray(a, 'RGBA')


def palette_from(images, colors):
    """One palette from the opaque pixels of every sprite on a sheet."""
    px = np.concatenate([np.array(i)[..., :3][np.array(i)[..., 3] > 0] for i in images]).astype(np.uint8)
    strip = Image.fromarray(px.reshape(-1, 1, 3), 'RGB')
    return strip.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)


def snap(im, pal):
    """Flat colours on a shared palette: the generator's soft shading becomes
    pixel-art clusters, and every sprite on a sheet speaks the same colours."""
    q = im.convert('RGB').quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')
    out = np.dstack([np.array(q), np.array(im)[..., 3]])
    return Image.fromarray(out.astype(np.uint8), 'RGBA')


def outline(im):
    w, h = im.size
    out = Image.new('RGBA', (w + 2, h + 2), (0, 0, 0, 0)); out.paste(im, (1, 1))
    a = np.array(out); solid = a[..., 3] > 0
    ring = np.zeros_like(solid)
    ring[1:, :] |= solid[:-1, :]; ring[:-1, :] |= solid[1:, :]; ring[:, 1:] |= solid[:, :-1]; ring[:, :-1] |= solid[:, 1:]
    ring &= ~solid
    a[ring] = OUTLINE
    return Image.fromarray(a, 'RGBA')


def trim(im):
    box = im.getbbox(); return im.crop(box) if box else im


# ---- sheets ----------------------------------------------------------------
def citizens(out_dir):
    rgb = load('sheet-citizens.jpg'); fg = ~magenta(rgb); fg = erode(fg, 1); rgb = despill(rgb, fg)
    cols, rows = runs(fg.sum(0)), runs(fg.sum(1))
    if len(cols) != 12 or len(rows) != 6:
        sys.exit(f'citizens: expected a 12 x 6 grid, found {len(cols)} x {len(rows)}')
    heights = sorted(y1 - y0 for y0, y1 in rows)
    s = 22 / heights[len(heights) // 2]          # one scale for the sheet: a person is one size in every frame
    W, H = 20, 24
    win_w, win_h = round(W / s), round(H / s)
    frames = {}
    for ri, (y0, y1) in enumerate(rows):
        for ci, (x0, x1) in enumerate(cols):
            cell = fg[y0:y1, x0:x1]
            top = cell[: max(1, (y1 - y0) * 3 // 10)]
            hx = x0 + (np.nonzero(top)[1].mean() if top.any() else (x1 - x0) / 2)   # the head, not the swinging arms
            bx0, by1 = int(round(hx - win_w / 2)), y1 + 1
            box = (bx0, by1 - win_h, bx0 + win_w, by1)
            crop = rgba(rgb, fg).crop(box)
            role, view, n = ROLES[ri], 'f' if ci < 6 else 'b', ci % 6
            frames[f'cit-{role}-{view}{n}'] = harden(scale(crop, (W, H)))
    pal = palette_from(list(frames.values()), 64)
    for k, im in frames.items():
        outline(snap(im, pal)).save(os.path.join(out_dir, k + '.png'))
    return frames


def base_metrics(alpha):
    """Width of the ground base and where its front corner is, measured from
    the opaque mask. The base is the widest thing in the lower part of the
    sprite; its front corner is the lowest opaque pixel under the base centre."""
    ys, xs = np.nonzero(alpha)
    y0, y1 = ys.min(), ys.max()
    low = alpha[y0 + int((y1 - y0) * .6):y1 + 1]
    lx = [np.nonzero(r)[0] for r in low if r.any()]
    left, right = min(r[0] for r in lx), max(r[-1] for r in lx)
    cx = (left + right) / 2
    col = alpha[:, int(round(cx)) - 1:int(round(cx)) + 2].any(1)
    bottom = np.nonzero(col)[0].max()
    return right - left + 1, cx, bottom


def place(im, cells):
    """Scale so the base is `cells` tiles wide, centre it, and crop below the
    base's front corner to the anchor contract."""
    a = np.array(im)[..., 3] > 0
    w, cx, bottom = base_metrics(a)
    s = 64 * cells / w
    big = scale(im, (max(1, round(im.width * s)), max(1, round(im.height * s))))
    big = harden(big)
    a2 = np.array(big)[..., 3] > 0
    w2, cx2, bottom2 = base_metrics(a2)
    # The front corner of the top face sits above the lowest pixel by the base's
    # edge thickness; the generator draws that edge about 9% of the base width.
    corner = bottom2 - round(0.09 * w2)
    half = int(np.ceil(max(cx2 - np.nonzero(a2.any(0))[0].min(), np.nonzero(a2.any(0))[0].max() - cx2, 32 * cells))) + 1
    top = np.nonzero(a2.any(1))[0].min()
    pad = BASE_PAD * cells
    canvas = Image.new('RGBA', (half * 2, corner + pad - top + 1), (0, 0, 0, 0))
    canvas.paste(big.crop((int(round(cx2)) - half, top, int(round(cx2)) + half, corner + pad + 1)), (0, 0))
    return canvas


def buildings(out_dir):
    rgb = load('sheet-buildings.jpg'); fg = ~magenta(rgb); fg = erode(fg, 1); rgb = despill(rgb, fg)
    lab, groups = sprites(fg)
    made = {}
    def at(px, py):
        hits = [g for g in groups if g['box'][0] <= px <= g['box'][2] and g['box'][1] <= py <= g['box'][3]]
        if not hits: sys.exit(f'buildings: no sprite at {px},{py}')
        return min(hits, key=lambda g: (g['box'][2] - g['box'][0]) * (g['box'][3] - g['box'][1]))
    for bid, picks in BUILDING_PICKS.items():
        for level, (px, py) in enumerate(picks, 1):
            g = at(px, py); x0, y0, x1, y1 = g['box']
            mask = np.isin(lab[y0:y1 + 1, x0:x1 + 1], list(g['labels']))
            made[f'bld-{bid}-{level}'] = place(rgba(rgb[y0:y1 + 1, x0:x1 + 1], mask), 1)
    return made, groups


def large(out_dir):
    rgb = load('sheet-large-buildings.jpg'); H, W = rgb.shape[:2]
    made = {}
    for r, row in enumerate(LARGE_CELLS):
        for c, name in enumerate(row):
            # Cells are drawn with border lines; stay inside them.
            x0, x1 = round(c * W / 5) + 5, round((c + 1) * W / 5) - 5
            y0, y1 = round(r * H / 2) + 5, round((r + 1) * H / 2) - 5
            sub = rgb[y0:y1, x0:x1]; fg = ~magenta(sub); fg = erode(fg, 1); sub = despill(sub, fg)
            lab, groups = sprites(fg, big=3000, near=10)
            g = max(groups, key=lambda g: (g['box'][2] - g['box'][0]) * (g['box'][3] - g['box'][1]))
            bx0, by0, bx1, by1 = g['box']
            mask = np.isin(lab[by0:by1 + 1, bx0:bx1 + 1], list(g['labels']))
            made[name] = place(rgba(sub[by0:by1 + 1, bx0:bx1 + 1], mask), 2)
    return made


def icons(out_dir):
    rgb = load('sheet-icons.jpg'); fg = ~magenta(rgb); fg = erode(fg, 1); rgb = despill(rgb, fg)
    cols, rows = runs(fg.sum(0)), runs(fg.sum(1))
    if len(cols) != 4 or len(rows) != 4:
        sys.exit(f'icons: expected a 4 x 4 grid, found {len(cols)} x {len(rows)}')
    os.makedirs(out_dir, exist_ok=True)
    made = {}
    for ri, (y0, y1) in enumerate(rows):
        for ci, (x0, x1) in enumerate(cols):
            im = trim(rgba(rgb[y0:y1, x0:x1], fg[y0:y1, x0:x1]))
            side = max(im.size); sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
            sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
            icon = scale(sq, (60, 60)); out = Image.new('RGBA', (64, 64), (0, 0, 0, 0)); out.paste(icon, (2, 2))
            name = ICONS[ri * 4 + ci]; out.save(os.path.join(out_dir, f'{name}.png')); made[name] = out
    return made


def finish(world, out_dir):
    """Snap all world sprites to one palette, so buildings from two sheets sit
    together, and write them."""
    pal = palette_from(list(world.values()), 64)
    for k, im in world.items():
        snap(im, pal).save(os.path.join(out_dir, k + '.png'))


def preview(path, images, scale_by=3, label=True):
    from PIL import ImageDraw
    items = list(images.items()); cols = 8
    cw = max(i.width for _, i in items) * scale_by + 16; ch = max(i.height for _, i in items) * scale_by + 30
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cw, rows * ch), (40, 46, 52, 255)); d = ImageDraw.Draw(sheet)
    for n, (k, im) in enumerate(items):
        x, y = (n % cols) * cw + 8, (n // cols) * ch + 4
        big = im.resize((im.width * scale_by, im.height * scale_by), Image.NEAREST)
        sheet.alpha_composite(big, (x, y + ch - 30 - big.height))
        if label: d.text((x, y + ch - 24), k, fill=(230, 230, 230))
    sheet.save(path)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--preview')
    a = ap.parse_args()
    cit = citizens('assets/src/citizens')
    world, groups = buildings('assets/src/world'); world.update(large('assets/src/world'))
    finish(world, 'assets/src/world')
    ic = icons('assets/ui/icons')
    print(f'citizens {len(cit)} frames, world {len(world)} sprites, icons {len(ic)}')
    if a.preview:
        os.makedirs(a.preview, exist_ok=True)
        preview(os.path.join(a.preview, 'citizens.png'), {k: Image.open(f'assets/src/citizens/{k}.png') for k in cit}, 4)
        preview(os.path.join(a.preview, 'world.png'), {k: Image.open(f'assets/src/world/{k}.png') for k in world}, 2)
        preview(os.path.join(a.preview, 'icons.png'), ic, 1)
    return 0


if __name__ == '__main__':
    sys.exit(main())
