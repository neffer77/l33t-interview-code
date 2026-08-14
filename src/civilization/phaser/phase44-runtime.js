(function(C){
  'use strict';
  function activeView(){return document.querySelector('#codeopolisIonicShell')?.dataset.view||document.querySelector('.tabs button.active[data-tab]')?.dataset.tab||'challenge'}
  function syncLifecycle(){
    const p=C.phaserCity;if(!p)return;const active=activeView()==='city';p.setActive?.(active);p.host.style.visibility=active?'visible':'hidden';p.host.style.pointerEvents=active?'auto':'none';
  }
  function watchViews(){
    const shell=document.querySelector('#codeopolisIonicShell');if(shell)new MutationObserver(syncLifecycle).observe(shell,{attributes:true,attributeFilter:['data-view']});
    const tabs=document.querySelector('.tabs');if(tabs)new MutationObserver(syncLifecycle).observe(tabs,{subtree:true,attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab]'))requestAnimationFrame(syncLifecycle)},true);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)C.phaserCity?.setActive?.(false);else syncLifecycle()});
  }
  function start(){
    watchViews();let tries=0;const timer=setInterval(async()=>{
      tries++;if(C.phaserCity){clearInterval(timer);syncLifecycle();return}
      const boot=C.get?.('PhaserCivilizationBootstrap'),world=C.game?.world;
      if(boot&&world&&typeof state!=='undefined'){clearInterval(timer);const ok=await boot.start(world,state);if(ok)syncLifecycle();return}
      if(tries>80)clearInterval(timer);
    },125);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window.Codeopolis);
