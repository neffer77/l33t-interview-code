(function(C){
  'use strict';
  const CAMERA_URL='src/civilization/phaser/mobile-camera-controller.js',AGE_URL='src/progression/age-progression.js';
  function activeView(){return document.querySelector('#codeopolisIonicShell')?.dataset.view||document.querySelector('.tabs button.active[data-tab]')?.dataset.tab||'challenge'}
  function syncLifecycle(){
    const p=C.phaserCity;if(!p)return;const active=activeView()==='city';p.setActive?.(active);p.host.style.visibility=active?'visible':'hidden';p.host.style.pointerEvents=active?'auto':'none';if(active)requestAnimationFrame(()=>C.get?.('Phase44MobileCamera')?.resize?.());
  }
  function watchViews(){
    const shell=document.querySelector('#codeopolisIonicShell');if(shell)new MutationObserver(syncLifecycle).observe(shell,{attributes:true,attributeFilter:['data-view']});
    const tabs=document.querySelector('.tabs');if(tabs)new MutationObserver(syncLifecycle).observe(tabs,{subtree:true,attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab]'))requestAnimationFrame(syncLifecycle)},true);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)C.phaserCity?.setActive?.(false);else syncLifecycle()});
  }
  function loadCamera(){return new Promise((resolve,reject)=>{if(C.get?.('Phase44MobileCamera'))return resolve();const old=document.querySelector(`script[data-phase44-camera="1"]`);if(old){old.addEventListener('load',resolve,{once:true});return}const s=document.createElement('script');s.src=CAMERA_URL;s.dataset.phase44Camera='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
  function loadAge(){return new Promise((resolve,reject)=>{if(C.AgeProgression)return resolve();const old=document.querySelector(`script[data-phase44-age="1"]`);if(old){old.addEventListener('load',resolve,{once:true});return}const s=document.createElement('script');s.src=AGE_URL;s.dataset.phase44Age='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
  async function installExtras(world,state){try{await loadCamera();C.get('Phase44MobileCamera')?.install?.()}catch(e){console.warn('Phase 44 mobile camera unavailable',e)}try{await loadAge();C.AgeProgression?.install?.(state,world)}catch(e){console.warn('Phase 44 age progression unavailable',e)}}
  async function start(){
    watchViews();let tries=0;const timer=setInterval(async()=>{
      tries++;if(C.phaserCity){clearInterval(timer);syncLifecycle();await installExtras(C.game?.world,typeof state!=='undefined'?state:C.game?.state);return}
      const boot=C.get?.('PhaserCivilizationBootstrap'),world=C.game?.world;
      if(boot&&world&&typeof state!=='undefined'){clearInterval(timer);const ok=await boot.start(world,state);if(ok){syncLifecycle();await installExtras(world,state)}return}
      if(tries>80)clearInterval(timer);
    },125);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window.Codeopolis);
