import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/core/namespace.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(source, { window, Map, Set, Date, Math, console });

const util = window.Codeopolis.util;
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

console.log('Core seeded RNG regression passed.');
