#!/usr/bin/env python3
"""Turn the hand-drawn isometric sheet into world frames the city scene can use.

    python3 tools/build-world-frames.py <sheet.jpg> --out assets/src/world

The scene already prefers an atlas frame over its generated texture whenever the
key exists (see PhaserCityScene.sprite), so this writes frames under the keys it
asks for -- terrain-*, road-*, building-*, tree-* -- and nothing in the renderer
has to change.

Three properties of the source art have to be corrected on the way in:

  * sprites sit on a magenta backdrop that JPEG has smeared into a halo, so a
    plain colour key leaves a purple rim and the map grows a purple grid;
  * every sprite bakes in the slab side-walls under its tile, which draw a dark
    line between neighbours once the tiles tessellate;
  * the sheet has two y-axis streets and no x-axis one, so the perpendicular
    piece and the fourteen remaining road masks have to be derived.

Frames are padded so the origins the scene already applies land the tile diamond
exactly on the projected cell centre.
"""
import argparse, json, os, sys
from PIL import Image, ImageDraw

TILE_W = 64                     # PixelWorldProjection.TILE_W
HALF_W, HALF_H = TILE_W // 2, TILE_W // 4

# Rows of the sheet, as (prefix, y0, y1, names). Bands are separated by the
# gaps in the sheet's row projection; columns are found per band.
BANDS = [
    ('tile',  4,  97, ['grass', 'meadow', 'worn', 'dirt', 'water', 'scrub']),
    ('road',  102, 199, ['a', 'b', 'c', 'd', 'e', 'f']),
    ('house', 198, 322, ['thatch', 'timber', 'twostorey', 'shop', 'stilt', 'shed']),
    ('mark',  320, 442, ['townhall', 'windmill', 'watermill', 'market', 'forge', 'well']),
]
# The bottom row's canopies touch, so its eight cells are taken on a fixed pitch.
PROPS = ['tree-oak', 'tree-pine', 'tree-birch', 'tree-blossom',
         'prop-rocks', 'prop-hay', 'prop-lamp', 'prop-flowers']

# key -> (origin fraction y, y offset the scene draws at)
GEOMETRY = {'terrain': (0.5, 0), 'road': (0.5, 0), 'tree': (0.92, 9), 'building': (0.86, 9)}

TERRAIN = {                     # game terrain -> source tile per variant
    'grass':  ['grass', 'meadow', 'grass', 'worn', 'grass', 'meadow'],
    'dirt':   ['dirt', 'dirt', 'worn', 'dirt'],
    'water':  ['water'] * 3,
    'forest': ['scrub'] * 5,
}
# house-stilt is left out on purpose: it bakes a pond into its base, which reads
# as a puddle when the district lands on a grass cell.
BUILDINGS = {
    'core': 'mark-townhall',        'arrays': 'house-timber',
    'hash': 'house-thatch',         'structures': 'house-twostorey',
    'search': 'house-shop',         'graphs': 'mark-windmill',
    'dp': 'mark-watermill',         'materials': 'mark-forge',
    'trade': 'mark-market',         'research': 'mark-well',
    'compute': 'house-shed',        'infrastructure': 'house-twostorey',
    'stability': 'house-timber',    'unknown': 'house-shed',
}
TREES = ['tree-oak', 'tree-pine', 'tree-birch', 'tree-blossom', 'tree-oak']
# Scatter the scene already draws, as art rather than as coloured rectangles.
DECOR = ['prop-flowers', 'prop-rocks']


def is_backdrop(c):
    r, g, b = c[:3]
    return r > 185 and b > 185 and g < 115


def edge_pixels(px, w, h, depth):
    """Coordinates of opaque pixels within `depth` of transparency."""
    ring, seen = [], set()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1),
                           (1, 1), (1, -1), (-1, 1), (-1, -1)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < w and 0 <= ny < h) or px[nx, ny][3] == 0:
                    ring.append((x, y)); seen.add((x, y)); break
    for _ in range(depth - 1):
        nxt = []
        for x, y in ring:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if (0 <= n[0] < w and 0 <= n[1] < h and n not in seen and px[n][3] > 0):
                    nxt.append(n); seen.add(n)
        ring = nxt
    return seen


