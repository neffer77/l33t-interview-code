import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const events={on(){},emit(){}};const C={events,phaserCity:null};const ctx={window:{Codeopolis:C},setTimeout:()=>0,clearTimeout(){}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/civilization/phaser/living-city-citizens.js','utf8'),ctx);const L=C.LivingCityCitizens;
const snapshot={roads:[{x:1,y:1},{x:2,y:1},{x:3,y:1},{x:3,y:2},{x:3,y:3}],buildings:[{id:'a',name:'A',x:0,y:1,progress:1},{id:'b',name:'B',x:4,y:3,progress:1},{id:'c',name:'C',x:6,y:6,progress:.5}]};
assert.equal(L.destinations(snapshot).length,2,'only completed buildings are citizen destinations');
const path=L.route(snapshot,{x:0,y:1},{x:4,y:3});assert.equal(path[0].x,0);assert.equal(path.at(-1).x,4);assert.ok(path.some(p=>p.x===3&&p.y===2),'route should follow connected roads');
assert.ok(L.populationFor(snapshot)>0&&L.populationFor(snapshot)<=L.MAX_CITIZENS,'population is bounded');
const planned=L.plan(snapshot,0);assert.equal(planned.from.id,'a');assert.equal(planned.to.id,'b');assert.ok(planned.path.length>=4);
const disconnected={roads:[{x:1,y:1},{x:8,y:8}],buildings:snapshot.buildings};const fallback=L.route(disconnected,{x:0,y:1},{x:9,y:8});assert.ok(fallback.length>=2,'disconnected roads still produce safe fallback route');
console.log('P5-A living city citizens and NPC pathing: ok');
