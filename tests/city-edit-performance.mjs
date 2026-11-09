import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
/* City edits used to rebuild the renderer snapshot (~150 ms) several times per
   edit and four times a second at rest, and rebuild the whole scene once per
   listener. This pins the three mechanisms that stopped that: the event-bus
   revision, the adapter's snapshot cache, the merged scene rebuild, and the
   cached challenge ranking. */
const root=process.cwd(),failures=[],ok=(v,m)=>{if(!v)failures.push(m)};
let timers=[];const setTimeout=(fn,ms=0)=>{const t={fn,ms,id:timers.length+1};timers.push(t);return t.id},clearTimeout=id=>{timers=timers.filter(t=>t.id!==id)},flush=()=>{const run=timers;timers=[];for(const t of run)t.fn()};
const window={};const context=vm.createContext({window,console,Date,Math,Number,Object,Array,Map,Set,JSON,String,Promise,setTimeout,clearTimeout,BUILDINGS:[{id:'house',name:'Housing Block',icon:'🏠',cost:180,district:'core',population:25}],Phaser:{Scene:class{constructor(cfg){this.cfg=cfg}}}});
const run=p=>vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),context,{filename:p});
run('src/core/namespace.js');const C=window.Codeopolis;

// The revision moves on every event except the ones registered as quiet.
const r0=C.events.revision;C.events.emit('test:changed',{});ok(C.events.revision===r0+1,'an event should move the revision');
C.events.quiet('test:tick');C.events.emit('test:tick',{});ok(C.events.revision===r0+1,'a quiet event should leave the revision alone');
let seen=null;C.events.on('test:read',()=>{seen=C.events.revision});C.events.emit('test:read');ok(seen===r0+2,'listeners should see the revision already moved');
run('src/game/simulation.js');C.events.emit('world:tick',{dt:.016});ok(C.events.revision===r0+2,'the frame tick should be quiet');

run('src/game/world.js');run('src/civilization/building-registry.js');run('src/civilization/placement-model.js');C.get('PlacementModel').install();
run('src/civilization/construction-system.js');C.get('ConstructionSystem').install();run('src/civilization/phaser/world-adapter.js');
const World=C.get('WorldSystem'),Adapter=C.get('CivilizationWorldAdapter');
const state={money:5000,population:100,energy:100,buildings:['house'],world:{version:3,width:8,height:6,migrated:true,tiles:{},camera:{zoom:1,panX:0,panY:0},stats:{}}};
const world=new World(state),adapter=new Adapter(world,state);let builds=0;const build=adapter.build.bind(adapter);adapter.build=now=>{builds++;return build(now)};

// Reused while nothing changes; rebuilt by an edit, and the edit is in it.
const t0=Date.now();const a=adapter.snapshot(t0),b=adapter.snapshot(t0+100);
ok(builds===1&&a===b,'a second snapshot with no change in between should reuse the first');
world.setRoad(2,2,true);const c=adapter.snapshot(t0+150);
ok(builds===2,'a road edit should rebuild the snapshot');ok(c.roads.some(r=>r.x===2&&r.y===2),'the rebuilt snapshot should show the new road');
adapter.snapshot(t0+150+2100);ok(builds===3,'a snapshot older than its time limit should be rebuilt even with no event');
adapter.snapshot(t0-1000);ok(builds===4,'a snapshot asked for at an earlier time should be rebuilt');

// What moves with the clock is read fresh from a reused snapshot.
const placed=world.placeBuilding('house',4,3);ok(placed.ok,'a building should place for the construction check');
const job=world.constructionJobAt(4,3),start=Number(job?.startedAt)||Date.now();job.durationMs=1800;
const s1=adapter.snapshot(start+10),n=builds,p1=s1.buildings.find(x=>x.id==='house')?.progress;
world.world.dayPhase=.42;world.world.camera.zoom=1.7;
const s2=adapter.snapshot(start+Math.floor(job.durationMs/2)),p2=s2.buildings.find(x=>x.id==='house')?.progress;
ok(builds===n,'reading construction progress should not rebuild the snapshot');
ok(p1<.05&&p2>.45&&p2<.55,`construction progress should follow the clock on a reused snapshot (${p1} -> ${p2})`);
ok(s2.dayPhase===.42&&s2.camera.zoom===1.7,'time of day and camera should be current on a reused snapshot');
ok(s2.constructionSummary?.active?.length===1,'construction summary should be current on a reused snapshot');

// A bus without a revision (tests and old embeds) never reuses a snapshot.
const plain={...C,events:{on(){},emit(){}}};let plainBuilds=0;
const ctx2=vm.createContext({window:{Codeopolis:plain},console,Date,Math,Number,Object,Array,Map,Set,JSON,String});
vm.runInContext(fs.readFileSync(path.join(root,'src/civilization/phaser/world-adapter.js'),'utf8'),ctx2);
const PlainAdapter=plain.modules.CivilizationWorldAdapter,pa=new PlainAdapter(world,state),pbuild=pa.build.bind(pa);pa.build=now=>{plainBuilds++;return pbuild(now)};
pa.snapshot();pa.snapshot();ok(plainBuilds===2,'without a revision every snapshot should be built fresh');

