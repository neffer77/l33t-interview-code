(function(C){
  'use strict';
  function start(){
    let tries=0;const timer=setInterval(async()=>{
      tries++;if(C.phaserCity){clearInterval(timer);return}
      const boot=C.get?.('PhaserCivilizationBootstrap'),world=C.game?.world;
      if(boot&&world&&typeof state!=='undefined'){clearInterval(timer);await boot.start(world,state);return}
      if(tries>80)clearInterval(timer);
    },125);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window.Codeopolis);
