import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
/* The solve -> city payoff: what one solve did to the city is collected for the reward
   card, the mentor's reaction is folded into that card instead of a second popup, and the
   moment waits for the city to be on screen. Rendering needs Phaser; the bookkeeping does not. */
const ctx={window:{},console,setTimeout:()=>0,clearTimeout(){},setInterval:()=>1,clearInterval(){},Date,Math,JSON,document:{getElementById:id=>id==='rewardOverlay'?{}:null,visibilityState:'visible',querySelector:()=>null}};
ctx.window.window=ctx.window;vm.createContext(ctx);const run=f=>vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
run('src/core/namespace.js');const C=ctx.window.Codeopolis;run('src/progression/concept-resources.js');run('src/integration/city-payoff.js');
const P=C.CityPayoff,emit=(n,p)=>C.events.emit(n,p);
C.game={phase8:{characters:{def:id=>id==='marcus'?{name:'Marcus Reed',role:'Engineering Manager',icon:'🎙️'}:null}}};
C.LearningCityLoop={contract:()=>({next:{text:'Earn 10 more Materials (20 total)'}})};
const challenge={id:'two-sum',title:'Two Sum',pattern:'Hash Map',district:'hash'};
emit('learning:mastered',{challenge,first:true,x:8,y:2});
const beat={kind:'reaction',title:'Marcus Reed reacts',text:'Two Sum is now part of your toolkit.',characterId:'marcus',meta:{challengeId:'two-sum'}};emit('story:beat',beat);
emit('coding:rewarded',{resourceId:'trade',granted:11});
emit('city-growth:applied',{ok:true,kind:'upgrade',id:'market',name:'Hash Market',x:8,y:2,level:2});
emit('world:construction-boost-earned',{ms:5000});
const rows=P.summary();
assert.deepEqual([...rows.map(r=>r.key)],['resource','growth','boost','goal'],'the card lists what the solve did to the city, in order');
assert.equal(rows[0].text,'+11 Trade');assert.equal(rows[1].text,'Hash Market → Level 2');assert.equal(rows[2].text,'+5s build boost');
assert.equal(beat.inRewardCard,true,'the mentor reaction is claimed by the reward card, not a second popup');
assert.equal(P.mentor().name,'Marcus Reed');assert.equal(P.mentor().text,'Two Sum is now part of your toolkit.');
assert.equal(P.worthShowing(),true);assert.equal(P.pending().length,1,'the moment waits for the city to be on screen');
const other={kind:'reaction',title:'Ada reacts',text:'x',meta:{challengeId:'something-else'}};emit('story:beat',other);
assert.notEqual(other.inRewardCard,true,'a reaction to a different challenge keeps its own popup');
emit('learning:mastered',{challenge:{id:'review',title:'Review'},first:false});
assert.equal(P.worthShowing(),false,'a solve that changed nothing in the city does not send the player there');
assert.deepEqual([...P.summary().map(r=>r.key)],['goal']);
emit('world:construction-complete',{id:'house',x:6,y:3});emit('world:construction-complete',{id:'house',x:6,y:3});
assert.equal(P.pending().filter(m=>m.type==='complete').length,1,'one completion is queued once');
for(let i=0;i<6;i++)emit('learning:mastered',{challenge:{id:'c'+i,title:'C'+i},first:true});
assert.ok(P.pending().length<=4,'the queue is bounded');
console.log('City payoff bookkeeping: ok');
