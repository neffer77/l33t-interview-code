// R14 live reframe resilience — keep the active Code/City surface stable while the same browser session crosses responsive breakpoints.
(() => {
  'use strict';
  const C=window.Codeopolis=window.Codeopolis||{};
  const MOBILE=matchMedia('(max-width: 899px)');
  const SHELL_URL='src/platform/ionic-shell.js';
  const VIEW_URL='src/platform/ionic-view-state.js';
  let generation=0;
  let scheduled=0;
  let lastMode=null;

  function loadScript(src,flag,ready){
    return new Promise((resolve,reject)=>{
      if(ready())return resolve();
      const existing=document.querySelector(`script[data-${flag}="1"]`);
      if(existing){
        if(ready())return resolve();
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=src;
      script.dataset[flag.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1';
      script.onload=resolve;
      script.onerror=reject;
      document.body.appendChild(script);
    });
  }

  function mode(){return MOBILE.matches?'mobile':'desktop'}
  function shellMounted(){return !!document.querySelector('#codeopolisIonicShell')}

  async function enterMobile(token){
    try{
      await loadScript(SHELL_URL,'r14-reframe-shell',()=>!!C.ionicShell);
      if(token!==generation||!MOBILE.matches)return;
      C.ionicShell?.build?.();
      await loadScript(VIEW_URL,'r14-reframe-view',()=>!!C.ensureIonicShellStyles);
      if(token!==generation||!MOBILE.matches)return;
      C.ionicShell?.sync?.();
      C.R14PlayerAcceptance?.sync?.();
      C.Phase44Lifecycle?.syncLifecycle?.();
    }catch(error){console.error('Codeopolis live reframe mobile transition failed',error)}
  }

  function enterDesktop(){
    C.ionicShell?.teardown?.();
    C.Phase44Lifecycle?.syncLifecycle?.();
    C.R14PlayerAcceptance?.sync?.();
  }

  function reconcile(force=false){
    const next=mode(),mounted=shellMounted();
    if(!force&&next===lastMode&&((next==='mobile'&&mounted)||(next==='desktop'&&!mounted)))return;
    lastMode=next;
    const token=++generation;
    document.documentElement.dataset.codeopolisShellMode=next;
    if(next==='mobile')enterMobile(token);
    else enterDesktop();
  }

  function schedule(force=false){
    cancelAnimationFrame(scheduled);
    scheduled=requestAnimationFrame(()=>requestAnimationFrame(()=>reconcile(force)));
  }

  function bind(){
    if(bind.done)return;
    bind.done=true;
    MOBILE.addEventListener?.('change',()=>schedule(true));
    window.addEventListener('resize',()=>schedule(false),{passive:true});
    window.visualViewport?.addEventListener?.('resize',()=>schedule(false),{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(()=>schedule(true),80),{passive:true});
  }

  function install(){bind();schedule(true)}
  C.LiveReframe={MOBILE,mode,reconcile,schedule,shellMounted,install};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
