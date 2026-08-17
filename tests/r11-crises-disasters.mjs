import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const emitted=[];
const challenge={id:'graph-repair',title:'Network Repair',pattern:'graph',district:'graphs'};
const C={
  events:{on(){},emit:(name,payload)=>emitted.push([name,payload])},
  AdaptiveChallengeSelector:{ranked:()=>[{challenge}],startChallenge:id=>id===challenge.id},
  LearningCityLoop:{challengeConcepts:c=>[c.pattern,c.district]},
  PopulationSimulation:{summary:()=>({population:44,jobDemand:10})},
  CitySupplyRuntime:{summary:()=>({shortage:0,disconnected:0,budget:0,running:2,rows:[1,2],budget:{net:0}})},
  WorldOriginMissions:{begin(){},completion(){}},
  game:null
};
const ctx={window:{Codeopolis:C,state:null},Date,console,setTimeout,clearTimeout};ctx.window.window=ctx.window;vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/civilization/city-crisis-system.js','utf8'),ctx);
const R=C.CityCrisisSystem;
assert.equal(Object.keys(R.DEFINITIONS).length,5);
assert.equal(R.severityFor(50),1);assert.equal(R.severityFor(70),2);assert.equal(R.severityFor(90),3);

class World{
  constructor(state){this.state=state;this.rows=[
    {x:0,y:0,id:'solar',def:{name:'Solar Array'}},
    {x:1,y:0,id:'house',def:{name:'Housing Block'}},
    {x:2,y:0,id:'transit',def:{name:'Graph Transit Hub'}},
    {x:3,y:0,id:'lab',def:{name:'DP Research Lab'}}
  ];}
  placedBuildings(){return this.rows}
  roadTiles(){return[{x:0,y:1},{x:1,y:1}]}
  infrastructureNetwork(){return{powerRatio:.35,poweredBuildings:1,buildings:this.rows.map(b=>({x:b.x,y:b.y}))}}
  operationsSummary(){return{outages:0,degraded:0,maintenance:0}}
  citySupplySummary(){return{shortage:0,disconnected:0,budget:0,running:2,rows:[1,2],budget:{net:0}}}
  infrastructureStatus(x,y){return{powerConnected:x===0,powerRatio:.35,roadConnected:true}}
  buildingOperationStatus(){return{status:'healthy'}}
  buildingSupplyStatus(){return{state:'running',hasRecipe:true,recipe:{moneyCost:1}}}
  serviceProfile(x){return{powerDemand:x!==0?5:0,powerSupply:x===0?10:0,housingCapacity:10,workerDemand:5}}
  buildingEffects(){return{population:10,energy:10,happiness:10,moneyRate:4,researchRate:3}}
  anchorFor(x,y){return{x,y}}
  buildingDef(id){return{id,name:id,district:id==='transit'?'graphs':'core'}}
  select(x,y){this.selected={x,y}}
}
const state={money:100,population:44,solved:['kept'],mastery:{graph:3},interviewReadiness:{score:71},tech:['graph_traversal']};ctx.window.state=state;const world=new World(state);
const p=R.pressure(state,world);assert.ok(p.scores.grid_cascade>=R.DEFINITIONS.grid_cascade.threshold);assert.equal(p.ranked[0].id,'grid_cascade');
let scan=R.scan(state,world,1000000);assert.equal(scan.active,null);scan=R.scan(state,world,1020000);assert.equal(scan.triggered,true);assert.equal(scan.active.type,'grid_cascade');assert.equal(scan.active.challengeId,challenge.id);assert.ok(scan.active.affected.length>0);
const beforeLearning=JSON.stringify({solved:state.solved,mastery:state.mastery,interviewReadiness:state.interviewReadiness,tech:state.tech});
assert.equal(R.install(state,world),true);const affected=scan.active.affected[0],status=world.buildingCrisisStatus(affected.x,affected.y);assert.ok(status.multiplier<1);const fx=world.buildingEffects(affected.x,affected.y);assert.ok(fx.energy<10);const started=R.startResolution(state,world);assert.equal(started.ok,true);assert.equal(started.challenge.id,challenge.id);
const wrong=R.resolve(state,world,{normalized:{challenge:{id:'other'},correct:true},progressionEligible:true});assert.equal(wrong,null);const record=R.resolve(state,world,{normalized:{challenge:{id:challenge.id},correct:true},progressionEligible:true});assert.equal(record.status,'resolved');assert.equal(R.summary(state,world).active,null);assert.equal(JSON.stringify({solved:state.solved,mastery:state.mastery,interviewReadiness:state.interviewReadiness,tech:state.tech}),beforeLearning);
assert.ok(emitted.some(([e])=>e==='city-crisis:triggered'));assert.ok(emitted.some(([e])=>e==='city-crisis:resolved'));

const svc=fs.readFileSync('src/civilization/phaser/service-visuals.js','utf8');
const adapter=fs.readFileSync('src/civilization/phaser/world-adapter.js','utf8');
const phase7=fs.readFileSync('src/progression/phase7-bootstrap.js','utf8');
const ui=fs.readFileSync('src/civilization/city-crisis-ui.js','utf8');
const visuals=fs.readFileSync('src/civilization/phaser/crisis-visuals.js','utf8');
for(const f of['city-crisis-system.js','city-crisis-ui.js','crisis-visuals.js'])assert.match(svc,new RegExp(f.replace('.','\\.')));
assert.match(adapter,/crisisSummary/);assert.match(adapter,/buildingCrisisStatus/);assert.match(phase7,/!C\.CityCrisisSystem/);assert.match(ui,/Resolve with coding/);assert.match(visuals,/city-crisis:resolved/);
console.log('R11 crises and disasters: ok');
