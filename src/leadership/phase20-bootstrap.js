(function(C){
  'use strict';
  function boot(){
    if(!C.game?.phase19||C.game.phase20)return false;
    const Evaluator=C.get('LeadershipEvaluator'),Programs=C.get('LeadershipPrograms'),UI=C.get('Phase20UI');if(!Evaluator||!Programs||!UI)return false;
    const evaluator=new Evaluator(),programs=new Programs(state,C.game,evaluator),ui=new UI(C.game,programs);C.game.phase20={evaluator,programs,ui,startedAt:Date.now()};
    const performance=C.game.phase19.performance;
    if(performance&&!performance.__phase20LeadershipGate){
      const priorCan=performance.canPromote.bind(performance),priorPromote=performance.promote.bind(performance);
      performance.canPromote=function(){return priorCan()&&programs.promotionGate().ok};
      performance.promote=function(){if(!priorCan())return priorPromote();const gate=programs.promotionGate();if(!gate.ok)return gate;return priorPromote()};
      performance.__phase20LeadershipGate=true;
    }
    const save=()=>{try{persist(false)}catch{}ui.refresh();C.game.phase19?.ui?.refresh?.()};
    C.events.on('design:finished',e=>{if(programs.onDesign(e))save()});
    C.events.on('incident:completed',e=>{if(programs.onIncident(e))save()});
    C.events.on('leadership:evidence-reviewed',e=>{C.game.phase11?.telemetry?.track?.('leadership-evidence',{companyId:e.program.companyId,type:e.stage.type,score:e.result.score,passed:e.passed});try{persist(false)}catch{}ui.refresh()});
    C.events.on('leadership:stage-completed',e=>{C.game.phase11?.telemetry?.track?.('leadership-stage',{companyId:e.program.companyId,type:e.stage.type,score:e.score});C.events.emit('reward:micro',{label:`🧭 ${e.stage.title}: ${e.score}/100`});save()});
    C.events.on('leadership:program-completed',e=>{C.game.phase11?.telemetry?.track?.('leadership-program',{companyId:e.program.companyId,score:e.program.score});C.game.phase8?.characters?.award?.('ada',e.program.score>=85?14:8,`${e.program.name} leadership`);C.game.phase15?.director?.card?.('🧭','Leadership program complete',`${e.program.name} · ${e.program.score}/100`);C.game.phase15?.director?.flash?.();save()});
    C.events.on('hiring:offer-accepted',e=>{const active=programs.current(),employment=programs.employment();if(active&&employment&&active.companyId!==employment.companyId){active.status='superseded';active.endedAt=new Date().toISOString();programs.data.active=null}save()});
    C.events.on('company:performance-review',save);C.events.on('company:promoted',save);
    if(typeof render==='function'){const prior=render;render=function(){prior();ui.ensure();ui.refresh();const phase=document.getElementById('phaseLabel');if(phase)phase.textContent='Phase 20 · Technical Leadership'}}
    render();C.events.emit('phase20:ready',{evaluator,programs});return true;
  }
  if(!boot())C.events.on('phase19:ready',()=>boot());
})(window.Codeopolis);
