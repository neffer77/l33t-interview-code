(function(C){
  'use strict';
  function boot(){
    if(!C.game?.phase16||C.game.phase17)return false;const Rotation=C.get('EndgameRotation'),Gauntlet=C.get('FrontierGauntlet'),UI=C.get('Phase17UI');if(!Rotation||!Gauntlet||!UI)return false;
    const economy=C.game.phase12.economy,readiness=C.game.phase16.readiness,rotation=new Rotation(state,economy,readiness,C.game),gauntlet=new Gauntlet(state,economy,readiness),ui=new UI(C.game,rotation,gauntlet);C.game.phase17={rotation,gauntlet,ui,startedAt:Date.now()};
    const save=()=>{try{persist(false)}catch{}ui.refresh()};
    C.events.on('learning:mastered',e=>{const a=rotation.onMastered(e),b=gauntlet.onMastered(e);if(a||b)save()});
    C.events.on('interviewer:finished',e=>{if(rotation.onInterviewer(e))save()});
    C.events.on('debugging:resolved',e=>{if(rotation.onDebug(e))save()});
    C.events.on('design:finished',e=>{if(rotation.onDesign(e))save()});
    C.events.on('endgame:stage-completed',e=>{C.game.phase11?.telemetry?.track?.('endgame-stage',{key:e.operation.key,type:e.stage.type,score:e.score});C.events.emit('reward:micro',{label:`🏁 Endgame stage complete: ${e.stage.title}`});save()});
    C.events.on('endgame:operation-completed',e=>{C.game.phase11?.telemetry?.track?.('endgame-operation',{key:e.operation.key,score:e.operation.score});C.events.emit('reward:micro',{label:`🏆 ${e.operation.theme.name} complete · ${e.operation.score}/100`});save()});
    C.events.on('endgame:gauntlet-stage',e=>{C.game.phase11?.telemetry?.track?.('gauntlet-stage',{challengeId:e.challenge.id,points:e.points});save()});
    C.events.on('endgame:gauntlet-completed',e=>{C.game.phase11?.telemetry?.track?.('gauntlet-complete',{score:e.run.score,minutes:e.run.elapsedMinutes});C.events.emit('reward:micro',{label:`⚔️ Frontier Gauntlet complete · ${e.run.score}/100`});save()});
    ['endgame:operation-started','endgame:gauntlet-started','endgame:gauntlet-abandoned'].forEach(name=>C.events.on(name,save));
    if(typeof render==='function'){const prior=render;render=function(){prior();rotation.ensureCurrent();ui.ensure();ui.refresh();const phase=document.getElementById('phaseLabel');if(phase)phase.textContent=`Phase 17 · Endgame · ${rotation.currentKey()}`}}
    render();C.events.emit('phase17:ready',{rotation,gauntlet});return true
  }
  if(!boot())C.events.on('phase16:ready',()=>boot());
})(window.Codeopolis);
