(function(C){
'use strict';
const VERSION=1;
const REWARD_BY_AGE=Object.freeze({2:{materials:3,trade:3},3:{research:4,compute:2},4:{infrastructure:4,stability:2},5:{compute:4,stability:3},6:{research:4,infrastructure:4}});
function ensure(state){const x=state.ageTransitionReveal||(state.ageTransitionReveal={version:VERSION,claimed:[],history:[]});x.version=VERSION;x.claimed=Array.isArray(x.claimed)?x.claimed:[];x.history=Array.isArray(x.history)?x.history.slice(-9):[];return x}
function curriculumFor(level){const p=C.AgeCurriculumPools?.pool?.(Number(level));if(!p)return null;return{id:p.id,districts:[...(p.districts||[])],concepts:[...(p.concepts||[])],difficulties:[...(p.difficulties||[])]}}
function buildingUnlocks(level){try{return (typeof BUILDINGS==='undefined'?[]:BUILDINGS).filter(b=>Number(b.requiresEra)||1).filter(b=>(Number(b.requiresEra)||1)===Number(level)).map(b=>({id:b.id,name:b.name||b.id,icon:b.icon||'🏢',district:b.district||'core'}))}catch{return[]}}
function landmarkUnlocks(state,world,level){return (C.AgeUnlockLandmarks?.LANDMARKS||[]).filter(l=>Number(l.age)===Number(level)).map(l=>{const s=C.AgeUnlockLandmarks.status(state,world,l);return{id:l.id,name:l.name,icon:l.icon,unlocked:s.unlocked,missing:[...(s.missing||[])]}})}
function rewardPlan(level){return{...(REWARD_BY_AGE[Number(level)]||{})}}
function claim(state,level){const x=ensure(state),n=Number(level);if(x.claimed.includes(n))return{claimed:false,rewards:{}};const plan=rewardPlan(n),rewards={};for(const [resourceId,amount] of Object.entries(plan)){const r=C.ConceptResources?.award?.(state,{concept:`Age ${n} milestone`,rewardOverride:{resourceId,amount}});rewards[resourceId]=Number(r?.amount)||0}x.claimed.push(n);return{claimed:true,rewards}}
function reveal(state,world,level,opts={}){const n=Number(level)||Number(C.AgeProgression?.current?.(state)?.level)||1,x=ensure(state),reward=opts.claim===false?{claimed:false,rewards:{}}:claim(state,n),out={version:VERSION,age:n,curriculum:curriculumFor(n),buildings:buildingUnlocks(n),landmarks:landmarkUnlocks(state,world,n),rewardPlan:rewardPlan(n),reward};if(opts.record!==false){x.history.push({...out,at:Date.now()});if(x.history.length>10)x.history.shift()}return out}
function install(state,world){ensure(state);if(install._done)return true;install._done=true;C.events?.on?.('town-center:advanced',e=>{const s=C.game?.state||window.state||state,w=C.game?.world||world,level=e?.to?.level||e?.ceremony?.level;if(!s||!level)return;const out=reveal(s,w,level);C.events?.emit?.('age-transition:revealed',out);try{typeof persist==='function'&&persist(false)}catch{}});return true}
C.AgeTransitionReveal={VERSION,REWARD_BY_AGE,ensure,curriculumFor,buildingUnlocks,landmarkUnlocks,rewardPlan,claim,reveal,install};
})(window.Codeopolis);
