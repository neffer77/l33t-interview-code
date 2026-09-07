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
# The bottom row sits on eight evenly pitched grass tiles, but the canopies above
# them overhang into their neighbours, so its cells need a per-row split.
PROPS = ['tree-oak', 'tree-pine', 'tree-birch', 'tree-blossom',
         'prop-rocks', 'prop-hay', 'prop-lamp', 'prop-flowers']
PROP_BAND = 440

# The land beyond the playable grid is drawn dimmer, ground and scenery alike,
# so it reads as distance and the buildable grid stays the subject.
SURROUND_DIM = 0.80

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

    Returns (image, diamond centre x, diamond centre y). The slab has to go: it
    is drawn below the tile's top face, so on a tessellated map every neighbour
    shows its dark side wall as a grid line.
    """
    if mirror:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    base_w, cx, waist = measure(im)
    im = im.crop((0, 0, im.width, min(im.height, waist + base_w // 4 - 1)))
    s = TILE_W / base_w
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    return im, cx * s, waist * s


def frame(im, centre_x, centre_y, kind):
    """Pad so the scene's origin puts the diamond centre on the cell centre.

    The scene draws with origin (0.5, fy) at p.y + off, so a diamond centre at
    local (cx, cy) lands on the cell only when cx is the frame's midpoint and
    cy == fy * height - off. Sprites that lean over their tile — the cherry
    canopy reaching past its own grass — are not centred on their base, so the
    padding has to be worked out per side rather than split evenly.
    """
    fy, off = GEOMETRY[kind]
    top = (fy * im.height - off - centre_y) / (1 - fy) if fy < 1 else 0
    top, bottom = (int(round(top)), 0) if top >= 0 else (0, int(round((centre_y + off) / fy - im.height)))
    reach = max(centre_x, im.width - centre_x, TILE_W / 2)
    left = int(round(reach - centre_x))
    w = left + im.width + int(round(reach - (im.width - centre_x)))
    out = Image.new('RGBA', (w, im.height + top + max(0, bottom)), (0, 0, 0, 0))
    out.alpha_composite(im, (left, top))
    return out


def shade(im, factor):
    """Dim a sprite, keeping its alpha."""
    im = im.convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (int(r * factor), int(g * factor), int(b * factor), a)
    return im


def surround_tile(tile):
    """A 64x32 patch of the grass lattice that repeats seamlessly.

    Isometric cell centres sit on a lattice generated by (32, 16) and (-32, 16),
    which contains (64, 0) and (0, 32) — so the pattern repeats over a 64x32
    rectangle holding two cells, one at its centre and one split across its
    corners. Stamping the tile at every lattice point and cropping one such
    rectangle out of the middle gives a fill that tiles in both directions and
    lands on the same lattice as the playable cells.

    It is dimmed a little so the boundary of the buildable grid stays readable
    against the countryside around it.
    """
    tile = shade(tile, SURROUND_DIM)
    pad = Image.new('RGBA', (192, 96), (0, 0, 0, 0))
    for u in range(-4, 7):
        for v in range(-5, 8):
            if (u + v) % 2:
                continue
            cx, cy = 64 + 32 * u, 32 + 16 * v
            pad.alpha_composite(tile, (cx - tile.width // 2, cy - tile.height // 2))
    return pad.crop((64, 32, 128, 64))


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
    straight_y, cx_y, cy_y = pieces['y']
    straight_x, cx_x, cy_x = pieces['x']
    cross, cx_c, cy_c = pieces['cross']
    stub, cx_s, cy_s = pieces['stub']
    bits = {1: 'y-', 2: 'x+', 4: 'y+', 8: 'x-'}
    out = {}
    for mask in range(16):
        if mask == 0:
            out[0] = (stub, cx_s, cy_s); continue
        if mask == 5:
            out[5] = (straight_y, cx_y, cy_y); continue
        if mask == 10:
            out[10] = (straight_x, cx_x, cy_x); continue
        if mask == 15:
            out[15] = (cross, cx_c, cy_c); continue
        # Composite onto the taller piece so every wedge has room.
        taller = straight_y if straight_y.height >= straight_x.height else straight_x
        canvas = Image.new('RGBA', taller.size, (0, 0, 0, 0))
        cx, cy = (cx_y, cy_y) if taller is straight_y else (cx_x, cy_x)
        for bit, direction in bits.items():
            if not mask & bit:
                continue
            src, scx, scy = ((straight_y, cx_y, cy_y) if direction in ('y-', 'y+')
                             else (straight_x, cx_x, cy_x))
            layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
            layer.alpha_composite(src, (int(round(cx - scx)), int(round(cy - scy))))
            canvas.paste(layer, (0, 0), quadrant(canvas.size, (cx, cy), direction))
        out[mask] = (canvas, cx, cy)
    return out


def prop_cells(sheet, y0, count):
    """Slice the props row, following the art rather than the tile pitch.

    The grass tiles below are evenly spaced and separated, but the cherry
    canopy reaches over the birch's tile and the boulder leans over the cherry's,
    so cutting on the tile pitch takes a slice out of one sprite and staples it
    onto its neighbour. Tile rows are therefore cut on the tile boundary and the
    rows above them on the emptiest column between the two sprites.
    """
    W, H = sheet.size
    px = sheet.load()
    low = [sum(1 for y in range(H - 34, H) if not is_backdrop(px[x, y])) for x in range(W)]
    runs, start = [], None
    for x, c in enumerate(low + [0]):
        if c > 0 and start is None:
            start = x
        elif c == 0 and start is not None:
            if x - start > 15:
                runs.append((start, x - 1))
            start = None
    if len(runs) != count:
        print(f'props: found {len(runs)} tiles, expected {count}', file=sys.stderr)
        return None

    # Where each tile's top face begins, so rows above it are canopy.
    tops = []
    for L, R in runs:
        rows = {}
        for y in range(y0, H):
            xs = [x for x in range(L, R + 1) if not is_backdrop(px[x, y])]
            if xs:
                rows[y] = (xs[0], xs[-1])
        bot = max(rows)
        waist = max((y for y in rows if y >= bot - 52), key=lambda y: rows[y][1] - rows[y][0])
        width = rows[waist][1] - rows[waist][0] + 1
        tops.append(int(waist - width / 4))

    # Between each pair, the column carrying the least art above the tiles.
    seams = []
    for i in range(len(runs) - 1):
        edge = (runs[i][1] + runs[i + 1][0]) // 2
        ceiling = min(tops[i], tops[i + 1])
        window = range(max(0, edge - 30), min(W, edge + 31))
        seams.append(min(window, key=lambda x: (
            sum(1 for y in range(y0, ceiling) if not is_backdrop(px[x, y])), abs(x - edge))))

    out = []
    for i, (L, R) in enumerate(runs):
        left = seams[i - 1] + 1 if i else max(0, L - 30)
        right = seams[i] if i < len(seams) else min(W - 1, R + 30)
        cell = Image.new('RGBA', (right - left + 1, H - y0), (0, 0, 0, 0))
        q = cell.load()
        for y in range(y0, H):
            canopy = y < tops[i]
            lo, hi = (left, right) if canopy else (L, R)
            for x in range(max(lo, left), min(hi, right) + 1):
                c = px[x, y]
                if not is_backdrop(c):
                    q[x - left, y - y0] = c + (255,)
        cell = decast(defringe(cell.crop(cell.getbbox())))
        out.append(cell.crop(cell.getbbox()))
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
    cells = prop_cells(sheet, PROP_BAND, len(PROPS))
    if cells is None:
        return 1
    for name, cell in zip(PROPS, cells):
        parts[name] = cell

    os.makedirs(a.out, exist_ok=True)
    written = 0

    def write(key, im, centre_x, centre_y, kind):
        nonlocal written
        frame(im, centre_x, centre_y, kind).save(os.path.join(a.out, f'{key}.png'))
        written += 1

    for terrain, variants in TERRAIN.items():
        for v, src in enumerate(variants):
            im, cx, cy = to_tile(parts[f'tile-{src}'])
            for f in range(2 if terrain == 'water' else 1):
                write(f'terrain-{terrain}-{v}-{f}', im, cx, cy, 'terrain')

    straights = {'y': to_tile(parts['road-a']), 'x': to_tile(parts['road-a'], mirror=True),
                 'cross': to_tile(parts['road-e']), 'stub': to_tile(parts['road-f'])}
    for mask, (im, cx, cy) in road_masks(straights).items():
        write(f'road-{mask}', im, cx, cy, 'road')

    for district, src in BUILDINGS.items():
        im, cx, cy = to_tile(parts[src])
        write(f'building-{district}', im, cx, cy, 'building')

    for v, src in enumerate(TREES):
        im, cx, cy = to_tile(parts[src])
        write(f'tree-{v}', im, cx, cy, 'tree')

    for src in DECOR:
        im, cx, cy = to_tile(parts[src])
        write(src, im, cx, cy, 'tree')

    # Ground for beyond the playable grid; a repeating fill, not a placed cell,
    # so it skips the origin padding the others get.
    ground, _, _ = to_tile(parts['tile-grass'])
    surround_tile(ground).save(os.path.join(a.out, 'terrain-surround.png'))
    written += 1

    # Scenery for that ground, dimmed to sit at the same distance as it.
    for v, src in enumerate(TREES):
        im, cx, cy = to_tile(parts[src])
        write(f'surround-tree-{v}', shade(im, SURROUND_DIM), cx, cy, 'tree')
    im, cx, cy = to_tile(parts['prop-rocks'])
    write('surround-rocks', shade(im, SURROUND_DIM), cx, cy, 'tree')

    print(f'{written} frames -> {a.out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
