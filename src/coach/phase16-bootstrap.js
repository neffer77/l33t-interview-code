(function(C){
  'use strict';
  function boot(){
    if(!C.game?.phase15||C.game.phase16)return false;
    const Readiness=C.get('ReadinessModel'),Planner=C.get('CurriculumPlanner'),Director=C.get('InterviewDirector'),UI=C.get('Phase16UI');if(!Readiness||!Planner||!Director||!UI)return false;
    const economy=C.game.phase12.economy,readiness=new Readiness(state,economy,C.game),planner=new Planner(state,economy,readiness,C.game),director=new Director(state,readiness,C.game),ui=new UI(C.game,readiness,planner,director);
    state.readinessHistory=state.readinessHistory||[];C.game.phase16={readiness,planner,director,ui,startedAt:Date.now()};
    const record=(reason)=>{const s=readiness.snapshot(),last=state.readinessHistory[0];if(!last||last.score!==s.score||reason==='boot'){state.readinessHistory.unshift({score:s.score,confidence:s.confidence,reason,at:s.at});state.readinessHistory=state.readinessHistory.slice(0,80)}C.game.phase11?.telemetry?.track?.('readiness',{score:s.score,confidence:s.confidence,reason});return s};
    const save=()=>{try{persist(false)}catch{}ui.refresh()};
    planner.generate(planner.data.goalMinutes,false);record('boot');
    C.events.on('learning:mastered',e=>{planner.onMastered(e);record('mastery');save()});
    C.events.on('interviewer:finished',e=>{planner.onInterviewer(e);record('reasoning');save()});
    C.events.on('debugging:resolved',e=>{planner.onDebug(e);record('debugging');save()});
    C.events.on('design:finished',e=>{planner.onDesign(e);record('system-design');save()});
    ['incident:completed','mock:completed','career:path-advanced','campaign:completed'].forEach(name=>C.events.on(name,()=>{record(name);save()}));
    C.events.on('curriculum:task-completed',e=>{C.game.phase11?.telemetry?.track?.('curriculum-task',{type:e.task.type});C.events.emit('reward:micro',{label:`🎯 Coach task complete: ${e.task.title}`})});
    if(typeof render==='function'){const prior=render;render=function(){prior();ui.ensure();ui.refresh();const phase=document.getElementById('phaseLabel');if(phase)phase.textContent=`Phase 16 · Coach ${readiness.score()}/100`}}
    render();C.events.emit('phase16:ready',{readiness,planner,director});return true;
  }
  if(!boot())C.events.on('phase15:ready',()=>boot());
})(window.Codeopolis);
