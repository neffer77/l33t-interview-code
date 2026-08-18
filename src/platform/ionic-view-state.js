// Keep the Ionic shell's visual layout synchronized with the legacy Codeopolis tab state.
(() => {
  const root=window.Codeopolis=window.Codeopolis||{};
  const viewFromLegacy = () => document.querySelector('.tabs button.active[data-tab]')?.dataset.tab || 'challenge';

  function ensureShellStyles(){
    const href='phase43-ionic.css';
    const existing=document.querySelector('link[data-codeopolis-ionic-layout],link[href="phase43-ionic.css"],link[href$="/phase43-ionic.css"]');
    if(existing)return existing;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    link.dataset.codeopolisIonicLayout='1';
    document.head.appendChild(link);
    return link;
  }

  function syncRenderer(active){
    if(active==='city'){
      root.ionicShell?.mountLiveCityRenderer?.();
      root.ionicShell?.scheduleCityActivation?.();
    }else{
      root.phaserCity?.setActive?.(false);
    }
  }

  function apply(view){
    ensureShellStyles();
    const shell=document.querySelector('#codeopolisIonicShell');
    if(!shell) return false;
    const active=view || viewFromLegacy();
    shell.dataset.view=active;

    const header=shell.querySelector(':scope > ion-header');
    const content=shell.querySelector(':scope > ion-content');
    if(header) header.translucent=false;
    if(content) content.fullscreen=false;

    shell.querySelectorAll('#codeopolisIonicTabs ion-tab-button[data-tab]').forEach(button=>{
      button.selected=button.dataset.tab===active;
    });
    const title=shell.querySelector('#codeopolisIonicTitle');
    const names={challenge:'Code',learning:'Learn',city:'City',mock:'Interview',stats:'Progress',build:'Build',research:'Research',events:'Events'};
    if(title) title.textContent=names[active] || 'Codeopolis';
    syncRenderer(active);
    return true;
  }

  function loadHomeNav(){
    if(document.querySelector('script[data-codeopolis-home-nav]')) return;
    const script=document.createElement('script');
    script.src='src/platform/ionic-home-nav.js';
    script.defer=true;
    script.dataset.codeopolisHomeNav='1';
    document.body.appendChild(script);
  }

  function boot(){
    ensureShellStyles();
    loadHomeNav();
    let tries=0;
    const timer=setInterval(()=>{
      if(apply() || ++tries>60) clearInterval(timer);
    },100);

    document.addEventListener('click',event=>{
      const ionic=event.target.closest?.('#codeopolisIonicTabs ion-tab-button[data-tab]');
      if(ionic) requestAnimationFrame(()=>apply(ionic.dataset.tab));
      const legacy=event.target.closest?.('.tabs button[data-tab]');
      if(legacy) requestAnimationFrame(()=>apply(legacy.dataset.tab));
    },true);

    const tabs=document.querySelector('.tabs');
    if(tabs) new MutationObserver(()=>apply()).observe(tabs,{subtree:true,attributes:true,attributeFilter:['class']});
  }

  ensureShellStyles();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  root.ensureIonicShellStyles=ensureShellStyles;
})();
