(function(C){
  'use strict';
  function boot(){
    if(!C.game?.phase17||C.game.phase18)return false;
    const Pipeline=C.get('HiringPipeline'),UI=C.get('Phase18UI');if(!Pipeline||!UI)return false;
    const p9=C.game.phase9,pipeline=new Pipeline(state,C.game),ui=new UI(C.game,pipeline);C.game.phase18={pipeline,ui,startedAt:Date.now()};
    if(p9?.behavioral&&!p9.behavioral.__phase18Events){const prior=p9.behavioral.evaluate.bind(p9.behavioral);p9.behavioral.evaluate=function(text){const result=prior(text);if(result?.record)C.events.emit('behavioral:evaluated',result);return result};p9.behavioral.__phase18Events=true}
    const after=(changed)=>{if(changed){try{persist(false)}catch{}ui.refresh()}};
    C.events.on('learning:mastered',e=>after(pipeline.onMastered(e)));
    C.events.on('interviewer:finished',e=>after(pipeline.onInterviewer(e)));
    C.events.on('incident:completed',e=>after(pipeline.onIncident(e)));
    C.events.on('debugging:resolved',e=>after(pipeline.onDebug(e)));
    C.events.on('design:finished',e=>after(pipeline.onDesign(e)));
    C.events.on('behavioral:evaluated',e=>after(pipeline.onBehavioral(e)));
    C.events.on('hiring:round-completed',e=>{C.game.phase11?.telemetry?.track?.('hiring-round',{companyId:e.loop.companyId,type:e.stage.type,score:e.score});C.events.emit('reward:micro',{label:`💼 ${e.stage.title}: ${e.score}/100`})});
    C.events.on('hiring:loop-finished',e=>{C.game.phase11?.telemetry?.track?.('hiring-loop',{companyId:e.loop.companyId,score:e.loop.score,verdict:e.loop.verdict});try{persist(false)}catch{}ui.refresh()});
    C.events.on('hiring:offer',e=>{C.game.phase15?.director?.card?.('📨',`${e.company.name} offer`,`${e.offer.role} · ${e.offer.score}/100`);C.game.phase15?.director?.flash?.();try{persist(false)}catch{}ui.refresh()});
    C.events.on('hiring:no-offer',e=>{C.game.phase15?.director?.card?.('📋',`${e.company.name} debrief`,'Review the weakest evidence signal and try another loop when ready.');try{persist(false)}catch{}ui.refresh()});
    C.events.on('hiring:offer-accepted',()=>{C.game.phase15?.director?.flash?.();try{persist(false)}catch{}ui.refresh()});
    if(typeof render==='function'){const prior=render;render=function(){prior();ui.ensure();ui.refresh();const phase=document.getElementById('phaseLabel');if(phase)phase.textContent='Phase 18 · Hiring Pipelines'}}
    pipeline.recruiting?.evaluate?.();try{persist(false)}catch{}render();C.events.emit('phase18:ready',{pipeline});return true;
  }
  if(!boot())C.events.on('phase17:ready',()=>boot());
})(window.Codeopolis);
