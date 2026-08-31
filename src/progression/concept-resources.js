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
  const KEYWORDS=Object.freeze([[/reliab|debug|test|security|incident|fault|resilien|observab/i,'stability'],[/system design|distributed|network|concurr|database|cache|infrastructure|architecture/i,'infrastructure'],[/dynamic programming|\bdp\b|greedy|optimization|backtrack|memo/i,'compute'],[/graph|tree|bfs|dfs|topological|binary search|traversal|shortest path/i,'research'],[/hash|set|map|heap|priority|stack|queue|frequency/i,'trade'],[/array|string|sliding window|two pointer|interval|sorting|prefix/i,'materials']]);
  function normalizeText(v){if(Array.isArray(v))return v.join(' ');if(v&&typeof v==='object')return Object.values(v).join(' ');return String(v||'')}
  function challengeFrom(payload){return payload?.challenge||payload?.problem||payload?.item||payload||{}}
  function conceptKey(payload){const q=challengeFrom(payload),district=String(q.district||payload?.district||'').toLowerCase().replace(/[ -]+/g,'_');if(DISTRICT_MAP[district])return DISTRICT_MAP[district];const text=[q.pattern,q.family,q.title,q.category,q.topic,q.skillIds,payload?.concept,payload?.topic,payload?.skillIds].map(normalizeText).join(' ');for(const [re,id] of KEYWORDS)if(re.test(text))return id;return'materials'}
  function difficultyMultiplier(v){const d=String(v||'easy').toLowerCase();if(/hard|expert|advanced/.test(d))return 2;if(/medium|intermediate/.test(d))return 1.5;return 1}
  function rewardFor(payload={}){const q=challengeFrom(payload),resourceId=conceptKey(payload),mult=difficultyMultiplier(q.diff||q.difficulty||payload.difficulty),base=Math.max(1,Math.round(8*mult)),first=payload.firstSolve===false||payload.repeat===true?0.65:1,amount=Math.max(1,Math.round(base*first));return{resourceId,resource:RESOURCE_DEFS[resourceId],amount,difficultyMultiplier:mult,firstSolveMultiplier:first,concept:q.pattern||q.family||q.district||payload.concept||'Foundations'}}
  function ensure(state){const r=state.learningResources||(state.learningResources={version:2,balances:{},earned:{},capacity:{},history:[]});r.version=2;r.balances=r.balances||{};r.earned=r.earned||{};r.capacity=r.capacity||{};r.history=Array.isArray(r.history)?r.history.slice(-49):[];for(const id of Object.keys(RESOURCE_DEFS)){r.capacity[id]=Math.max(DEFAULT_CAP,Number(r.capacity[id])||DEFAULT_CAP);r.balances[id]=Math.max(0,Math.min(r.capacity[id],Number(r.balances[id])||0));r.earned[id]=Math.max(r.balances[id],Number(r.earned[id])||0)}return r}
  function award(state,payload={}){const r=ensure(state),computed=rewardFor(payload),override=payload.rewardOverride||{},id=RESOURCE_DEFS[override.resourceId]?override.resourceId:computed.resourceId,reward={...computed,resourceId:id,resource:RESOURCE_DEFS[id],amount:Math.max(0,Math.round(Number(override.amount??computed.amount)||0))},before=r.balances[id],granted=Math.max(0,Math.min(reward.amount,r.capacity[id]-before));r.balances[id]+=granted;r.earned[id]+=granted;const entry={id,amount:granted,requested:reward.amount,concept:reward.concept,at:Date.now()};r.history.push(entry);if(r.history.length>50)r.history.shift();C.events?.emit?.('learning:resource-earned',{...reward,amount:granted,requestedAmount:reward.amount,balance:r.balances[id],capacity:r.capacity[id],entry});return{...reward,amount:granted,requestedAmount:reward.amount,balance:r.balances[id],capacity:r.capacity[id]}}
  function balances(state){return{...ensure(state).balances}}
  function capacities(state){return{...ensure(state).capacity}}
  function normalizeCost(cost={}){const out={};for(const id of Object.keys(RESOURCE_DEFS)){const n=Math.max(0,Math.round(Number(cost[id])||0));if(n)out[id]=n}return out}
  function missing(state,cost={}){const r=ensure(state),need=normalizeCost(cost),out={};for(const [id,n] of Object.entries(need)){const short=Math.max(0,n-(r.balances[id]||0));if(short)out[id]=short}return out}
  function canSpend(state,cost={}){return Object.keys(missing(state,cost)).length===0}
  function spend(state,cost={},source='economy'){const r=ensure(state),need=normalizeCost(cost),short=missing(state,need);if(Object.keys(short).length)return{ok:false,missing:short};for(const [id,n] of Object.entries(need))r.balances[id]-=n;C.events?.emit?.('learning:resources-spent',{cost:need,source,balances:{...r.balances}});return{ok:true,cost:need,balances:{...r.balances}}}
  function refund(state,cost={},rate=1,source='refund'){const r=ensure(state),items=normalizeCost(cost),returned={};for(const [id,n] of Object.entries(items)){const amount=Math.max(0,Math.round(n*Math.max(0,Number(rate)||0))),room=r.capacity[id]-r.balances[id],grant=Math.min(amount,room);if(grant){r.balances[id]+=grant;returned[id]=grant}}C.events?.emit?.('learning:resources-refunded',{resources:returned,source,balances:{...r.balances}});return returned}
  function install(state){if(!state)return false;ensure(state);if(install._done)return true;install._done=true;if(!C.CodingRewardPipeline)for(const evt of ['challenge:solved','problem:solved','coding:solved'])C.events?.on?.(evt,payload=>{const s=C.game?.state||window.state||state;if(s)award(s,payload||{})});return true}
  // Pixel resource icons — original 16x16 art in each resource's signature
  // district hue (from Phase44Assets.districtGround), with a 1px dark outline so
  // they read at HUD size and share the world's pixel vocabulary instead of
  // clashing OS emoji. Returned as an inline SVG string for the DOM HUD.
  const ICON_INK='#1a130d';
  const ICON_PAL={
    materials:{d:'#7a4a28',b:'#c27b4a',l:'#e2a366'},
    trade:{d:'#7d6323',b:'#c7a554',l:'#ecd488'},
    research:{d:'#2f5f4f',b:'#579b82',l:'#86c6a9',x:'#bfe2e8'},
    compute:{d:'#653f5b',b:'#aa6d94',l:'#cf9cbb'},
    infrastructure:{d:'#3a5574',b:'#6788ae',l:'#cfe0f0'},
    stability:{d:'#5f3f3b',b:'#a16d66',l:'#c79b95'}
  };
  const ICON_CELLS={
    materials:[[2,9,12,4,'d'],[2,9,12,1,'l'],[3,10,3,2,'b'],[7,10,3,2,'b'],[11,10,2,2,'b'],[3,4,10,4,'d'],[3,4,10,1,'l'],[4,5,3,2,'b'],[8,5,3,2,'b']],
    trade:[[3,10,9,3,'d'],[3,10,9,1,'l'],[2,5,10,5,'b'],[2,5,10,1,'l'],[2,9,10,1,'d'],[6,6,3,3,'d'],[6,6,2,1,'l']],
    research:[[6,2,4,2,'l'],[6,4,4,3,'d'],[4,7,8,6,'d'],[4,7,8,1,'l'],[5,9,6,3,'b'],[5,9,3,1,'l'],[7,3,2,1,'x']],
    compute:[[3,3,10,10,'d'],[4,4,8,8,'b'],[6,6,4,4,'d'],[6,6,4,1,'l'],[1,5,2,1,'d'],[1,8,2,1,'d'],[13,5,2,1,'d'],[13,8,2,1,'d'],[5,1,1,2,'d'],[8,1,1,2,'d'],[5,13,1,2,'d'],[8,13,1,2,'d']],
    infrastructure:[[8,2,3,5,'d'],[7,2,3,5,'b'],[5,7,5,3,'b'],[5,7,5,1,'l'],[5,7,4,7,'d'],[5,7,3,7,'b'],[7,8,2,4,'l']],
    stability:[[3,2,10,4,'d'],[3,2,10,7,'b'],[3,2,10,1,'l'],[4,9,8,3,'d'],[6,12,4,2,'d'],[5,4,6,2,'l'],[7,6,2,4,'l']]
  };
  function iconSVG(id,size=18){const cells=ICON_CELLS[id],pal=ICON_PAL[id];if(!cells||!pal)return'';let out=`<svg class="p2-res-ico" viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`;for(const c of cells)out+=`<rect x="${c[0]-1}" y="${c[1]-1}" width="${c[2]+2}" height="${c[3]+2}" fill="${ICON_INK}" opacity=".85"/>`;for(const c of cells)out+=`<rect x="${c[0]}" y="${c[1]}" width="${c[2]}" height="${c[3]}" fill="${pal[c[4]]||pal.b}"/>`;return out+'</svg>'}
  C.ConceptResources={RESOURCE_DEFS,DISTRICT_MAP,DEFAULT_CAP,conceptKey,rewardFor,ensure,award,balances,capacities,normalizeCost,missing,canSpend,spend,refund,install,iconSVG};
})(window.Codeopolis);