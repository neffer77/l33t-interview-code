(function(C){
  'use strict';
  function boot(){
    if(!C.game||!C.game.phase8||C.game.phase9)return false;
    const Evaluator=C.get('ReasoningEvaluator'),Interviewer=C.get('AIInterviewer'),Debugging=C.get('DebuggingSystem'),Design=C.get('SystemDesignSystem'),Behavioral=C.get('BehavioralSystem'),UI=C.get('Phase9UI');
    if(!Evaluator||!Interviewer||!Debugging||!Design||!Behavioral||!UI){console.error('Phase 9 modules failed to load');return false}
    const characters=C.game.phase8.characters,evaluator=new Evaluator(),interviewer=new Interviewer(state,evaluator,characters),debugging=new Debugging(state,characters),design=new Design(state,characters),behavioral=new Behavioral(state,characters),ui=new UI(C.game,interviewer,debugging,design,behavioral);
    C.game.phase9={evaluator,interviewer,debugging,design,behavioral,ui,startedAt:Date.now()};

    if(typeof render==='function'){
      const legacyRender=render;
      render=function(){legacyRender();ui.ensureEngineeringTab();ui.refresh();const phase=document.getElementById('phaseLabel');if(phase)phase.textContent='Phase 9 · Engineering Simulator'};
    }

    C.events.on('learning:mastered',e=>{
      debugging.onMastered(e);
      interviewer.onMastered(e);
      persist(false);ui.refresh();
    });
    C.events.on('interviewer:evaluated',()=>{persist(false);ui.refresh()});
    C.events.on('interviewer:finished',()=>{persist(false);ui.refresh()});
    C.events.on('debugging:resolved',()=>{persist(false);render()});
    C.events.on('design:finished',()=>{persist(false);render()});

    persist(false);render();C.events.emit('phase9:ready',{interviewer,debugging,design,behavioral});return true;
  }
  if(!boot())C.events.on('phase8:ready',()=>boot());
})(window.Codeopolis);
