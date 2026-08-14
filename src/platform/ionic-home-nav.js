// Persistent mobile Home / Code navigation for the Ionic shell and routed workspaces.
(() => {
  const root = window.Codeopolis = window.Codeopolis || {};

  function goHome(){
    try { root.phase43SingleWindow?.showCore?.(); } catch(_) {}
    if (typeof window.switchTab === 'function') window.switchTab('challenge');
    else document.querySelector('.tabs button[data-tab="challenge"]')?.click();

    const shell=document.querySelector('#codeopolisIonicShell');
    if(shell) shell.dataset.view='challenge';
    const title=document.querySelector('#codeopolisIonicTitle');
    if(title) title.textContent='Code';
    document.querySelectorAll('#codeopolisIonicTabs ion-tab-button[data-tab]').forEach(b=>{ b.selected=b.dataset.tab==='challenge'; });

    const content=document.querySelector('#codeopolisIonicContent');
    content?.scrollToTop?.(180);
    document.querySelector('#challengeTab')?.scrollTo?.({top:0,behavior:'smooth'});
  }

  function installHeaderButton(){
    const toolbar=document.querySelector('#codeopolisIonicShell ion-header ion-toolbar');
    if(!toolbar || toolbar.querySelector('[data-codeopolis-home]')) return false;
    const buttons=document.createElement('ion-buttons');
    buttons.slot='start';
    const home=document.createElement('ion-button');
    home.dataset.codeopolisHome='1';
    home.setAttribute('aria-label','Return to coding challenge');
    home.innerHTML='<ion-icon slot="start" name="home-outline"></ion-icon><span class="codeopolis-home-label">Code</span>';
    home.addEventListener('click',goHome);
    buttons.appendChild(home);
    toolbar.insertBefore(buttons,toolbar.firstChild);
    return true;
  }

  function installWorkspaceButton(){
    document.querySelectorAll('.phase43-workspace-head').forEach(head=>{
      if(head.querySelector('[data-codeopolis-workspace-home]')) return;
      const home=document.createElement('button');
      home.type='button'; home.className='btn phase43-workspace-home';
      home.dataset.codeopolisWorkspaceHome='1'; home.textContent='⌂ Code';
      home.addEventListener('click',goHome);
      const back=head.querySelector('[data-workspace-back]');
      if(back) back.insertAdjacentElement('afterend',home); else head.prepend(home);
    });
  }

  function boot(){
    let tries=0;
    const timer=setInterval(()=>{
      installHeaderButton(); installWorkspaceButton();
      if(document.querySelector('#codeopolisIonicShell') || ++tries>50) clearInterval(timer);
    },100);
    new MutationObserver(()=>{installHeaderButton();installWorkspaceButton();}).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  root.goHomeToChallenge=goHome;
})();
