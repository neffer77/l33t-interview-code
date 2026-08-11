(function(C){
  'use strict';
  function boot(){
    if(!C.game?.phase7||C.game.phase8)return false;
    const Characters=C.get('CharacterSystem'),Recruiting=C.get('RecruitingSystem'),Narrative=C.get('NarrativeSystem'),Encounters=C.get('InterviewEncounterSystem'),Chains=C.get('CrisisChainSystem'),UI=C.get('Phase8UI');
    if(!Characters||!Recruiting||!Narrative||!Encounters||!Chains||!UI){console.error('Phase 8 modules failed to load');return false}
    const characters=new Characters(state),recruiting=new Recruiting(state,C.game.phase7.economy,characters),narrative=new Narrative(state,characters,recruiting),encounters=new Encounters(state,recruiting,characters),chains=new Chains(state,narrative,characters),ui=new UI(C.game,characters,narrative,recruiting,encounters);
    C.game.phase8={characters,recruiting,narrative,encounters,chains,ui,startedAt:Date.now()};

    if(typeof render==='function'){
      const baseRender=render;
      render=function(){baseRender();recruiting.evaluate();narrative.evaluate();ui.refresh();const phase=document.getElementById('phaseLabel');if(phase)phase.textContent='Phase 8 · People & Possibility'};
    }

    C.events.on('learning:mastered',e=>{characters.onMastery(e);narrative.onMastery(e);encounters.onMastered(e);recruiting.evaluate();persist(false);ui.refresh()});
    C.events.on('crisis:triggered',e=>{narrative.onCrisis(e.crisis);persist(false);ui.refresh()});
    C.events.on('crisis:resolved',e=>{characters.onCrisisResolved(e.crisis);chains.onResolved(e);persist(false);ui.refresh()});
    C.events.on('story:recruiter-message',e=>{narrative.onRecruiter(e.company);persist(false);ui.refresh()});
    C.events.on('story:interview-started',()=>{characters.award('marcus',4,'interview preparation');persist(false);ui.refresh()});
    C.events.on('story:interview-finished',()=>{recruiting.evaluate();persist(false);render()});
    C.events.on('story:relationship',()=>{persist(false)});

    recruiting.evaluate();narrative.evaluate();persist(false);render();C.events.emit('phase8:ready',C.game.phase8);return true;
  }
  if(!boot()){C.events.on('phase7:ready',()=>boot())}
})(window.Codeopolis);
