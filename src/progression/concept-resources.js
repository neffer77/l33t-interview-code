(function(C){
  'use strict';
  const DEFAULT_CAP=250;
  const RESOURCE_DEFS=Object.freeze({
    materials:{id:'materials',name:'Materials',icon:'🪵',desc:'Foundational construction knowledge from arrays, strings, and basic implementation.'},
    trade:{id:'trade',name:'Trade',icon:'💱',desc:'Fast lookup and exchange knowledge from hashes, sets, heaps, and data structures.'},
    research:{id:'research',name:'Research',icon:'🔬',desc:'Discovery knowledge from trees, graphs, search, and traversal.'},
    compute:{id:'compute',name:'Compute',icon:'⚙️',desc:'Optimization knowledge from dynamic programming, greedy reasoning, and advanced algorithms.'},
    infrastructure:{id:'infrastructure',name:'Infrastructure',icon:'⚡',desc:'Architecture knowledge from systems, networking, concurrency, and system design.'},
    stability:{id:'stability',name:'Stability',icon:'🛡️',desc:'Operational knowledge from debugging, reliability, testing, security, and incident response.'}
  });
  const DISTRICT_MAP=Object.freeze({arrays:'materials',strings:'materials',two_pointers:'materials',hash:'trade',structures:'trade',heap:'trade',stack:'trade',queue:'trade',trees:'research',graphs:'research',search:'research',traversal:'research',dp:'compute',greedy:'compute',optimization:'compute',math:'compute',systems:'infrastructure',network:'infrastructure',infrastructure:'infrastructure',concurrency:'infrastructure',design:'infrastructure',reliability:'stability',debugging:'stability',testing:'stability',security:'stability',incidents:'stability'});
  const KEYWORDS=Object.freeze([
    [/reliab|debug|test|security|incident|fault|resilien|observab/i,'stability'],
    [/system design|distributed|network|concurr|database|cache|infrastructure|architecture/i,'infrastructure'],
    [/dynamic programming|\bdp\b|greedy|optimization|backtrack|memo/i,'compute'],
    [/graph|tree|bfs|dfs|topological|binary search|traversal|shortest path/i,'research'],
    [/hash|set|map|heap|priority|stack|queue|frequency/i,'trade'],
    [/array|string|sliding window|two pointer|interval|sorting|prefix/i,'materials']
  ]);
  function normalizeText(v){if(Array.isArray(v))return v.join(' ');if(v&&typeof v==='object')return Object.values(v).join(' ');return String(v||'')}
  function challengeFrom(payload){return payload?.challenge||payload?.problem||payload?.item||payload||{}}
  function conceptKey(payload){const q=challengeFrom(payload),district=String(q.district||payload?.district||'').toLowerCase().replace(/[ -]+/g,'_');if(DISTRICT_MAP[district])return DISTRICT_MAP[district];const text=[q.pattern,q.family,q.title,q.category,q.topic,q.skillIds,payload?.concept,payload?.topic,payload?.skillIds].map(normalizeText).join(' ');for(const [re,id] of KEYWORDS)if(re.test(text))return id;return'materials'}
  function difficultyMultiplier(v){const d=String(v||'easy').toLowerCase();if(/hard|expert|advanced/.test(d))return 2;if(/medium|intermediate/.test(d))return 1.5;return 1}
  function rewardFor(payload={}){const q=challengeFrom(payload),resourceId=conceptKey(payload),mult=difficultyMultiplier(q.diff||q.difficulty||payload.difficulty),base=Math.max(1,Math.round(8*mult)),first=payload.firstSolve===false||payload.repeat===true?0.65:1,amount=Math.max(1,Math.round(base*first));return{resourceId,resource:RESOURCE_DEFS[resourceId],amount,difficultyMultiplier:mult,firstSolveMultiplier:first,concept:q.pattern||q.family||q.district||payload.concept||'Foundations'}}
  function ensure(state){const r=state.learningResources||(state.learningResources={version:2,balances:{},earned:{},capacity:{},history:[]});r.version=2;r.balances=r.balances||{};r.earned=r.earned||{};r.capacity=r.capacity||{};r.history=Array.isArray(r.history)?r.history.slice(-49):[];for(const id of Object.keys(RESOURCE_DEFS)){r.capacity[id]=Math.max(DEFAULT_CAP,Number(r.capacity[id])||DEFAULT_CAP);r.balances[id]=Math.max(0,Math.min(r.capacity[id],Number(r.balances[id])||0));r.earned[id]=Math.max(r.balances[id],Number(r.earned[id])||0)}return r}
  function award(state,payload={}){const r=ensure(state),reward=rewardFor(payload),id=reward.resourceId,before=r.balances[id],granted=Math.max(0,Math.min(reward.amount,r.capacity[id]-before));r.balances[id]+=granted;r.earned[id]+=granted;const entry={id,amount:granted,requested:reward.amount,concept:reward.concept,at:Date.now()};r.history.push(entry);if(r.history.length>50)r.history.shift();C.events?.emit?.('learning:resource-earned',{...reward,amount:granted,requestedAmount:reward.amount,balance:r.balances[id],capacity:r.capacity[id],entry});return{...reward,amount:granted,requestedAmount:reward.amount,balance:r.balances[id],capacity:r.capacity[id]}}
  function balances(state){return{...ensure(state).balances}}
  function capacities(state){return{...ensure(state).capacity}}
  function normalizeCost(cost={}){const out={};for(const id of Object.keys(RESOURCE_DEFS)){const n=Math.max(0,Math.round(Number(cost[id])||0));if(n)out[id]=n}return out}
  function missing(state,cost={}){const r=ensure(state),need=normalizeCost(cost),out={};for(const [id,n] of Object.entries(need)){const short=Math.max(0,n-(r.balances[id]||0));if(short)out[id]=short}return out}
  function canSpend(state,cost={}){return Object.keys(missing(state,cost)).length===0}
  function spend(state,cost={},source='economy'){const r=ensure(state),need=normalizeCost(cost),short=missing(state,need);if(Object.keys(short).length)return{ok:false,missing:short};for(const [id,n] of Object.entries(need))r.balances[id]-=n;C.events?.emit?.('learning:resources-spent',{cost:need,source,balances:{...r.balances}});return{ok:true,cost:need,balances:{...r.balances}}}
  function refund(state,cost={},rate=1,source='refund'){const r=ensure(state),items=normalizeCost(cost),returned={};for(const [id,n] of Object.entries(items)){const amount=Math.max(0,Math.round(n*Math.max(0,Number(rate)||0))),room=r.capacity[id]-r.balances[id],grant=Math.min(amount,room);if(grant){r.balances[id]+=grant;returned[id]=grant}}C.events?.emit?.('learning:resources-refunded',{resources:returned,source,balances:{...r.balances}});return returned}
  function install(state){if(!state)return false;ensure(state);if(install._done)return true;install._done=true;for(const evt of ['challenge:solved','problem:solved','coding:solved'])C.events?.on?.(evt,payload=>{const s=C.game?.state||window.state||state;if(s)award(s,payload||{})});return true}
  C.ConceptResources={RESOURCE_DEFS,DISTRICT_MAP,DEFAULT_CAP,conceptKey,rewardFor,ensure,award,balances,capacities,normalizeCost,missing,canSpend,spend,refund,install};
})(window.Codeopolis);