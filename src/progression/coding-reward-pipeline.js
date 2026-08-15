(function(C){
  'use strict';
  const VERSION=1,EVENTS=['challenge:solved','problem:solved','coding:solved'],MASTERY_URL='src/progression/concept-mastery.js';
  function num(v,f=0){v=Number(v);return Number.isFinite(v)?v:f}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function challengeOf(p={}){return p.challenge||p.problem||p.item||{}}
  function normalize(payload={}){
    const q=challengeOf(payload),hints=Math.max(0,num(payload.hintsUsed??payload.hints??payload.hintCount)),attempts=Math.max(1,num(payload.attempts??payload.submissions,1)),elapsed=Math.max(0,num(payload.elapsedSeconds??payload.solveTimeSeconds??payload.durationSeconds)),target=Math.max(0,num(payload.targetSeconds??q.targetSeconds));
    const firstSolve=payload.firstSolve!==false&&payload.repeat!==true;
    return{challenge:q,difficulty:q.diff||q.difficulty||payload.difficulty||'Easy',firstSolve,hintsUsed:hints,attempts,elapsedSeconds:elapsed,targetSeconds:target,streak:Math.max(0,num(payload.streak)),correct:payload.correct!==false,source:payload.source||'coding',raw:payload};
  }
  function quality(n){
    if(!n.correct)return{multiplier:0,breakdown:{correctness:0}};
    const hint=clamp(1-n.hintsUsed*.12,.55,1),attempt=clamp(1-(n.attempts-1)*.08,.6,1),speed=n.targetSeconds>0&&n.elapsedSeconds>0?clamp(n.targetSeconds/n.elapsedSeconds,.85,1.15):1,streak=clamp(1+Math.min(n.streak,10)*.02,1,1.2),first=n.firstSolve?1:.65;
    return{multiplier:hint*attempt*speed*streak*first,breakdown:{correctness:1,hints:hint,attempts:attempt,speed,streak,firstSolve:first}};
  }
  function ensure(state){const r=state.codingRewards||(state.codingRewards={version:VERSION,solves:0,totalBase:0,totalGranted:0,history:[]});r.version=VERSION;r.solves=Math.max(0,num(r.solves));r.totalBase=Math.max(0,num(r.totalBase));r.totalGranted=Math.max(0,num(r.totalGranted));r.history=Array.isArray(r.history)?r.history.slice(-49):[];return r}
  function evaluate(payload={}){const normalized=normalize(payload),base=C.ConceptResources?.rewardFor?.({...payload,firstSolve:true,repeat:false})||{resourceId:'materials',amount:8},q=quality(normalized),amount=normalized.correct?Math.max(1,Math.round(base.amount*q.multiplier)):0;return{normalized,baseReward:base,quality:q,resourceId:base.resourceId,amount}}
  function process(state,payload={}){
    const ledger=ensure(state),result=evaluate(payload);if(!result.normalized.correct)return{...result,granted:0,reason:'incorrect'};
    const award=C.ConceptResources?.award?.(state,{...payload,firstSolve:true,repeat:false,rewardOverride:{resourceId:result.resourceId,amount:result.amount}});
    const granted=award?.amount??0,entry={resourceId:result.resourceId,requested:result.amount,granted,quality:Number(result.quality.multiplier.toFixed(3)),firstSolve:result.normalized.firstSolve,hintsUsed:result.normalized.hintsUsed,attempts:result.normalized.attempts,elapsedSeconds:result.normalized.elapsedSeconds,streak:result.normalized.streak,at:Date.now()};ledger.solves++;ledger.totalBase+=result.baseReward.amount;ledger.totalGranted+=granted;ledger.history.push(entry);if(ledger.history.length>50)ledger.history.shift();C.events?.emit?.('coding:rewarded',{...result,granted,entry});return{...result,granted,entry}
  }
  function loadMastery(state){if(C.ConceptMastery){C.ConceptMastery.install(state);return}if(typeof document==='undefined'||document.querySelector(`script[data-p2f-mastery="1"]`))return;const s=document.createElement('script');s.src=MASTERY_URL;s.dataset.p2fMastery='1';s.onload=()=>C.ConceptMastery?.install?.(state);document.head.appendChild(s)}
  function install(state){if(state)ensure(state);loadMastery(state);if(install._done)return true;install._done=true;for(const evt of EVENTS)C.events?.on?.(evt,payload=>{if(payload?.__rewardPipelineHandled)return;const s=C.game?.state||window.state||state;if(s)process(s,{...(payload||{}),__rewardPipelineHandled:true})});return true}
  C.CodingRewardPipeline={VERSION,EVENTS,normalize,quality,ensure,evaluate,process,loadMastery,install};
})(window.Codeopolis);