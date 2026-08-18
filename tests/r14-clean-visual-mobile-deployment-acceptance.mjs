import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const camera=readFileSync('src/civilization/phaser/mobile-camera-controller.js','utf8');
const acceptance=readFileSync('src/quality/r14-player-acceptance.js','utf8');
const harness=readFileSync('scripts/r14-browser-acceptance.py','utf8');
const ionicShell=readFileSync('src/platform/ionic-shell.js','utf8');
const ionicCss=readFileSync('phase43-ionic.css','utf8');

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
assert.match(harness,/elementFromPoint/,'first-run CTA must be hit-testable, not merely present');
assert.match(harness,/R4 onboarding covers coding workspace/,'coding workspace must stay unobscured by city onboarding');

assert.match(ionicShell,/mountLiveCityRenderer/,'mobile shell must explicitly mount the live renderer');
assert.match(ionicShell,/querySelector\('#phaserCityHost'\)/,'mobile shell must move the Phaser host, not only the legacy canvas');
assert.match(ionicShell,/civilization:phaser-ready/,'mobile shell must reconcile renderer placement when Phaser boots after Ionic');
assert.match(ionicShell,/city\.appendChild\(host\)/,'Phaser host must live inside the visible mobile City surface');
assert.match(ionicShell,/activateCityRenderer/,'mobile City must explicitly wake renderer after its surface is visible');
assert.match(ionicShell,/hasGeometry\(city\).*hasGeometry\(host\)/s,'Phaser resize must be gated on nonzero visible City geometry');
assert.match(ionicShell,/if\(tab==='city'\)scheduleCityActivation\(\)/,'City activation must run after the shell switches to City');
assert.match(ionicShell,/else root\.phaserCity\?\.setActive\?\.\(false\)/,'non-City views must sleep Phaser without resizing hidden WebGL');
assert.match(ionicCss,/#phaserCityHost\{[^}]*height:100%!important/s,'mobile Phaser host must receive explicit full-height geometry');
assert.match(ionicCss,/data-view="city"[^}]*codeopolis-mobile-workspace\{display:none!important/s,'mobile City must not reserve screen space for the old dashboard workspace');

console.log('R14 clean visual/mobile/deployment acceptance regression passed');
