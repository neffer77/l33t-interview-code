// R14 — persistent primary-tab ownership. Keeps late bootstraps from escaping their tab.
(() => {
  'use strict';
  const C = window.Codeopolis = window.Codeopolis || {};
  const TABS = ['challenge','learning','mock','city','build','research','events','stats'];
  const PANEL_IDS = Object.freeze({
    challenge:'challengeTab', learning:'learningTab', mock:'mockTab', city:'cityTab',
    build:'buildTab', research:'researchTab', events:'eventsTab', stats:'statsTab'
  });
  const MOCK_SURFACES = ['phase29InterviewDay','phase30Remediation'];
  let scheduled = false;

  function activeView(){
    return document.querySelector('#codeopolisIonicShell')?.dataset?.view ||
      document.querySelector('.tabs button.active[data-tab]')?.dataset?.tab ||
      document.body?.dataset?.codeopolisView || 'challenge';
  }

  function setHidden(el, hidden){
    if(!el) return;
    el.hidden = !!hidden;
    el.classList.toggle('hidden', !!hidden);
    el.setAttribute('aria-hidden', String(!!hidden));
  }

  function ownMockSurfaces(view){
    const host = document.getElementById('mockTab');
    if(!host) return;
    for(const id of MOCK_SURFACES){
      const el = document.getElementById(id);
      if(!el) continue;
      if(el.parentElement !== host) host.appendChild(el);
      el.dataset.tabSurfaceOwner = 'mock';
      setHidden(el, view !== 'mock');
    }
  }

  function ownPrimaryPanels(view){
    for(const key of TABS){
      const el = document.getElementById(PANEL_IDS[key]);
      if(!el) continue;
      const active = key === view;
      setHidden(el, !active);
      el.dataset.tabSurfaceActive = String(active);
    }
  }

  function evictDormantCity(view){
    const host = C.phaserCity?.host || document.getElementById('phaserCityHost');
    if(!host) return;
    if(view !== 'city'){
      host.hidden = true;
      host.style.display = 'none';
      host.style.visibility = 'hidden';
      host.style.pointerEvents = 'none';
      host.setAttribute('aria-hidden','true');
    }
  }

  function sync(){
    scheduled = false;
    const view = activeView();
    if(!TABS.includes(view)) return view;
    document.body?.setAttribute('data-primary-workspace', view);
    document.body?.classList.toggle('r14-focused-secondary-workspace', !['challenge','city'].includes(view));
    ownMockSurfaces(view);
    ownPrimaryPanels(view);
    evictDormantCity(view);
    if(view === 'city') C.Phase44Lifecycle?.syncLifecycle?.();
    return view;
  }

  function schedule(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }

  function install(){
    if(install.done) return;
    install.done = true;
    sync();
    document.addEventListener('click', e => { if(e.target.closest?.('[data-tab]')) schedule(); }, true);
    const observer = new MutationObserver(mutations => {
      if(mutations.some(m => m.type === 'childList' || (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'data-view')))) schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-view']});
    addEventListener('resize', schedule, {passive:true});
    window.visualViewport?.addEventListener?.('resize', schedule, {passive:true});
    // Late legacy bootstraps settle over several seconds. Reassert ownership during that window.
    let passes = 0;
    const timer = setInterval(() => { sync(); if(++passes >= 24) clearInterval(timer); },250);
  }

  C.TabSurfaceOwnership = {TABS,PANEL_IDS,MOCK_SURFACES,activeView,sync,install};
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
