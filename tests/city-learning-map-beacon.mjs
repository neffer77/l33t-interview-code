import fs from 'node:fs';
import vm from 'node:vm';
const fail=[]; const ok=(v,m)=>{if(!v)fail.push(m)};
const C={events:{on(){},emit(){}},phaserCity:null};
const context=vm.createContext({window:{Codeopolis:C},Codeopolis:C,console,Math,Number,Object,Array,Set,String});
vm.runInContext(fs.readFileSync('src/progression/city-learning-map-beacon.js','utf8'),context);
const B=C.CityLearningMapBeacon;
const snapshot={width:8,height:8,terrain:Array.from({length:8},()=>Array(8).fill('grass')),roads:[{x:4,y:4}],buildings:[{id:'camp',x:3,y:3,footprint:{w:1,h:1}}]};
const def={id:'graph_lab',name:'Graph Lab',district:'graphs',footprint:{w:2,h:2}};
const site=B.suggestedSite(snapshot,def);
ok(B.validSite(snapshot,site.x,site.y,def.footprint),'suggested future learning site must be placeable against snapshot occupancy');
ok(!(site.x===4&&site.y===4),'suggested site must avoid roads');
const future=B.locationFor({buildingId:'graph_lab',building:def},snapshot);
ok(future.placed===false,'locked unbuilt learning goal should resolve to a future blueprint site');
const placedSnap={...snapshot,buildings:[...snapshot.buildings,{id:'graph_lab',x:6,y:1,footprint:{w:2,h:2}}]};
const placed=B.locationFor({buildingId:'graph_lab',building:def},placedSnap);
ok(placed.placed===true&&placed.x===6&&placed.y===1,'existing target building should resolve to its actual map location');
if(fail.length){console.error('CITY LEARNING MAP BEACON FAILED');for(const f of fail)console.error(' - '+f);process.exit(1)}
console.log('City learning map beacon passed: goals resolve to real buildings or valid future blueprint sites.');
