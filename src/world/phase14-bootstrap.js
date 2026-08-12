(function(C){
  'use strict';
  function boot(){
    if(!C.game?.phase13||C.game.phase14)return false;
    const World=C.get('LivingWorld'),Generator=C.get('MissionGenerator'),Campaigns=C.get('CampaignSystem'),WorldEvents=C.get('WorldEventSystem'),UI=C.get('Phase14UI');
    if(!World||!Generator||!Campaigns||!WorldEvents||!UI)return false;
    const economy=C.game.phase12.economy,rivals=C.game.phase13.rivals;
    const world=new World(state,rivals),generator=new Generator(state,economy),campaigns=new Campaigns(state,economy,world,generator),events=new WorldEvents(state,economy,world,generator),ui=new UI(C.game,world,campaigns,events);
    C.game.phase14={world,generator,campaigns,events,ui,startedAt:Date.now()};
    const priorMods=economy.modifiers.bind(economy);
    economy.modifiers=function(){const m=priorMods(),ids=Object.values(campaigns.data.choices||{}).map(x=>x.id);for(const id of ids){if(['centralize','bigbang','scale','isolate','mesh'].includes(id)){m.research*=1.04;m.money*=.99}else if(['federate','waves','efficient','surgical','rings'].includes(id)){m.research*=1.02;m.money*=1.02}else if(['edge','dual','observe','hybrid'].includes(id)){m.money*=1.04}}return m};
    const refresh=()=>{try{persist(false)}catch{}ui.refresh()};
    const competition=()=>{world.tickCompetition();world.syncReputation()};
    C.events.on('learning:mastered',e=>{campaigns.onMastered(e);events.onMastered(e);events.maybe();competition();refresh()});
    C.events.on('incident:completed',e=>{campaigns.onIncident(e);events.maybe();competition();refresh()});
    C.events.on('design:finished',e=>{campaigns.onDesign(e);events.maybe();competition();refresh()});
    ['campaign:started','campaign:advanced','campaign:completed','world:event-started','world:event-resolved','world:event-deferred','world:influence','world:year','world:project-completed','world:rival-progress','world:contract-completed','career:path-advanced'].forEach(name=>C.events.on(name,refresh));
    C.events.on('campaign:completed',e=>{state.happiness=Math.min(100,(state.happiness||75)+8);C.events.emit('reward:micro',{label:`${e.campaign.icon} World campaign complete: ${e.campaign.name}`})});
    C.events.on('world:event-resolved',e=>C.events.emit('reward:micro',{label:`${e.event.icon} World event resolved`}));
    if(typeof render==='function'){const prior=render;render=function(){prior();ui.ensureTab();ui.refresh();const phase=document.getElementById('phaseLabel');if(phase)phase.textContent=`Phase 14 · Living World · Year ${world.data.year}`}}
    world.syncReputation();if(!world.data.history.some(h=>h.kind==='milestone'&&h.text.includes('competitive engineering world')))world.log('Codeopolis entered the competitive engineering world.','milestone');persist(false);render();C.events.emit('phase14:ready',{world,campaigns,events});return true;
  }
  if(!boot())C.events.on('phase13:ready',()=>boot());
})(window.Codeopolis);