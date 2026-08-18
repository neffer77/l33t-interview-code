import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const camera=readFileSync('src/civilization/phaser/mobile-camera-controller.js','utf8');
const acceptance=readFileSync('src/quality/r14-player-acceptance.js','utf8');
const harness=readFileSync('scripts/r14-browser-acceptance.py','utf8');

assert.match(camera,/fromWorld/,'mobile double-tap must invert the isometric projection');
assert.match(camera,/toWorld/,'mobile focus must use projected world coordinates');
assert.match(camera,/syncBounds/,'camera bounds must be synchronized to the isometric world');
assert.match(camera,/world:expanded/,'expanded territory must refresh mobile camera bounds');
assert.match(camera,/r14-player-acceptance\.js/,'runtime must load the R14 player acceptance auditor');

for(const size of ['390,height:844','844,height:390','834,height:1112','1440,height:1000','1920,height:1080'])assert.ok(acceptance.includes(size),`missing canonical viewport ${size}`);
assert.match(acceptance,/Legacy Canvas2D renderer is visible/);
assert.match(acceptance,/Document overflows viewport/);
assert.match(acceptance,/Touch target too small/);
assert.match(acceptance,/r14-first-run/);
assert.match(acceptance,/closeCompetingPanel/);

for(const shot of ['01-empty-land.png','02-coding-mission.png','03-build-ready.png','04-operating-city.png','05-interview-campaign.png','06-customization.png','07-expanded-city.png'])assert.ok(harness.includes(shot),`missing screenshot state ${shot}`);
assert.match(harness,/manual_first_build/,'browser acceptance must exercise a manual first placement');
assert.match(harness,/placedBuildings\(\)\.length===1/);
assert.match(harness,/expandCity/);
assert.match(harness,/camera bounds stale after expansion/);
assert.match(harness,/service_workers='block'/,'acceptance must not pass because of a stale service-worker cache');

console.log('R14 clean visual/mobile/deployment acceptance regression passed');
