import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root=process.cwd();
const failures=[];
const ok=(cond,msg)=>{if(!cond)failures.push(msg)};
const Codeopolis={
  util:{key:(x,y)=>`${x},${y}`,clamp:(v,min,max)=>Math.min(max,Math.max(min,v))},
  events:{emit(){}},
  registry:new Map(),
  register(name,value){this.registry.set(name,value)},
  get(name){return this.registry.get(name)}
};
const context=vm.createContext({window:{Codeopolis},Codeopolis,console,Date,Math,Number,Object,Array,Map,Set,JSON});
const run=p=>vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),context,{filename:p});
run('src/game/world.js');
run('src/civilization/phaser/world-adapter.js');
run('src/civilization/building-registry.js');
run('src/civilization/placement-model.js');
Codeopolis.get('PlacementModel').install();
const WorldSystem=Codeopolis.get('WorldSystem');
const Adapter=Codeopolis.get('CivilizationWorldAdapter');

const legacy={buildings:['camp','mystery-building'],world:{version:1,width:4,height:3,migrated:true,tiles:{'1,1':{buildingId:'camp',road:true,placedAt:'bad',constructionMs:-3},'2,1':{road:true},'9,9':{road:true},'oops':{road:true}},camera:{zoom:99,panX:'7',panY:null},selected:{x:99,y:99},stats:{}}};
const world=new WorldSystem(legacy);
ok(world.world.version===3,'world schema should migrate to v3');
ok(!world.world.tiles['9,9']&&!world.world.tiles.oops,'invalid/out-of-bounds tiles should be removed');
ok(world.world.tiles['1,1'].road===false,'building/road conflicts should resolve in favor of building');
ok(world.world.tiles['1,1'].constructionMs===0,'invalid construction duration should normalize');
ok(world.world.camera.zoom===2.5,'camera zoom should clamp');
ok(world.world.selected===null,'out-of-bounds selection should be cleared');

const adapter=new Adapter(world,legacy);
const snapA=adapter.snapshot();
const snapB=adapter.snapshot();
ok(JSON.stringify(snapA.terrain)===JSON.stringify(snapB.terrain),'terrain must be deterministic for the same seed/world');
ok(snapA.buildings.some(b=>b.id==='camp'),'existing building should survive adapter snapshot');
ok(snapA.roads.every(r=>Number.isInteger(r.mask)&&r.mask>=0&&r.mask<=15),'roads must expose valid 4-neighbor masks');
ok(snapA.terrain[1][1]==='grass','occupied building tiles should be buildable ground');

const state2={buildings:['camp'],world:JSON.parse(JSON.stringify(world.world))};
const roundTrip=new WorldSystem(state2);
ok(JSON.stringify(Object.keys(roundTrip.world.tiles).sort())===JSON.stringify(Object.keys(world.world.tiles).sort()),'save/load round trip should preserve occupied tile keys');
ok(roundTrip.world.version===3,'round-trip world should stay on current schema');

const before=world.world.tiles['2,1'].road;
const block=world.setRoad(1,1,true);
ok(block.ok===false,'road placement must reject occupied building tiles');
ok(world.world.tiles['2,1'].road===before,'unrelated road state should remain stable');

const placementState={buildings:['network-transit'],world:{version:3,width:5,height:5,migrated:true,tiles:{},camera:{zoom:1,panX:0,panY:0},stats:{}}};
const placementWorld=new WorldSystem(placementState);
const verdict=placementWorld.canPlaceBuilding('network-transit',1,1);
ok(verdict.ok&&verdict.footprint.w===2&&verdict.footprint.h===2,'advanced building should expose a 2x2 footprint');
const placed=placementWorld.placeBuilding('network-transit',1,1,{construction:false});
ok(placed.ok,'2x2 building should place on clear terrain');
ok(placementWorld.tile(2,1)?.occupiedBy==='1,1'&&placementWorld.tile(1,2)?.occupiedBy==='1,1'&&placementWorld.tile(2,2)?.occupiedBy==='1,1','footprint child tiles should point to their anchor');
ok(placementWorld.setRoad(2,2,true).ok===false,'roads must reject footprint child tiles');
ok(placementWorld.canPlaceBuilding('network-transit',3,4).ok===false,'footprint placement should reject map-edge overflow');
const moved=placementWorld.unplaceBuilding(2,2);
ok(moved.ok&&moved.id==='network-transit','unplacing from a footprint child should resolve the anchor building');
ok(!placementWorld.tile(1,1)&&!placementWorld.tile(2,2),'unplacing should clear the full building footprint');

if(failures.length){console.error('\nCIVILIZATION FOUNDATION TESTS FAILED');for(const f of failures)console.error(' - '+f);process.exit(1)}
console.log(`Civilization foundation passed: schema v${world.world.version}, ${snapA.buildings.length} buildings, ${snapA.roads.length} roads, deterministic ${snapA.width}x${snapA.height} terrain, footprint placement verified.`);
