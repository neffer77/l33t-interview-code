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
const BUILDINGS=[
  {id:'house',name:'Housing Block',icon:'🏠',cost:180,district:'core',population:25,desc:'+25 population'},
  {id:'transit',name:'Graph Transit Hub',icon:'🚇',cost:650,district:'graphs',population:20,happiness:4,requiresTech:'graphs',desc:'+20 population'}
];
const context=vm.createContext({window:{Codeopolis},Codeopolis,BUILDINGS,console,Date,Math,Number,Object,Array,Map,Set,JSON});
const run=p=>vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),context,{filename:p});
run('src/game/world.js');
run('src/civilization/phaser/world-adapter.js');
run('src/civilization/building-registry.js');
run('src/civilization/placement-model.js');
Codeopolis.get('PlacementModel').install();
run('src/civilization/building-management.js');
Codeopolis.get('BuildingManagement').install();
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
ok(world.buildingLevel(1,1)===1,'legacy buildings should normalize to level 1');

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

const catalogState={money:3000,tech:['graphs'],eraLevel:2,buildings:['transit'],world:{version:3,width:5,height:5,migrated:true,tiles:{},camera:{zoom:1,panX:0,panY:0},stats:{}}};
const placementWorld=new WorldSystem(catalogState);
const catalog=Codeopolis.BuildingRegistry.catalog(placementWorld,catalogState);
const transitCard=catalog.find(x=>x.def.id==='transit');
ok(transitCard&&transitCard.def.cost===650,'catalog should expose building cost metadata');
ok(transitCard.def.footprint.w===2&&transitCard.def.footprint.h===2,'advanced catalog building should show a 2x2 footprint');
ok(transitCard.owned===1&&transitCard.canPlace,'catalog should identify owned unplaced buildings');

const placed=placementWorld.placeBuilding('transit',1,1,{construction:false});
ok(placed.ok,'2x2 building should place on clear terrain');
ok(placementWorld.tile(2,1)?.occupiedBy==='1,1'&&placementWorld.tile(2,2)?.occupiedBy==='1,1','footprint child tiles should point to their anchor');
ok(placementWorld.setRoad(2,2,true).ok===false,'roads must reject footprint child tiles');
const initialEffects=placementWorld.buildingEffects(1,1);
ok(initialEffects.level===1&&initialEffects.population===20,'level 1 effects should equal base building effects');
const upgrade1=placementWorld.upgradeBuilding(2,2,catalogState);
ok(upgrade1.ok&&upgrade1.level===2,'upgrade should resolve child tile to anchor and reach level 2');
ok(placementWorld.buildingEffects(1,1).population===30,'level 2 should scale base effects by 50 percent');
const moneyAfterFirst=catalogState.money;
const upgrade2=placementWorld.upgradeBuilding(1,1,catalogState);
ok(upgrade2.ok&&upgrade2.level===3,'second upgrade should reach max level');
ok(catalogState.money<moneyAfterFirst,'upgrades should spend money');
ok(placementWorld.upgradeCost(1,1)===null,'max-level building should have no upgrade cost');
ok(placementWorld.upgradeBuilding(1,1,catalogState).ok===false,'max-level building should reject further upgrades');
const placementSnap=new Adapter(placementWorld,catalogState).snapshot();
const transitRendered=placementSnap.buildings.find(b=>b.id==='transit');
ok(transitRendered?.footprint?.w===2&&transitRendered?.level===3,'renderer snapshot should preserve footprint and upgrade tier');
ok(transitRendered?.effects?.population===40,'renderer snapshot should expose scaled effects');
ok(placementSnap.terrain[2][2]==='grass','footprint child terrain should render as buildable ground');

const demo=placementWorld.demolishBuilding(2,2);
ok(demo.ok&&demo.refund>0,'demolishing an upgraded building should return a partial refund');
ok(!placementWorld.tile(1,1)&&!placementWorld.tile(2,2),'demolition should clear the full footprint');
ok(!catalogState.buildings.includes('transit'),'demolition should remove one owned building instance');

const lockedState={money:1000,tech:[],eraLevel:1,buildings:[],world:{version:3,width:4,height:4,migrated:true,tiles:{},camera:{},stats:{}}};
const lockedWorld=new WorldSystem(lockedState),lockedTransit=Codeopolis.BuildingRegistry.status(lockedWorld,lockedState,'transit');
ok(Boolean(lockedTransit.locked),'catalog should expose prerequisite lock reasons');

if(failures.length){console.error('\nCIVILIZATION FOUNDATION TESTS FAILED');for(const f of failures)console.error(' - '+f);process.exit(1)}
console.log(`Civilization foundation passed: deterministic terrain, catalog, footprints, P1-C upgrades, management, refunds, and renderer tier metadata verified.`);