// Scene rebuilds asked for during one edit merge into one, after the edit.
run('src/civilization/phaser/city-scene.js');const Scene=C.PhaserCityScene;
const scene=Object.create(Scene.prototype);let refreshes=0;/* runRefresh and requestRefresh are the scene's own; refresh is stubbed. */scene.sys={displayList:{}};scene.adapter=adapter;scene.refresh=function(){refreshes++;this.refreshStale=false};
C.phaserCity={active:true,game:{scene:{getScene:()=>scene}}};
scene.requestRefresh();scene.requestRefresh();C.requestCityRefresh();C.requestCityRefresh();
ok(refreshes===0,'a requested rebuild should wait for the current task to finish');flush();
ok(refreshes===1,`four requests in one task should rebuild the scene once (got ${refreshes})`);
scene.requestRefresh();flush();ok(refreshes===2,'a request after the rebuild should rebuild again');
C.phaserCity.active=false;scene.requestRefresh();flush();
ok(refreshes===2&&scene.refreshStale===true,'while the city is off screen a request should only mark it stale');
C.phaserCity.active=true;scene.requestRefresh();C.phaserCity.active=false;flush();
ok(refreshes===2&&scene.refreshStale===true,'a request still pending when the city leaves the screen should wait for it to return');
C.phaserCity.active=true;const drawn=[];scene.requestRefresh(()=>drawn.push(refreshes));scene.requestRefresh(()=>drawn.push(refreshes));flush();
ok(refreshes===3&&drawn.join()==='3,3','work drawn on top of the map should run once, after the merged rebuild');
C.phaserCity.active=false;scene.requestRefresh(()=>drawn.push('late'));flush();ok(drawn.length===2,'work for an off-screen city should wait');
scene.runRefresh();ok(drawn[2]==='late','work queued off screen should run with the rebuild when the city returns');

// Every listener that rebuilt the scene on a game event now asks instead.
for(const f of['src/civilization/phaser/supply-chain-visuals.js','src/civilization/phaser/operation-visuals.js','src/civilization/phaser/district-zoning-visuals.js','src/civilization/phaser/age-city-transformation.js','src/civilization/phaser/interview-campaign-visuals.js','src/civilization/phaser/crisis-visuals.js','src/civilization/district-zoning.js']){
  const src=fs.readFileSync(path.join(root,f),'utf8');ok(/C\.events\?\.on\?\.\([^;]*requestCityRefresh/.test(src),`${f} should request a merged rebuild from its event listener`);
  ok(!/C\.events\?\.on\?\.\((?:evt|e|'[^']+'),\(\)=>(?:setTimeout\(\(\)=>)?C\.phaserCity\?\.game\?\.scene\?\.getScene\?\.\('CodeopolisCity'\)\?\.refresh\?\.\(\)/.test(src),`${f} should not rebuild the scene directly from an event listener`)}
const sceneSrc=fs.readFileSync(path.join(root,'src/civilization/phaser/city-scene.js'),'utf8');
ok(/C\.events\.on\(evt,\(\)=>this\.requestRefresh\(\)\)/.test(sceneSrc),'the scene should merge its own world-event rebuilds');
const boot=fs.readFileSync(path.join(root,'src/civilization/phaser/phaser-bootstrap.js'),'utf8');
ok(/if\(scene\.refreshStale\)scene\.runRefresh\(\)/.test(boot),'returning to the city should rebuild a scene that went stale off screen');

// The full challenge ranking is computed once per game change.
const ctx3={window:{Codeopolis:C,CHALLENGES:[{id:'a',difficulty:'easy',pattern:'array'},{id:'b',difficulty:'medium',pattern:'graph'},{id:'c',difficulty:'hard',pattern:'dp'}]},console,Date,Math,Number,Object,Array,Map,Set,JSON,String,document:undefined};
vm.createContext(ctx3);vm.runInContext(fs.readFileSync(path.join(root,'src/progression/adaptive-challenge-selector.js'),'utf8'),ctx3);
const Sel=C.AdaptiveChallengeSelector;
const rk0=Sel.ranked(state,world);ok(rk0.length===3,'ranking should score every challenge');
ctx3.window.CHALLENGES.push({id:'d',difficulty:'easy',pattern:'tree'});
ok(Sel.ranked(state,world).length===3,'a ranking asked for again with no change should be reused');
const rk1=Sel.ranked(state,world);rk1.reverse();ok(Sel.ranked(state,world)[0].challenge.id===rk0[0].challenge.id,'reordering a returned ranking should not change the kept one');
C.events.emit('mastery:updated',{});ok(Sel.ranked(state,world).length===4,'a game event should recompute the ranking');
ok(Sel.ranked(state,world,{exclude:['a']}).every(r=>r.challenge.id!=='a'),'a ranking with options should be computed for those options');

if(failures.length){console.error('City edit performance failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('City edit performance: ok (event revision, cached snapshot with live construction, merged scene rebuilds, cached ranking)');