def decast(im, depth=3):
    """Neutralise the magenta the backdrop bled into the sprite's outline.

    Keying removes the backdrop but not the pixels it tinted, and those survive
    the downscale as a purple line along every tile edge. Blue is pulled back
    towards green near the silhouette, which leaves warm roofs and cool water
    alone because neither is magenta-biased.
    """
    im = im.convert('RGBA')
    px = im.load()
    for x, y in edge_pixels(px, im.width, im.height, depth):
        r, g, b, a = px[x, y]
        if b > g + 8 and r > g + 8:
            px[x, y] = (min(r, g + 70), g, g + 8, a)
    return im


def defringe(im, passes=3):
    """Drop the JPEG halo: edge pixels that are translucent or magenta-tinted."""
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    for _ in range(passes):
        kill = []
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a == 0:
                    continue
                touching = False
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1),
                               (1, 1), (1, -1), (-1, 1), (-1, -1)):
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < w and 0 <= ny < h) or px[nx, ny][3] == 0:
                        touching = True
                        break
                if touching and (a < 200 or (r > 125 and b > 125 and g < max(r, b) - 22)):
                    kill.append((x, y))
        if not kill:
            break
        for x, y in kill:
            px[x, y] = (0, 0, 0, 0)
    return im


def cut(sheet, x0, x1, y0, y1):
    """Crop one sprite, key out the backdrop and trim to its own content."""
    w, h = sheet.size
    px = sheet.load()
    x1, y1 = min(x1, w - 1), min(y1, h)
    ys = [y for y in range(y0, y1)
          if any(not is_backdrop(px[x, y]) for x in range(x0, x1 + 1))]
    im = sheet.crop((x0, ys[0], x1 + 1, ys[-1] + 1)).convert('RGBA')
    q = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if is_backdrop(q[x, y]):
                q[x, y] = (0, 0, 0, 0)
    im = decast(defringe(im.crop(im.getbbox())))
    return im.crop(im.getbbox())


def measure(im):
    """Return (base diamond width, centre x, centre y) of the tile the art sits on."""
    px = im.load()
    rows = []
    for y in range(im.height):
        xs = [x for x in range(im.width) if px[x, y][3] > 110]
        rows.append((xs[0], xs[-1]) if xs else None)
    bot = max(y for y, r in enumerate(rows) if r)
    lo = max(0, bot - 52)
    waist = max((y for y in range(lo, bot + 1) if rows[y]),
                key=lambda y: rows[y][1] - rows[y][0])
    l, r = rows[waist]
    return r - l + 1, (l + r) / 2.0, waist


