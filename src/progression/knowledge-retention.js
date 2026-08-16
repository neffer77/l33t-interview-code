(function(C){
  'use strict';
  const VERSION=1,DAY=86400000,INTERVALS=[1,3,7,14,30,60],UI_URL='src/progression/knowledge-retention-ui.js';
  function slug(v){return String(v||'foundations').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'foundations'}
  function challenge(payload={}){return payload.normalized?.challenge||payload.challenge||payload.problem||payload.item||{}}
  function conceptFor(payload={}){const byMastery=C.ConceptMastery?.concept?.(payload)?.id;if(byMastery)return byMastery;const q=challenge(payload);return slug(q.pattern||q.family||q.topic||q.category||q.district||payload.concept||'foundations')}
  function ensure(state){const r=state.knowledgeRetention||(state.knowledgeRetention={version:VERSION,concepts:{},history:[],reviewsPassed:0,reviewsFailed:0});r.version=VERSION;r.concepts=r.concepts&&typeof r.concepts==='object'?r.concepts:{};r.history=Array.isArray(r.history)?r.history.slice(-99):[];r.reviewsPassed=Math.max(0,Number(r.reviewsPassed)||0);r.reviewsFailed=Math.max(0,Number(r.reviewsFailed)||0);return r}
  function intervalDays(stage){return INTERVALS[Math.max(0,Math.min(INTERVALS.length-1,Number(stage)||0))]}
  function strength(card,now=Date.now()){if(!card?.lastPracticedAt)return 0;const days=Math.max(0,(now-card.lastPracticedAt)/DAY),halfLife=Math.max(1,intervalDays(card.stage)*1.35);return Math.max(0,Math.min(1,Math.pow(.5,days/halfLife)))}
  function due(card,now=Date.now()){return !!card?.dueAt&&card.dueAt<=now}
  function status(state,conceptId,now=Date.now()){const r=ensure(state),card=r.concepts[slug(conceptId)];if(!card)return{conceptId:slug(conceptId),tracked:false,due:false,strength:0,stage:0,intervalDays:1};return{...card,tracked:true,due:due(card,now),strength:Number(strength(card,now).toFixed(3)),intervalDays:intervalDays(card.stage)}}
  function context(state,payload={},now=Date.now()){const conceptId=conceptFor(payload),s=status(state,conceptId,now),explicit=payload.spacedReview===true||payload.retentionReview===true;return{conceptId,status:s,spacedReview:explicit||(s.tracked&&s.due),due:s.due,strength:s.strength}}
  function recallQuality(reward={}){const n=reward.normalized||{},q=Number(reward.quality?.multiplier)||0;if(n.correct===false)return 0;let score=Math.min(1.15,Math.max(.25,q));if((n.hintsUsed||0)>0)score*=.72;if((n.attempts||1)>1)score*=Math.max(.55,1-(n.attempts-1)*.12);return Math.max(0,Math.min(1.15,score))}
  function record(state,reward={},now=Date.now()){
    const r=ensure(state),conceptId=reward.retention?.conceptId||conceptFor(reward),ctx=reward.retention||context(state,reward,now),q=challenge(reward),id=String(q.id||q.slug||q.title||'unknown'),score=recallQuality(reward),isReview=ctx.spacedReview===true;
    const card=r.concepts[conceptId]||(r.concepts[conceptId]={conceptId,stage:0,lastPracticedAt:0,lastChallengeId:null,dueAt:0,successfulReviews:0,failedReviews:0,bestRecall:0});
    const previousStage=card.stage||0;card.lastPracticedAt=now;card.lastChallengeId=id;card.bestRecall=Math.max(Number(card.bestRecall)||0,score);
    let outcome='practice';
    if(!card.dueAt){card.stage=0;card.dueAt=now+DAY;outcome='scheduled'}
    else if(isReview){
      if(score>=.72){card.stage=Math.min(INTERVALS.length-1,previousStage+1);card.successfulReviews=(card.successfulReviews||0)+1;r.reviewsPassed++;outcome='review-pass'}
      else{card.stage=Math.max(0,previousStage-1);card.failedReviews=(card.failedReviews||0)+1;r.reviewsFailed++;outcome='review-retry'}
      card.dueAt=now+intervalDays(card.stage)*DAY;
    }
    const entry={conceptId,challengeId:id,at:now,outcome,stage:card.stage,intervalDays:intervalDays(card.stage),recallScore:Number(score.toFixed(3)),dueAt:card.dueAt};r.history.push(entry);if(r.history.length>100)r.history.shift();
    const result={card:{...card},entry,status:status(state,conceptId,now),review:isReview,outcome};C.events?.emit?.('retention:updated',result);if(outcome==='review-pass')C.events?.emit?.('retention:passed',result);if(outcome==='review-retry')C.events?.emit?.('retention:retry',result);return result
  }
  function dueConcepts(state,now=Date.now()){const r=ensure(state);return Object.values(r.concepts).filter(c=>due(c,now)).map(c=>status(state,c.conceptId,now)).sort((a,b)=>(a.dueAt||0)-(b.dueAt||0)||a.strength-b.strength)}
  function need(state,payload={},now=Date.now()){const s=status(state,conceptFor(payload),now);if(!s.tracked)return 0;const overdue=s.due?Math.min(1,Math.max(0,(now-s.dueAt)/Math.max(DAY,s.intervalDays*DAY))):0;return Math.max(0,Math.min(1,(1-s.strength)*.7+overdue*.3))}
  function snapshot(state,now=Date.now()){const r=ensure(state),rows=Object.values(r.concepts).map(c=>status(state,c.conceptId,now)),dueRows=rows.filter(x=>x.due);return{version:VERSION,tracked:rows.length,due:dueRows.length,reviewsPassed:r.reviewsPassed,reviewsFailed:r.reviewsFailed,averageStrength:rows.length?Number((rows.reduce((a,b)=>a+b.strength,0)/rows.length).toFixed(3)):0,dueConcepts:dueRows.sort((a,b)=>a.strength-b.strength).slice(0,8),concepts:rows}}
  function attachUI(state){const host=C.phaserCity?.host;if(!host||C.phaserCity?.retention)return false;if(C.KnowledgeRetentionUI){C.phaserCity.retention=new C.KnowledgeRetentionUI(host,state);return true}if(typeof document==='undefined')return false;const old=document.querySelector('[data-p2l-retention-ui="1"]');if(old)return false;const s=document.createElement('script');s.src=UI_URL;s.dataset.p2lRetentionUi='1';s.onload=()=>attachUI(state);document.head.appendChild(s);return false}
  function install(state){if(!state)return false;ensure(state);if(!install._done){install._done=true;const getState=()=>C.game?.state||window.state||state;C.events?.on?.('coding:rewarded',reward=>{const s=getState();if(s){record(s,reward||{});C.phaserCity?.retention?.render?.()}});C.events?.on?.('civilization:phaser-ready',()=>attachUI(getState()));C.events?.on?.('mastery:updated',()=>C.phaserCity?.retention?.render?.())}attachUI(state);return true}
  C.KnowledgeRetention={VERSION,DAY,INTERVALS,conceptFor,ensure,intervalDays,strength,due,status,context,recallQuality,record,dueConcepts,need,snapshot,attachUI,install};
})(window.Codeopolis);
