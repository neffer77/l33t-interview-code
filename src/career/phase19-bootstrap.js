(function(C){
  'use strict';
  function boot(){
    if(!C.game?.phase18||C.game.phase19)return false;
    const Team=C.get('CompanyTeam'),Projects=C.get('CompanyProjects'),Performance=C.get('PerformanceReview'),UI=C.get('Phase19UI');if(!Team||!Projects||!Performance||!UI)return false;
    const team=new Team(state,C.game),projects=new Projects(state,C.game,team),performance=new Performance(state,C.game,projects,team),ui=new UI(C.game,team,projects,performance);C.game.phase19={team,projects,performance,ui,startedAt:Date.now()};
    const after=(changed)=>{if(changed){try{persist(false)}catch{}ui.refresh()}};
    C.events.on('learning:mastered',e=>after(projects.onMastered(e)));
    C.events.on('interviewer:finished',e=>after(projects.onReasoning(e)));
    C.events.on('incident:completed',e=>after(projects.onIncident(e)));
    C.events.on('debugging:resolved',e=>after(projects.onDebug(e)));
    C.events.on('design:finished',e=>after(projects.onDesign(e)));
    C.events.on('hiring:offer-accepted',()=>{team.data.lastAdvice=null;try{persist(false)}catch{}ui.refresh()});
    C.events.on('company:project-stage',e=>{C.game.phase11?.telemetry?.track?.('company-project-stage',{companyId:e.project.companyId,type:e.stage.type,score:e.score});C.events.emit('reward:micro',{label:`🏢 ${e.stage.title}: ${e.score}/100`});try{persist(false)}catch{}ui.refresh()});
    C.events.on('company:project-completed',e=>{C.game.phase11?.telemetry?.track?.('company-project',{companyId:e.project.companyId,score:e.project.score,templateId:e.project.templateId});const mentor=C.game.phase8?.characters?.bestForDistrict?.(e.project.focus?.[0]);if(mentor)C.game.phase8.characters.award?.(mentor.id,e.project.score>=85?10:6,`${e.project.name} delivered`);C.game.phase15?.director?.card?.('🏢','Project delivered',`${e.project.name} · ${e.project.score}/100`);try{persist(false)}catch{}ui.refresh()});
    C.events.on('company:performance-review',e=>{C.game.phase11?.telemetry?.track?.('performance-review',{companyId:e.employment.companyId,score:e.review.score,band:e.review.band});try{persist(false)}catch{}ui.refresh()});
    C.events.on('company:promoted',e=>{C.game.phase15?.director?.card?.('📈','Promotion earned',`${e.from} → ${e.to}`);C.game.phase15?.director?.flash?.();C.game.phase11?.telemetry?.track?.('company-promotion',{companyId:e.employment.companyId,from:e.from,to:e.to});try{persist(false)}catch{}ui.refresh()});
    if(typeof render==='function'){const prior=render;render=function(){prior();ui.ensure();ui.refresh();const phase=document.getElementById('phaseLabel');if(phase)phase.textContent='Phase 19 · Company Life'}}
    try{persist(false)}catch{}render();C.events.emit('phase19:ready',{team,projects,performance});return true;
  }
  if(!boot())C.events.on('phase18:ready',()=>boot());
})(window.Codeopolis);
