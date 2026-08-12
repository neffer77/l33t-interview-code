(function(C){
  'use strict';
  function boot(){
    if(!C.game?.phase9||C.game.phase10)return false;
    const Adapter=C.get('LLMInterviewerAdapter'),Missions=C.get('MentorMissionSystem'),Incidents=C.get('EngineeringIncidentSystem'),Simulator=C.get('SystemDesignSimulator'),UI=C.get('Phase10UI');
    if(!Adapter||!Missions||!Incidents||!Simulator||!UI){console.error('Phase 10 modules failed to load');return false}
    const p9=C.game.phase9,p8=C.game.phase8,p7=C.game.phase7;
    const llm=new Adapter(p9.evaluator),missions=new Missions(state,p7.economy,p8.characters),incidents=new Incidents(state,p7.economy,p8.characters),sim=new Simulator(state,p9.design,p8.characters);
    const ui=new UI(C.game,llm,missions,incidents,sim);
    C.game.phase10={llm,missions,incidents,sim,ui,startedAt:Date.now()};

    if(typeof render==='function'){
      const prior=render;
      render=function(){prior();ui.refresh();const phase=document.getElementById('phaseLabel');if(phase)phase.textContent='Phase 10 · Intelligent Engineering World'};
    }

    C.events.on('learning:mastered',e=>{
      missions.onMastered(e);incidents.onMastered(e);
      if(!missions.data.active)missions.generate(false);
      persist(false);ui.refresh();
    });
    C.events.on('career:promoted',()=>{missions.generate(true);persist(false);ui.refresh()});
    ['incident:diagnosed','incident:repaired','incident:engineering-reviewed','incident:completed','mission:mentor-generated','mission:mentor-completed','designsim:load','designsim:failure','designsim:finished'].forEach(evt=>C.events.on(evt,()=>{try{persist(false)}catch{}ui.refresh()}));

    // Optional LLM augmentation: Phase 9's deterministic evaluator remains authoritative for offline play.
    C.game.askInterviewerLLM=async function(text){
      const s=p9.interviewer.active?.()||p9.interviewer.session;if(!s)return null;
      const challenge=(typeof CHALLENGES!=='undefined'?CHALLENGES:[]).find(c=>c.id===s.challengeId);if(!challenge)return null;
      const result=await llm.evaluate({challenge,text,history:s.responses||[]});
      C.events.emit('interviewer:llm-evaluated',{challenge,result});return result;
    };

    if(!missions.data.active)missions.generate(false);
    persist(false);render();C.events.emit('phase10:ready',{llm,missions,incidents,sim});return true;
  }
  if(!boot())C.events.on('phase9:ready',()=>boot());
})(window.Codeopolis);