def to_tile(im, mirror=False):
    """Scale so the top face is TILE_W wide and drop the slab under it.

    Returns (image, diamond centre y). The slab has to go: it is drawn below the
    tile's top face, so on a tessellated map every neighbour shows its dark side
    wall as a grid line.
    """
    if mirror:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    base_w, _, waist = measure(im)
    im = im.crop((0, 0, im.width, min(im.height, waist + base_w // 4 - 1)))
    s = TILE_W / base_w
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    return im, waist * s


def frame(im, centre_y, kind):
    """Pad so the scene's origin puts the diamond centre on the cell centre.

    The scene draws with origin (0.5, fy) at p.y + off, so a diamond centre at
    local y `dc` lands on p.y only when dc == fy * height - off.
    """
    fy, off = GEOMETRY[kind]
    top = (fy * im.height - off - centre_y) / (1 - fy) if fy < 1 else 0
    top, bottom = (int(round(top)), 0) if top >= 0 else (0, int(round((centre_y + off) / fy - im.height)))
    w = max(im.width, TILE_W)
    out = Image.new('RGBA', (w, im.height + top + max(0, bottom)), (0, 0, 0, 0))
    out.alpha_composite(im, ((w - im.width) // 2, top))
    return out


def quadrant(size, centre, direction):
    """Mask for the wedge of the diamond facing one neighbour."""
    cx, cy = centre
    tips = {'y-': ((cx, cy - HALF_H), (cx + HALF_W, cy)), 'x+': ((cx + HALF_W, cy), (cx, cy + HALF_H)),
            'y+': ((cx, cy + HALF_H), (cx - HALF_W, cy)), 'x-': ((cx - HALF_W, cy), (cx, cy - HALF_H))}
    a, b = tips[direction]
    m = Image.new('L', size, 0)
    # nudged outward so neighbouring wedges overlap rather than leave a hairline
    ex = lambda p: (cx + (p[0] - cx) * 1.25, cy + (p[1] - cy) * 1.25)
    ImageDraw.Draw(m).polygon([(cx, cy), ex(a), ex(b)], fill=255)
    return m


def road_masks(pieces):
    """Derive all sixteen road masks from the two straight pieces.

    The sheet only draws streets along the y axis; mirroring one horizontally
    swaps the isometric axes and yields the x-axis street, and the corners, tees
    and crossings are those two composited a wedge at a time.
    """
    straight_y, cy_y = pieces['y']
    straight_x, cy_x = pieces['x']
    cross, cy_c = pieces['cross']
    stub, cy_s = pieces['stub']
    bits = {1: 'y-', 2: 'x+', 4: 'y+', 8: 'x-'}
    out = {}
    for mask in range(16):
        if mask == 0:
            out[0] = (stub, cy_s); continue
        if mask == 5:
            out[5] = (straight_y, cy_y); continue
        if mask == 10:
            out[10] = (straight_x, cy_x); continue
        if mask == 15:
            out[15] = (cross, cy_c); continue
        # Composite onto the widest piece so every wedge has room.
        base = max((straight_y, straight_x), key=lambda p: p.height)
        canvas = Image.new('RGBA', base.size, (0, 0, 0, 0))
        cy = cy_y if base is straight_y else cy_x
        for bit, direction in bits.items():
            if not mask & bit:
                continue
            src, scy = (straight_y, cy_y) if direction in ('y-', 'y+') else (straight_x, cy_x)
            layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
            layer.alpha_composite(src, ((canvas.width - src.width) // 2, int(round(cy - scy))))
            canvas.paste(layer, (0, 0), quadrant(canvas.size, (canvas.width / 2, cy), direction))
        out[mask] = (canvas, cy)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sheet')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    sheet = Image.open(a.sheet).convert('RGB')
    W, H = sheet.size
    px = sheet.load()

    parts = {}
    for prefix, y0, y1, names in BANDS:
        cols = [sum(1 for y in range(y0, min(y1, H)) if not is_backdrop(px[x, y]))
                for x in range(W)]
        runs, start = [], None
        for x, c in enumerate(cols + [0]):
            if c > 2 and start is None:
                start = x
            elif c <= 2 and start is not None:
                if x - start > 25:
                    runs.append((start, x - 1))
                start = None
        if len(runs) != len(names):
            print(f'{prefix}: found {len(runs)} columns, expected {len(names)}', file=sys.stderr)
            return 1
        for (x0, x1), name in zip(runs, names):
            parts[f'{prefix}-{name}'] = cut(sheet, x0, x1, y0, y1)
    pitch = W // len(PROPS)
    for i, name in enumerate(PROPS):
        parts[name] = cut(sheet, i * pitch, i * pitch + pitch - 1, 440, H)

    os.makedirs(a.out, exist_ok=True)
    written = 0

    def write(key, im, centre_y, kind):
        nonlocal written
        frame(im, centre_y, kind).save(os.path.join(a.out, f'{key}.png'))
        written += 1

    for terrain, variants in TERRAIN.items():
        for v, src in enumerate(variants):
            im, cy = to_tile(parts[f'tile-{src}'])
            for f in range(2 if terrain == 'water' else 1):
                write(f'terrain-{terrain}-{v}-{f}', im, cy, 'terrain')

    straights = {'y': to_tile(parts['road-a']), 'x': to_tile(parts['road-a'], mirror=True),
                 'cross': to_tile(parts['road-e']), 'stub': to_tile(parts['road-f'])}
    for mask, (im, cy) in road_masks(straights).items():
        write(f'road-{mask}', im, cy, 'road')

    for district, src in BUILDINGS.items():
        im, cy = to_tile(parts[src])
        write(f'building-{district}', im, cy, 'building')

    for v, src in enumerate(TREES):
        im, cy = to_tile(parts[src])
        write(f'tree-{v}', im, cy, 'tree')

    for src in DECOR:
        im, cy = to_tile(parts[src])
        write(src, im, cy, 'tree')

    print(f'{written} frames -> {a.out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
