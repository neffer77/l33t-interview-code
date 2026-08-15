(function(C){
  'use strict';
  const VERSION=1;
  const LEVELS=Object.freeze([
    {level:0,id:'unseen',name:'Unseen',xp:0,solves:0},
    {level:1,id:'introduced',name:'Introduced',xp:1,solves:1},
    {level:2,id:'practicing',name:'Practicing',xp:25,solves:2},
    {level:3,id:'competent',name:'Competent',xp:70,solves:5},
    {level:4,id:'proficient',name:'Proficient',xp:150,solves:9},
    {level:5,id:'mastered',name:'Mastered',xp:280,solves:15}
  ]);
  function slug(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
  function title(v){return String(v||'Concept').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
  function challengeOf(payload={}){return payload.normalized?.challenge||payload.challenge||payload.problem||payload.item||{}}
  function concept(payload={}){const q=challengeOf(payload),skills=Array.isArray(q.skillIds)?q.skillIds:Array.isArray(payload.skillIds)?payload.skillIds:[];const raw=q.pattern||q.family||q.topic||q.category||skills[0]||q.district||payload.concept||payload.resourceId||'foundations';return{id:slug(raw)||'foundations',name:title(raw),district:q.district||payload.resourceId||C.ConceptResources?.conceptKey?.(payload)||'materials'}}
  function ensure(state){const m=state.conceptMastery||(state.conceptMastery={version:VERSION,concepts:{},history:[]});m.version=VERSION;m.concepts=m.concepts&&typeof m.concepts==='object'?m.concepts:{};m.history=Array.isArray(m.history)?m.history.slice(-99):[];return m}
  function levelFor(xp,solves){let out=LEVELS[0];for(const l of LEVELS)if(xp>=l.xp&&solves>=l.solves)out=l;return out}
  function nextLevel(xp,solves){const cur=levelFor(xp,solves);return LEVELS.find(l=>l.level===cur.level+1)||null}
  function difficultyFactor(v){const d=String(v||'easy').toLowerCase();if(/hard|expert|advanced/.test(d))return 1.8;if(/medium|intermediate/.test(d))return 1.35;return 1}
  function xpFor(reward={}){const n=reward.normalized||{},quality=Math.max(0,Number(reward.quality?.multiplier)||0),base=10*difficultyFactor(n.difficulty);return n.correct===false?0:Math.max(1,Math.round(base*quality))}
  function record(state,reward={}){const m=ensure(state),c=concept(reward),xp=xpFor(reward);if(!xp)return{concept:c,xp:0,level:LEVELS[0]};const row=m.concepts[c.id]||(m.concepts[c.id]={id:c.id,name:c.name,district:c.district,xp:0,solves:0,firstSolves:0,bestQuality:0,lastSolvedAt:0});const before=levelFor(row.xp,row.solves);row.name=c.name;row.district=c.district;row.xp=Math.max(0,Number(row.xp)||0)+xp;row.solves=Math.max(0,Number(row.solves)||0)+1;if(reward.normalized?.firstSolve)row.firstSolves=(row.firstSolves||0)+1;row.bestQuality=Math.max(Number(row.bestQuality)||0,Number(reward.quality?.multiplier)||0);row.lastSolvedAt=Date.now();const after=levelFor(row.xp,row.solves),next=nextLevel(row.xp,row.solves),entry={conceptId:c.id,xp,level:after.level,at:row.lastSolvedAt};m.history.push(entry);if(m.history.length>100)m.history.shift();const result={concept:{...row},xp,level:after,previousLevel:before,next,leveledUp:after.level>before.level};C.events?.emit?.('mastery:updated',result);if(result.leveledUp)C.events?.emit?.('mastery:level-up',result);return result}
  function status(state,id){const m=ensure(state),row=m.concepts[id];if(!row)return{concept:null,level:LEVELS[0],next:LEVELS[1],progress:0};const level=levelFor(row.xp,row.solves),next=nextLevel(row.xp,row.solves);let progress=1;if(next){const xpSpan=Math.max(1,next.xp-level.xp),solveSpan=Math.max(1,next.solves-level.solves),xpP=(row.xp-level.xp)/xpSpan,solveP=(row.solves-level.solves)/solveSpan;progress=Math.max(0,Math.min(1,Math.min(xpP,solveP)))}return{concept:{...row},level,next,progress}}
  function all(state){const m=ensure(state);return Object.keys(m.concepts).map(id=>status(state,id)).sort((a,b)=>b.level.level-a.level.level||(b.concept?.xp||0)-(a.concept?.xp||0)||a.concept.name.localeCompare(b.concept.name))}
  function summary(state){const rows=all(state),counts={unseen:0,introduced:0,practicing:0,competent:0,proficient:0,mastered:0};for(const r of rows)counts[r.level.id]=(counts[r.level.id]||0)+1;return{total:rows.length,counts,mastered:counts.mastered||0,proficientOrBetter:(counts.proficient||0)+(counts.mastered||0),rows}}
  function install(state){if(state)ensure(state);if(install._done)return true;install._done=true;C.events?.on?.('coding:rewarded',reward=>{const s=C.game?.state||window.state||state;if(s)record(s,reward||{})});return true}
  C.ConceptMastery={VERSION,LEVELS,concept,ensure,levelFor,nextLevel,xpFor,record,status,all,summary,install};
})(window.Codeopolis);