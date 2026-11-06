import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
/* The art cut from the generated sheets (tools/import-sheets.py) carries a contract the
   renderer relies on: a drawing per building per level, 2x2 art two tiles wide, every
   walk frame of a person on one canvas, and an icon file for every icon the page asks
   for. A re-import that breaks any of it would show up as missing art or a jittering walk. */
const frames=JSON.parse(fs.readFileSync('assets/city.json','utf8')).frames;
const size=k=>frames[k]?.sourceSize;
for(const id of ['house','market','foundry','observatory','park','solar','tower','academy'])
  for(const l of [1,2,3]){const s=size(`bld-${id}-${l}`);assert.ok(s,`bld-${id}-${l} is in the atlas`);assert.ok(s.w>=64,`bld-${id}-${l} spans its tile (${s.w}px)`)}
for(const id of ['transit','lab'])
  for(const l of [1,2,3]){const s=size(`bld-${id}-${l}`);assert.ok(s,`bld-${id}-${l} is in the atlas`);assert.ok(s.w>=128,`bld-${id}-${l} spans its 2x2 plot (${s.w}px)`)}
for(const st of ['foundation','frame','scaffold','shell'])assert.ok(size(`build2-${st}`)?.w>=128,`build2-${st} is a 2x2 construction stage`);
for(const role of ['builder','scholar','merchant','gardener','keeper','messenger']){
  const sizes=new Set();for(const v of ['f','b'])for(let n=0;n<6;n++){const s=size(`cit-${role}-${v}${n}`);assert.ok(s,`cit-${role}-${v}${n} is in the atlas`);sizes.add(`${s.w}x${s.h}`)}
  assert.equal(sizes.size,1,`every ${role} frame shares one canvas, so the walk does not jitter`)}
const ctx={window:{Codeopolis:{}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/platform/ui-icons.js','utf8'),ctx);
for(const name of ctx.window.Codeopolis.UIIcons.NAMES)assert.ok(fs.existsSync(`assets/ui/icons/${name}.png`),`icon ${name} exists`);
assert.match(fs.readFileSync('src/civilization/phaser/building-tier-visuals.js','utf8'),/BASE_PAD=4/,'renderer and importer agree on the base anchor');
assert.match(fs.readFileSync('tools/import-sheets.py','utf8'),/BASE_PAD = 4/,'importer and renderer agree on the base anchor');
console.log('Sprite art contract: ok');
