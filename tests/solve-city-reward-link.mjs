import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
/* A judged pass must reach the city economy. The reward engine announced mastery, but the
   city pipeline listens for challenge:solved, which nothing emitted: solving paid credits and
   never granted a concept resource, banked a construction boost or advanced a contract. */
const ctx={window:{},console,setTimeout:()=>0,clearTimeout(){},Date,Math,JSON};ctx.window.window=ctx.window;vm.createContext(ctx);
const run=f=>vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
run('src/core/namespace.js');const C=ctx.window.Codeopolis;
for(const f of['src/progression/concept-resources.js','src/progression/coding-reward-pipeline.js','src/game/reward-engine.js'])run(f);
const seen=[];const emit=C.events.emit.bind(C.events);C.events.emit=(n,p)=>{seen.push({n,p});return emit(n,p)};
const state={solved:[],history:[],mastery:{},money:0,research:0,xp:0,districtXP:{},hints:0,streak:0,level:1};
C.ConceptResources.install(state);C.CodingRewardPipeline.install(state);
const world={districtTile:()=>({x:3,y:4})},engine=new(C.get('RewardEngine'))(state,world,null);
const challenge={id:'two-sum',title:'Two Sum',pattern:'Hash Map',district:'hash',diff:'Easy'};
function solve({hints=0,fails=0}={}){const before=engine.snapshot(challenge);
  state.hintsByChallenge={...(state.hintsByChallenge||{}),[challenge.id]:(state.hintsByChallenge?.[challenge.id]||0)+hints};
  const m=state.mastery[challenge.id]||{attempts:0,passes:0};m.attempts+=fails+1;m.passes++;state.mastery[challenge.id]=m;
  if(!state.solved.includes(challenge.id))state.solved.push(challenge.id);state.money+=10;state.streak++;
  state.history.unshift({id:challenge.id,passed:true});return engine.resolve(before,challenge)}
solve({hints:2,fails:1});
const solved=seen.find(e=>e.n==='challenge:solved');
assert.ok(solved,'a judged pass emits challenge:solved for the city economy');
assert.equal(solved.p.challenge.id,'two-sum');assert.equal(solved.p.correct,true);assert.equal(solved.p.firstSolve,true);
assert.equal(solved.p.hintsUsed,2,'hints taken on this challenge count against its reward');assert.equal(solved.p.attempts,2,'failed submissions before the pass count as attempts');
const rewarded=seen.find(e=>e.n==='coding:rewarded');assert.ok(rewarded,'the reward pipeline runs on a real solve');
assert.ok(rewarded.p.granted>0,'a first solve grants concept resources');
assert.ok(Object.values(state.learningResources.balances).some(v=>v>0),'the grant lands in the city resource balances');
assert.equal(state.codingRewards.solves,1);
seen.length=0;solve();const again=seen.find(e=>e.n==='challenge:solved');
assert.equal(again.p.firstSolve,false,'a re-solve is reported as a review');assert.equal(again.p.hintsUsed,0,'old hints are not charged twice');assert.equal(again.p.attempts,1);
console.log('Solve to city reward link: ok');
