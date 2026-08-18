import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const camera=readFileSync('src/civilization/phaser/mobile-camera-controller.js','utf8');
const phaserBootstrap=readFileSync('src/civilization/phaser/phaser-bootstrap.js','utf8');
const phase44Runtime=readFileSync('src/civilization/phaser/phase44-runtime.js','utf8');
const coreViewport=readFileSync('phase43-core-viewport.css','utf8');
const acceptance=readFileSync('src/quality/r14-player-acceptance.js','utf8');
const harness=readFileSync('scripts/r14-browser-acceptance.py','utf8');
const ionicShell=readFileSync('src/platform/ionic-shell.js','utf8');
const ionicView=readFileSync('src/platform/ionic-view-state.js','utf8');
const ionicCss=readFileSync('phase43-ionic.css','utf8');
const worldFirst=readFileSync('src/integration/world-first-ux.js','utf8');

assert.match(camera,/fromWorld/,'mobile double-tap must invert the isometric projection');
assert.match(camera,/toWorld/,'mobile focus must use projected world coordinates');
assert.match(camera,/syncBounds/,'camera bounds must be synchronized to the isometric world');
assert.match(camera,/world:expanded/,'expanded territory must refresh mobile camera bounds');
assert.match(camera,/r14-player-acceptance\.js/,'runtime must load the R14 player acceptance auditor');
assert.match(phaserBootstrap,/mobileRenderer\?Phaser\.CANVAS:Phaser\.AUTO/,'mobile 2D city must avoid unstable WebGL framebuffer transitions');
assert.match(phaserBootstrap,/rendererBackend:mobileRenderer\?'canvas':'auto'/,'renderer backend must be observable in runtime state');
assert.match(phase44Runtime,/function wrapSwitchTab\(\)/,'Phaser lifecycle must wrap programmatic legacy tab navigation');
assert.match(phase44Runtime,/window\.switchTab=wrapped/,'desktop programmatic tab changes must flow through the lifecycle wrapper');
assert.match(phase44Runtime,/phase44-city-active/,'active City state must be exposed to the fixed-height desktop shell');
assert.match(phase44Runtime,/requestAnimationFrame\(syncLifecycle\)/,'programmatic City return must synchronize Phaser after the tab DOM updates');
assert.match(phase44Runtime,/C\.Phase44Lifecycle=/,'renderer lifecycle must be observable for QA and integration');
assert.match(coreViewport,/body\.phase44-city-active \.layout\{grid-template-columns:minmax\(0,1fr\)!important/,'desktop City must stop reserving a Mission Control column');
assert.match(coreViewport,/phase44-city-active.*\.city-stage\{[^}]*flex:1 1 auto!important[^}]*height:100%!important[^}]*overflow:hidden!important/s,'desktop City stage must own the available viewport rather than clip a tall Phaser canvas');
assert.match(coreViewport,/phase44-city-active.*\.phaser-city-host\{[^}]*height:100%!important[^}]*min-height:0!important[^}]*max-height:none!important/s,'desktop Phaser host must fit its visible City stage');
assert.match(coreViewport,/phase44-city-active.*#cityTab.*display:none!important/s,'legacy desktop City dashboard rows must not consume world space');

for(const size of ['390,height:844','844,height:390','834,height:1112','1440,height:1000','1920,height:1080'])assert.ok(acceptance.includes(size),`missing canonical viewport ${size}`);
assert.match(acceptance,/Legacy Canvas2D renderer is visible/);
assert.match(acceptance,/Document overflows viewport/);
assert.match(acceptance,/Touch target too small/);
assert.match(acceptance,/r14-first-run/);
assert.match(acceptance,/closeCompetingPanel/);
assert.match(acceptance,/cityViewportHealthy/,'city viewport acceptance must be explicit and testable');
assert.match(acceptance,/mode==='phone_landscape'.*hostRect\.width>=vp\.width\*\.9.*hostRect\.height>=vp\.height\*\.6/s,'landscape acceptance must require world-first viewport coverage instead of a brittle absolute pixel cutoff');
assert.match(acceptance,/Landscape city does not own enough of viewport/,'landscape coverage failure must be player-visible in audit diagnostics');
assert.match(acceptance,/r14-empty-land > :not\(canvas\)/,'empty-land City must suppress every non-renderer Phaser overlay');
assert.match(acceptance,/r14-build-ready > :not\(canvas\):not\(\.p1-catalog\)/,'build-ready City must keep only the renderer and Build catalog');
assert.match(acceptance,/r14-first-run-state/,'first-run state must suppress migrated legacy City chrome');

for(const shot of ['01-empty-land.png','02-coding-mission.png','03-build-ready.png','04-operating-city.png','05-interview-campaign.png','06-customization.png','07-expanded-city.png'])assert.ok(harness.includes(shot),`missing screenshot state ${shot}`);
assert.match(harness,/manual_first_build/,'browser acceptance must exercise a manual first placement');
assert.match(harness,/placedBuildings\(\)\.length===1/);
assert.match(harness,/expandCity/);
assert.match(harness,/camera bounds stale after expansion/);
assert.match(harness,/service_workers='block'/,'acceptance must not pass because of a stale service-worker cache');
assert.match(harness,/elementFromPoint/,'first-run CTA must be hit-testable, not merely present');
assert.match(harness,/R4 onboarding covers coding workspace/,'coding workspace must stay unobscured by city onboarding');
assert.match(harness,/ionicCss/,'browser failures must preserve live Ionic stylesheet diagnostics');

assert.match(ionicShell,/mountLiveCityRenderer/,'mobile shell must explicitly mount the live renderer');
assert.match(ionicShell,/querySelector\('#phaserCityHost'\)/,'mobile shell must move the Phaser host, not only the legacy canvas');
assert.match(ionicShell,/civilization:phaser-ready/,'mobile shell must reconcile renderer placement when Phaser boots after Ionic');
assert.match(ionicShell,/city\.appendChild\(host\)/,'Phaser host must live inside the visible mobile City surface');
assert.match(ionicShell,/activateCityRenderer/,'mobile City must explicitly wake renderer after its surface is visible');
assert.match(ionicShell,/hasGeometry\(city\).*hasGeometry\(host\)/s,'Phaser resize must be gated on nonzero visible City geometry');
assert.match(ionicShell,/if\(tab==='city'\)scheduleCityActivation\(\)/,'City activation must run after the shell switches to City');
assert.match(ionicShell,/else root\.phaserCity\?\.setActive\?\.\(false\)/,'non-City views must sleep Phaser without resizing hidden renderer');
assert.match(ionicView,/ensureShellStyles/,'mobile view controller must ensure the canonical shell stylesheet is present');
assert.match(ionicView,/phase43-ionic\.css/,'production runtime must load the world-first Ionic stylesheet');
assert.match(ionicView,/syncRenderer\(active\)/,'legacy tab observer must hand renderer state to the mobile shell');
assert.match(ionicView,/scheduleCityActivation/,'legacy switchTab City return must schedule visible Phaser activation');
assert.match(ionicCss,/#phaserCityHost\{[^}]*height:100%!important/s,'mobile Phaser host must receive explicit full-height geometry');
assert.match(ionicCss,/data-view="city"[^}]*codeopolis-mobile-workspace\{display:none!important/s,'mobile City must not reserve screen space for the old dashboard workspace');
assert.match(ionicCss,/data-view="city"[^}]*codeopolis-mobile-city-peek>\.section-title.*display:none!important/s,'mobile City must not spend world space on the migrated legacy title row');
assert.match(ionicCss,/data-view="city"[^}]*codeopolis-mobile-city-peek>\.city-summary.*display:none!important/s,'mobile City must not spend world space on the migrated legacy stat row');

assert.match(worldFirst,/const VERSION=2/,'P6N world-first bridge must declare the reconstructed mobile presentation contract');
assert.match(worldFirst,/codeopolis-mobile-city-peek>\.section-title.*codeopolis-mobile-city-peek>\.city-summary.*p6n-manage-city\{display:none!important/s,'legacy P6N title, stat row, and Manage City chrome must remain retired on mobile City');
assert.match(worldFirst,/#phaserCityHost\{[^}]*grid-row:1!important[^}]*height:100%!important[^}]*min-height:0!important/s,'P6N bridge must yield the full mobile City surface to Phaser');
assert.doesNotMatch(worldFirst,/min-height:52dvh!important/,'legacy P6N minimum-height split must not return');
assert.doesNotMatch(worldFirst,/grid-template-rows:auto minmax\(0,1fr\) auto!important/,'legacy P6N three-row City layout must not return');

console.log('R14 clean visual/mobile/deployment acceptance regression passed');
