import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/core/namespace.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(source, { window, Map, Set, Date, Math, Number, Object, Array, console });

const C = window.Codeopolis;
const util = C.util;
const { seeded } = util;

// CitySimulation deliberately destructures seeded from C.util. The helper must
// therefore work when called without C.util as its `this` value.
const detached = seeded('city-0-0');
const attached = util.seeded('city-0-0');

for (let i = 0; i < 8; i += 1) {
  const a = detached();
  const b = attached();
  assert.equal(a, b, 'detached and attached seeded RNG calls should stay deterministic');
  assert.ok(a >= 0 && a < 1, 'seeded RNG output should remain in [0, 1)');
}

// Phaser scene and placement-controller construction can begin immediately
// after the base game bootstrap, so the R2 projection must already exist.
assert.equal(typeof C.PixelWorldProjection?.layout, 'function');
assert.equal(C.PixelWorldProjection.TILE_W, 64);
assert.equal(C.PixelWorldProjection.TILE_H, 32);
const projection = C.PixelWorldProjection.layout(12, 8);
assert.equal(projection.tileW, 64);
assert.equal(projection.tileH, 32);
assert.ok(projection.worldWidth > 0 && projection.worldHeight > 0);

console.log('Core seeded RNG and pixel projection bootstrap regression passed.');
