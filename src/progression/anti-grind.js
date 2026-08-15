(function(C){
  'use strict';
  const VERSION=1,DAY=86400000;
  function slug(v){return String(v||'unknown').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'unknown'}
  function challenge(payload={}){return payload.challenge||payload.problem||payload.item||{}}
  function idFor(payload={}){const q=challenge(payload);return slug(q.id||q.slug||q.title||[q.district,q.pattern,q.family].filter(Boolean).join('-'))}
  function conceptFor(payload={}){const q=challenge(payload);return slug(q.pattern||q.family||q.topic||q.category||q.district||payload.concept||'foundations')}
  function ensure(state){const a=state.antiGrind||(state.antiGrind={version:VERSION,problems:{},concepts:{},recent:[],lastNovelAt:0});a.version=VERSION;a.problems=a.problems||{};a.concepts=a.concepts||{};a.recent=Array.isArray(a.recent)?a.recent.slice(-30):[];return a}
  function countRecent(rows,pred,now,windowMs){return rows.reduce((n,x)=>n+(now-(Number(x.at)||0)<=windowMs&&pred(x)?1:0),0)}
  function evaluate(state,payload={},now=Date.now()){
    const a=ensure(state),id=idFor(payload),concept=conceptFor(payload),q=challenge(payload),p=a.problems[id]||{},c=a.concepts[concept]||{},recentSame=countRecent(a.recent,x=>x.id===id,now,DAY),recentConcept=countRecent(a.recent,x=>x.concept===concept,now,DAY),newProblem=!p.solves,newConcept=!c.solves;
    let diminishing=1;if(recentSame>=1)diminishing*=.7;if(recentSame>=2)diminishing*=.6;if(recentSame>=4)diminishing*=.45;if(recentConcept>=4)diminishing*=.85;if(recentConcept>=8)diminishing*=.75;
    const diff=String(q.diff||q.difficulty||payload.difficulty||'easy').toLowerCase(),age=Math.max(1,Number(C.AgeProgression?.current?.(state)?.level)||Number(state.eraLevel)||1),trivial=(diff==='easy'&&age>=4),novelty=newProblem?1.12:1,exploration=newConcept?1.12:1,weak=Number(payload.weakAreaBonus)||0,review=payload.spacedReview===true?1.12:1,explain=payload.explanationComplete===true||payload.explained===true?1.08:1,quality=payload.hintsUsed===0&&Number(payload.attempts||payload.submissions||1)===1?1.05:1;
    if(trivial&&!newProblem)diminishing*=.65;
    const multiplier=Math.max(.12,Math.min(1.45,diminishing*novelty*exploration*review*explain*quality*(1+Math.min(.15,weak))));
    const reasons=[];if(newProblem)reasons.push('new problem');if(newConcept)reasons.push('new concept');if(review)reasons.push('spaced review');if(explain>1)reasons.push('explained solution');if(diminishing<1)reasons.push('diminishing returns');if(trivial&&!newProblem)reasons.push('below current age');
    return{id,concept,multiplier:Number(multiplier.toFixed(3)),newProblem,newConcept,recentSame,recentConcept,trivial,reasons};
  }
  function record(state,payload={},result={},now=Date.now()){
    const a=ensure(state),e=result.antiGrind||evaluate(state,payload,now),p=a.problems[e.id]||(a.problems[e.id]={solves:0,lastSolvedAt:0}),c=a.concepts[e.concept]||(a.concepts[e.concept]={solves:0,lastSolvedAt:0});p.solves++;p.lastSolvedAt=now;c.solves++;c.lastSolvedAt=now;a.recent.push({id:e.id,concept:e.concept,at:now,multiplier:e.multiplier});if(a.recent.length>30)a.recent.shift();if(e.newProblem||e.newConcept)a.lastNovelAt=now;return e
  }
  function snapshot(state){const a=ensure(state);return{version:VERSION,uniqueProblems:Object.keys(a.problems).length,uniqueConcepts:Object.keys(a.concepts).length,recent:a.recent.slice(-10),lastNovelAt:a.lastNovelAt||0}}
  C.AntiGrind={VERSION,ensure,idFor,conceptFor,evaluate,record,snapshot};
})(window.Codeopolis);