(function(C){
  'use strict';
  const VERSION=1,SCAN_SECONDS=20,ESCALATE_SECONDS=55,COOLDOWN_MS=180000;
  const DEFINITIONS=Object.freeze({
    grid_cascade:{id:'grid_cascade',icon:'⚡',title:'Grid Cascade',concepts:['graph','bfs','systems','array'],threshold:45,description:'Power capacity and connectivity failures are cascading through dependent buildings.'},
    transit_gridlock:{id:'transit_gridlock',icon:'🚧',title:'Transit Gridlock',concepts:['graph','bfs','dfs','queue'],threshold:50,description:'Population demand has exceeded the road network and commuters are choking city throughput.'},
    maintenance_cascade:{id:'maintenance_cascade',icon:'🛠️',title:'Maintenance Cascade',concepts:['reliability','debugging','array','string'],threshold:45,description:'Degraded buildings are failing faster than the city can keep them operational.'},
    supply_breakdown:{id:'supply_breakdown',icon:'📦',title:'Supply Chain Breakdown',concepts:['hash_map','graph','array','two_pointers'],threshold:45,description:'Disconnected logistics and missing inputs are starving dependent production.'},
    budget_emergency:{id:'budget_emergency',icon:'💸',title:'Budget Emergency',concepts:['dynamic_programming','dp','greedy','optimization'],threshold:48,description:'Operating costs and stalled production have pushed the city into a fiscal emergency.'}
  });
  const ORDER=['grid_cascade','transit_gridlock','maintenance_cascade','supply_breakdown','budget_emergency'];
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function key(x,y){return `${x},${y}`}
  function ensure(state){
    const d=state.cityCrises||(state.cityCrises={version:VERSION,active:null,history:[],pressureStreak:{},lastScanAt:0,lastResolvedAt:0,migratedLegacy:false});
    d.version=VERSION;d.history=Array.isArray(d.history)?d.history.slice(-29):[];d.pressureStreak=d.pressureStreak&&typeof d.pressureStreak==='object'?d.pressureStreak:{};
    if(!d.migratedLegacy&&state.crisisMeta?.active){d.history.unshift({...state.crisisMeta.active,status:'legacy-retired',retiredAt:Date.now()});state.crisisMeta.active=null;d.migratedLegacy=true}
    return d;
  }
  function summaries(state,world){
    const infra=world?.infrastructureNetwork?.()||{},pop=C.PopulationSimulation?.summary?.(state,world)||{},ops=world?.operationsSummary?.()||{},supply=world?.citySupplySummary?.()||C.CitySupplyRuntime?.summary?.(state,world)||{};
    const buildings=world?.placedBuildings?.()||[],roads=world?.roadTiles?.()||[],population=Math.max(0,Number(pop.population??state.population)||0),roadCapacity=Math.max(12,roads.length*8),congestion=population/roadCapacity,powerRatio=clamp(Number(infra.powerRatio??1),0,1),unpowered=Math.max(0,(infra.buildings?.length||0)-(infra.poweredBuildings||0));
    return{infra,pop,ops,supply,buildings,roads,population,roadCapacity,congestion,powerRatio,unpowered};
  }
  function pressure(state,world){
    const s=summaries(state,world),n=Math.max(1,s.buildings.length),supplyFailures=(s.supply.shortage||0)+(s.supply.disconnected||0)+(s.supply.budget||0),negativeNet=Math.max(0,-Number(s.supply.budget?.net||0));
    const scores={
      grid_cascade:clamp((1-s.powerRatio)*115+(s.unpowered/n)*55,0,100),
      transit_gridlock:clamp((s.congestion-0.75)*95+(s.pop.jobDemand||0)*.15,0,100),
      maintenance_cascade:clamp(((s.ops.outages||0)*34+(s.ops.degraded||0)*18+(s.ops.maintenance||0)*7)/n*3,0,100),
      supply_breakdown:clamp((supplyFailures/n)*62+(s.supply.running===0&&s.supply.rows?.length?25:0),0,100),
      budget_emergency:clamp((Number(state.money)<25?45:0)+(Number(state.money)<10?25:0)+negativeNet*8+(s.supply.budget||0)*12,0,100)
    };
    return{...s,scores,ranked:ORDER.map(id=>({id,score:Number(scores[id].toFixed(1)),definition:DEFINITIONS[id]})).sort((a,b)=>b.score-a.score)};
  }
  function desiredConcepts(challenge){
    if(C.LearningCityLoop?.challengeConcepts)return C.LearningCityLoop.challengeConcepts(challenge).map(v=>String(v).toLowerCase().replace(/[^a-z0-9]+/g,'_'));
    return[challenge?.pattern,challenge?.family,challenge?.topic,challenge?.category,challenge?.district].filter(Boolean).map(v=>String(v).toLowerCase().replace(/[^a-z0-9]+/g,'_'));
  }
  function chooseChallenge(state,world,type){
    const wanted=new Set((DEFINITIONS[type]?.concepts||[]).map(v=>String(v).toLowerCase().replace(/[^a-z0-9]+/g,'_'))),ranked=C.AdaptiveChallengeSelector?.ranked?.(state,world)||[];
    const hit=ranked.find(r=>desiredConcepts(r.challenge||r).some(v=>wanted.has(v))),fallback=hit||ranked[0];if(fallback)return fallback.challenge||fallback;
    if(typeof CHALLENGES!=='undefined')return CHALLENGES.find(c=>desiredConcepts(c).some(v=>wanted.has(v)))||CHALLENGES[0]||null;return null;
  }
  function affectedBuildings(state,world,type,limit=6){
    const rows=world?.placedBuildings?.()||[],bad=[];
    for(const b of rows){
      const infra=world?.infrastructureStatus?.(b.x,b.y),op=world?.buildingOperationStatus?.(b.x,b.y),sup=world?.buildingSupplyStatus?.(b.x,b.y),profile=world?.serviceProfile?.(b.x,b.y)||{};let score=0;
      if(type==='grid_cascade')score=(!infra?.powerConnected&&profile.powerDemand?80:0)+(infra?.powerRatio<.8?30:0)+(profile.powerSupply>0?20:0);
      else if(type==='maintenance_cascade')score=op?.status==='outage'?100:op?.status==='degraded'?75:op?.status==='maintenance'?35:0;
      else if(type==='supply_breakdown')score=['shortage','disconnected','budget'].includes(sup?.state)?90:sup?.hasRecipe?20:0;
      else if(type==='transit_gridlock')score=b.id==='transit'?100:b.id==='house'?65:(infra?.roadConnected?35:10);
      else if(type==='budget_emergency')score=sup?.recipe?.moneyCost?70:(b.id==='house'||b.id==='park'?35:20);
      if(score>0)bad.push({x:b.x,y:b.y,id:b.id,name:b.def?.name||b.id,score});
    }
    bad.sort((a,b)=>b.score-a.score||a.y-b.y||a.x-b.x);return bad.slice(0,limit).map(({score,...b})=>b);
  }
  function severityFor(score){return score>=82?3:score>=64?2:1}
  function crisisMultiplier(active,x,y){if(!active)return 1;const affected=(active.affected||[]).some(a=>a.x===x&&a.y===y);if(affected)return[1,.72,.5,.32][active.severity]||.72;return active.severity>=3?.9:1}
  function trigger(state,world,type,score=50,now=Date.now()){
    const data=ensure(state);if(data.active)return data.active;const def=DEFINITIONS[type];if(!def)return null;const affected=affectedBuildings(state,world,type,6),origin=affected[0]||world?.placedBuildings?.()[0]||null,challenge=chooseChallenge(state,world,type),severity=severityFor(score);
    const active={id:`${type}-${now}`,type,title:def.title,icon:def.icon,description:def.description,severity,score:Number(score.toFixed?.(1)??score),stage:'active',origin:origin?{x:origin.x,y:origin.y,id:origin.id,name:origin.name||world?.buildingDef?.(origin.id)?.name||origin.id}:null,affected,challengeId:challenge?.id||null,startedAt:now,lastEscalatedAt:now,stabilizations:0};
    data.active=active;data.lastScanAt=now;C.events?.emit?.('city-crisis:triggered',{crisis:active,challenge});if(origin)world?.select?.(origin.x,origin.y);return active;
  }
  function scan(state,world,now=Date.now()){
    const data=ensure(state),p=pressure(state,world);data.lastScanAt=now;if(data.active)return escalate(state,world,now,p);if(p.buildings.length<3||now-data.lastResolvedAt<COOLDOWN_MS)return{active:null,pressure:p};
    for(const row of p.ranked){const threshold=row.definition.threshold;data.pressureStreak[row.id]=row.score>=threshold?(data.pressureStreak[row.id]||0)+1:0}
    const candidate=p.ranked.find(row=>row.score>=row.definition.threshold&&(data.pressureStreak[row.id]||0)>=2);if(candidate){for(const id of ORDER)data.pressureStreak[id]=0;return{active:trigger(state,world,candidate.id,candidate.score,now),pressure:p,triggered:true}}return{active:null,pressure:p};
  }
  function escalate(state,world,now=Date.now(),p=pressure(state,world)){
    const data=ensure(state),a=data.active;if(!a)return{active:null,pressure:p};if(now-(a.lastEscalatedAt||a.startedAt)<ESCALATE_SECONDS*1000)return{active:a,pressure:p};a.lastEscalatedAt=now;if(a.severity<3){a.severity++;a.stage=a.severity===3?'critical':'escalated';a.affected=affectedBuildings(state,world,a.type,Math.min(10,4+a.severity*2));C.events?.emit?.('city-crisis:escalated',{crisis:{...a}})}return{active:a,pressure:p,escalated:true};
  }
  function challengeId(payload={}){return payload.normalized?.challenge?.id||payload.challenge?.id||payload.problem?.id||null}
  function switchView(name){if(typeof document==='undefined')return;document.querySelector(`[data-tab="${name}"],[data-view="${name}"]`)?.click?.()}
  function startResolution(state,world){
    const data=ensure(state),a=data.active;if(!a)return{ok:false,reason:'No active city crisis.'};let challenge=a.challengeId&&(typeof CHALLENGES!=='undefined'?CHALLENGES.find(c=>c.id===a.challengeId):null);challenge=challenge||chooseChallenge(state,world,a.type);if(!challenge?.id)return{ok:false,reason:'No adaptive interview challenge is available.'};a.challengeId=challenge.id;a.respondingAt=Date.now();
    const model={kind:'crisis',id:a.origin?.id||a.type,name:a.origin?.name||a.title,title:`${a.icon} ${a.title}`,district:world?.buildingDef?.(a.origin?.id)?.district||'core',challengeId:challenge.id,requirement:`Contain a level ${a.severity} city crisis`,body:`${a.description} Solve the selected interview problem to restore city throughput.`};C.WorldOriginMissions?.begin?.(state,model,a.origin?.id||a.type);C.events?.emit?.('city-crisis:responding',{crisis:{...a},challenge});switchView('challenge');const ok=!!C.AdaptiveChallengeSelector?.startChallenge?.(challenge.id);if(!ok&&typeof state!=='undefined')state.current=challenge.id;return{ok:ok||!!challenge,challenge,crisis:a};
  }
  function resolve(state,world,payload={}){
    const data=ensure(state),a=data.active;if(!a)return null;const id=challengeId(payload);if(id&&a.challengeId&&id!==a.challengeId)return null;if(payload.normalized?.correct===false||payload.progressionEligible===false)return null;
    const record={...a,status:'resolved',resolvedAt:Date.now(),resolution:'coding'};data.history.unshift(record);data.history=data.history.slice(0,30);data.active=null;data.lastResolvedAt=record.resolvedAt;for(const id2 of ORDER)data.pressureStreak[id2]=0;C.WorldOriginMissions?.completion?.(state,{challengeId:a.challengeId,building:{name:a.origin?.name||a.title},progress:1,crisisResolved:true});if(a.origin)world?.select?.(a.origin.x,a.origin.y);C.events?.emit?.('city-crisis:resolved',{crisis:record,challengeId:id||a.challengeId});switchView('city');return record;
  }
  function stabilizationCost(active){return active?40+active.severity*35:0}
  function stabilize(state,world){const data=ensure(state),a=data.active;if(!a)return{ok:false,reason:'No active city crisis.'};const cost=stabilizationCost(a);if(Number(state.money)<cost)return{ok:false,reason:`Need ${cost} credits.`};state.money-=cost;a.stabilizations=(a.stabilizations||0)+1;a.lastEscalatedAt=Date.now();if(a.severity>1)a.severity--;a.stage='contained';C.events?.emit?.('city-crisis:stabilized',{crisis:{...a},cost});return{ok:true,cost,crisis:a}}
  function summary(state,world){const data=ensure(state),p=pressure(state,world),a=data.active;return{version:VERSION,active:a?{...a,multiplier:[1,.72,.5,.32][a.severity]||.72}:null,pressure:p.ranked,historyCount:data.history.length,stable:!a,lastResolvedAt:data.lastResolvedAt}}
  function install(state,world){
    if(!state||!world)return false;ensure(state);const proto=world.constructor?.prototype||Object.getPrototypeOf(world);if(proto&&!proto.__r11Crises){proto.__r11Crises=true;const effects=proto.buildingEffects,service=proto.serviceProfile;proto.buildingCrisisStatus=function(x,y){const d=ensure(C.game?.state||this.state||state),a=this.anchorFor?.(x,y)||{x,y},active=d.active,m=crisisMultiplier(active,a.x,a.y);return active?{active:true,crisis:active,multiplier:m,affected:m<1}:null};proto.cityCrisisSummary=function(){return summary(C.game?.state||this.state||state,this)};if(typeof effects==='function')proto.buildingEffects=function(x,y){const fx=effects.call(this,x,y);if(!fx)return fx;const c=this.buildingCrisisStatus?.(x,y),m=c?.multiplier??1;return{...fx,crisis:c,crisisMultiplier:m,population:Math.round((Number(fx.population)||0)*m),energy:Math.round((Number(fx.energy)||0)*m),happiness:Math.round((Number(fx.happiness)||0)*m),moneyRate:Number(((Number(fx.moneyRate)||0)*m).toFixed(1)),researchRate:Number(((Number(fx.researchRate)||0)*m).toFixed(1))}};if(typeof service==='function')proto.serviceProfile=function(x,y){const s=service.call(this,x,y);if(!s)return s;const c=this.buildingCrisisStatus?.(x,y),m=c?.multiplier??1;return{...s,crisis:c,crisisMultiplier:m,powerSupply:Math.round((Number(s.powerSupply)||0)*m),housingCapacity:Math.round((Number(s.housingCapacity)||0)*m),workerDemand:Math.round((Number(s.workerDemand)||0)*Math.max(.7,m))}}}
    if(!install._events){install._events=true;let elapsed=0;C.events?.on?.('world:tick',e=>{elapsed+=Number(e?.dt)||0;if(elapsed<SCAN_SECONDS)return;const n=Math.floor(elapsed/SCAN_SECONDS);elapsed%=SCAN_SECONDS;for(let i=0;i<n;i++)scan(C.game?.state||state,C.game?.world||world,Date.now())});C.events?.on?.('coding:rewarded',p=>resolve(C.game?.state||state,C.game?.world||world,p))}
    C.events?.emit?.('r11:city-crisis-ready',summary(state,world));return true;
  }
  function audit(state,world){return{version:VERSION,ready:true,definitions:Object.keys(DEFINITIONS),summary:summary(state,world),learningProgressDestructive:false}}
  C.CityCrisisSystem={VERSION,SCAN_SECONDS,ESCALATE_SECONDS,COOLDOWN_MS,DEFINITIONS,ORDER,ensure,summaries,pressure,chooseChallenge,affectedBuildings,severityFor,crisisMultiplier,trigger,scan,escalate,startResolution,resolve,stabilizationCost,stabilize,summary,install,audit};
})(window.Codeopolis);
