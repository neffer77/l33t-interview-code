(function(C){
  'use strict';
  const status=C.GameBootstrapStatus=C.GameBootstrapStatus||{attempts:0,ready:false,error:null,waitingFor:[],startedAt:Date.now()};
  let retryTimer=null,starting=false;
  function resolveState(){try{if(typeof state!=='undefined')return state}catch{}return C.game?.state||window.state||null}
  function modules(){return{World:C.get('WorldSystem'),Camera:C.get('IsoCamera'),Simulation:C.get('CitySimulation'),Renderer:C.get('CityRenderer'),Audio:C.get('AudioSystem'),Rewards:C.get('RewardEngine'),UI:C.get('GameUI')}}
  function schedule(){if(C.game||retryTimer)return;retryTimer=setTimeout(()=>{retryTimer=null;boot()},125)}
  function boot(){
    if(C.game||starting)return !!C.game;status.attempts++;
    const canvas=document.getElementById('cityCanvas'),gameState=resolveState(),M=modules(),missing=Object.entries(M).filter(([,v])=>!v).map(([k])=>k);status.waitingFor=[];if(!canvas)status.waitingFor.push('cityCanvas');if(!gameState)status.waitingFor.push('state');status.waitingFor.push(...missing);
    if(status.waitingFor.length){if(status.attempts<480)schedule();else{status.error=`Phase 6 bootstrap timed out waiting for ${status.waitingFor.join(', ')}`;console.error(status.error)}return false}
    starting=true;
    try{
      if(!window.state)try{window.state=gameState}catch{}
      const world=new M.World(gameState),camera=new M.Camera(canvas,world.world.camera),simulation=new M.Simulation(world,gameState),audio=new M.Audio(world),renderer=new M.Renderer(canvas,world,camera,simulation,gameState),rewards=new M.Rewards(gameState,world,audio),ui=new M.UI(world,camera,renderer,audio,rewards);
      C.game={state:gameState,world,camera,simulation,audio,renderer,rewards,ui,startedAt:Date.now(),requestDraw:()=>renderer.requestDraw()};
      if(typeof renderCityCanvas==='function')renderCityCanvas=function(){renderer.requestDraw()};
      if(typeof render==='function'&&!render.__phase6Wrapped){const legacyRender=render;render=function(){legacyRender();ui.refresh();renderer.requestDraw();const phase=document.getElementById('phaseLabel');if(phase)phase.textContent='Phase 6 · Living Codeopolis'};render.__phase6Wrapped=true}
      if(typeof submitCode==='function'&&!submitCode.__phase6Wrapped){const legacySubmit=submitCode;submitCode=async function(){const challenge=typeof current==='function'?current():null;if(!challenge)return legacySubmit.apply(this,arguments);const before=rewards.snapshot(challenge),result=await legacySubmit.apply(this,arguments),event=rewards.resolve(before,challenge);if(event){persist(false);render()}return result};submitCode.__phase6Wrapped=true}
      if(typeof buyBuilding==='function'&&!buyBuilding.__phase6Wrapped){const legacyBuy=buyBuilding;buyBuilding=function(id){const before=(gameState.buildings||[]).length,result=legacyBuy.apply(this,arguments);if((gameState.buildings||[]).length>before){world.setTool('building',id);persist(false);if(typeof switchTab==='function')switchTab('city');ui.refresh();ui.toast(`${world.buildingDef(id)?.icon||'🏗️'} Purchased. Choose its location on the city map.`)}return result};buyBuilding.__phase6Wrapped=true}
      if(typeof answerRecall==='function'&&!answerRecall.__phase6Wrapped){const legacyRecall=answerRecall;answerRecall=function(){const before=gameState.learning?.recallCorrect||0,result=legacyRecall.apply(this,arguments);if((gameState.learning?.recallCorrect||0)>before){rewards.recordRecall(true);persist(false);ui.refresh()}return result};answerRecall.__phase6Wrapped=true}
      if(typeof resetGame==='function'&&!resetGame.__phase6Wrapped){const legacyReset=resetGame;resetGame=function(){const oldState=resolveState(),result=legacyReset.apply(this,arguments);if(resolveState()!==oldState)location.reload();return result};resetGame.__phase6Wrapped=true}
      setInterval(()=>{try{persist(false)}catch{}},30000);
      let last=performance.now();function frame(now){const dt=Math.max(0,(now-last)/1000);last=now;if(!document.hidden)simulation.update(dt);renderer.render(now);requestAnimationFrame(frame)}requestAnimationFrame(frame);
      C.events.on('learning:mastered',e=>{const target=world.districtTile(e.challenge.district);if(target)renderer.focus(target,800)});C.events.on('world:road-changed',()=>{try{persist(false)}catch{}ui.refresh()});C.events.on('world:building-unplaced',()=>{try{persist(false)}catch{}ui.refresh()});window.addEventListener('resize',()=>renderer.requestDraw());
      world.resetCamera();if(typeof render==='function')render();status.ready=true;status.error=null;status.waitingFor=[];status.readyAt=Date.now();C.events.emit('phase6:ready',{version:C.version,attempts:status.attempts});return true
    }catch(err){status.error=String(err?.stack||err);console.error('Phase 6 bootstrap failed',err);C.events?.emit?.('phase6:error',{error:status.error});if(status.attempts<480)schedule();return false}finally{starting=false}
  }
  C.GameBootstrap={boot,status,resolveState,modules};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();setTimeout(boot,0);
})(window.Codeopolis);
