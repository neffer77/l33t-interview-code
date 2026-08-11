(function(C){
  'use strict';
  function boot(){
    if(!C.game||C.game.phase7)return false;
    const Economy=C.get('MasteryEconomy'),Discoveries=C.get('DiscoverySystem'),Crises=C.get('CrisisSystem'),Quests=C.get('QuestSystem'),UI=C.get('Phase7UI');
    if(!Economy||!Discoveries||!Crises||!Quests||!UI){console.error('Phase 7 modules failed to load');return false}
    const economy=new Economy(state);economy.installCompat();
    const discoveries=new Discoveries(state,economy,C.game.audio);
    const crises=new Crises(state,economy,C.game.world,C.game.audio);
    const quests=new Quests(state,economy,discoveries);
    const ui=new UI(C.game,economy,discoveries,crises,quests);
    C.game.phase7={economy,discoveries,crises,quests,ui,startedAt:Date.now()};

    if(typeof render==='function'){
      const legacyRender=render;
      render=function(){legacyRender();ui.refresh();const phase=document.getElementById('phaseLabel');if(phase)phase.textContent='Phase 7 · Mastery Civilization'};
    }

    C.events.on('learning:mastered',e=>{
      const resolved=crises.onMastered(e);
      quests.onMastered(e);
      const found=discoveries.evaluate();
      if(!resolved)crises.maybeTrigger(e);
      if(found.length||resolved){persist(false);render()}else{persist(false);ui.refresh()}
    });
    C.events.on('reward:micro',()=>{quests.onRecall();discoveries.evaluate();persist(false);ui.refresh()});
    C.events.on('world:road-changed',()=>{const found=discoveries.evaluate();if(found.length)persist(false);ui.refresh()});
    C.events.on('world:building-placed',()=>{discoveries.evaluate();ui.refresh()});
    C.events.on('strategy:doctrine',()=>{persist(false);render()});
    C.events.on('project:completed',()=>{persist(false);render()});

    // Existing Phase 6 saves receive credit for mastery they already earned. New discoveries
    // are still presented because they represent newly available Phase 7 knowledge fields.
    discoveries.evaluate();
    quests.ensureDaily();persist(false);render();
    setInterval(()=>{quests.ensureDaily();ui.refresh();try{persist(false)}catch{}},60000);
    C.events.emit('phase7:ready',{economy,discoveries,crises,quests});return true;
  }
  if(!boot())C.events.on('phase6:ready',()=>boot());
})(window.Codeopolis);
