import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const C={CurriculumDistricts:{DISTRICTS:{graphs:{name:'Graphs',icon:'🕸️'}},summary:()=>({graphs:{name:'Graphs',maturity:{level:4}},arrays:{name:'Arrays',maturity:{level:2}}})}};const ctx={window:{Codeopolis:C}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/progression/district-age-evolution.js','utf8'),ctx);const D=C.DistrictAgeEvolution;
assert.equal(D.profile(1).id,'outpost');assert.equal(D.profile(3).id,'campus');assert.equal(D.profile(5).id,'landmark');assert.equal(D.clampLevel(99),5);assert.equal(D.clampLevel(0),1);
const snap=D.snapshot({},{});assert.equal(snap.version,1);assert.equal(snap.districts.graphs.level,4);assert.equal(snap.districts.graphs.stage.id,'institute');assert.equal(snap.districts.arrays.stage.id,'workshop');assert.notEqual(snap.districts.graphs.stage.scale,snap.districts.arrays.stage.scale);
console.log('P4-D district age evolution: ok');
