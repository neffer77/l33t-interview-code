// Keep the Ionic shell's visual layout synchronized with the legacy Codeopolis tab state.
(() => {
  const viewFromLegacy = () => document.querySelector('.tabs button.active[data-tab]')?.dataset.tab || 'challenge';

  function apply(view){
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
    return true;
  }

  function boot(){
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

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
