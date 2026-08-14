// Keep the Ionic shell's visual layout synchronized with the legacy Codeopolis tab state.
(() => {
  const viewFromLegacy = () => document.querySelector('.tabs button.active[data-tab]')?.dataset.tab || 'challenge';

  function apply(view){
    const shell=document.querySelector('#codeopolisIonicShell');
    if(!shell) return false;
    shell.dataset.view=view || viewFromLegacy();
    return true;
  }

  function boot(){
    let tries=0;
    const timer=setInterval(()=>{
      if(apply() || ++tries>40) clearInterval(timer);
    },100);

    document.addEventListener('click',event=>{
      const ionic=event.target.closest?.('#codeopolisIonicTabs ion-tab-button[data-tab]');
      if(ionic) apply(ionic.dataset.tab);
      const legacy=event.target.closest?.('.tabs button[data-tab]');
      if(legacy) apply(legacy.dataset.tab);
    },true);

    const tabs=document.querySelector('.tabs');
    if(tabs) new MutationObserver(()=>apply()).observe(tabs,{subtree:true,attributes:true,attributeFilter:['class']});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
