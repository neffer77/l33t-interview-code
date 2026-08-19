// R14 — persistent primary-tab ownership. Keeps late bootstraps from escaping their tab
// and gives every selected primary tab ownership of the playable workspace.
(() => {
  'use strict';
  const C = window.Codeopolis = window.Codeopolis || {};
  const TABS = ['challenge','learning','mock','city','build','research','events','stats'];
  const PANEL_IDS = Object.freeze({
    challenge:'challengeTab', learning:'learningTab', mock:'mockTab', city:'cityTab',
    build:'buildTab', research:'researchTab', events:'eventsTab', stats:'statsTab'
  });
  const MOCK_SURFACES = ['phase29InterviewDay','phase30Remediation'];
  const SECONDARY = new Set(['learning','mock','build','research','events','stats']);
  let scheduled = false;

  function activeView(){
    return document.querySelector('#codeopolisIonicShell')?.dataset?.view ||
      document.querySelector('.tabs button.active[data-tab]')?.dataset?.tab ||
      document.body?.dataset?.codeopolisView || 'challenge';
  }

  function installStyles(){
    if(document.getElementById('r14TabSurfaceOwnershipStyle')) return;
    const style = document.createElement('style');
    style.id = 'r14TabSurfaceOwnershipStyle';
    style.textContent = `
      #phase29InterviewDay[hidden],#phase30Remediation[hidden],
      #mockTab.hidden>#phase29InterviewDay,#mockTab.hidden>#phase30Remediation{display:none!important}
      @media(min-width:900px){
        body.r14-focused-secondary-workspace main.app{max-width:none!important;width:100%!important;margin:0!important}
        body.r14-focused-secondary-workspace .layout{grid-template-columns:minmax(0,1fr)!important;gap:0!important}
        body.r14-focused-secondary-workspace .layout>.sidebar{display:none!important}
        body.r14-focused-secondary-workspace .layout>section.panel{padding:10px!important}
        body.r14-focused-secondary-workspace .layout>section.panel>.section-title,
        body.r14-focused-secondary-workspace .layout>section.panel>#cityCanvas,
        body.r14-focused-secondary-workspace .layout>section.panel>.city-stage,
        body.r14-focused-secondary-workspace .layout>section.panel>.city-summary{display:none!important}
        body.r14-focused-secondary-workspace .layout>section.panel>.tabs{margin:0 0 6px!important;flex:0 0 auto!important}
        body.r14-focused-secondary-workspace .layout>section.panel>#learningTab,
        body.r14-focused-secondary-workspace .layout>section.panel>#mockTab,
        body.r14-focused-secondary-workspace .layout>section.panel>#buildTab,
        body.r14-focused-secondary-workspace .layout>section.panel>#researchTab,
        body.r14-focused-secondary-workspace .layout>section.panel>#eventsTab,
        body.r14-focused-secondary-workspace .layout>section.panel>#statsTab{min-height:0!important;overflow:auto!important;padding:4px 6px 12px 2px!important}
      }
      @media(max-width:899px){
        body.r14-focused-secondary-workspace .layout>section.panel>.section-title,
        body.r14-focused-secondary-workspace .layout>section.panel>#cityCanvas,
        body.r14-focused-secondary-workspace .layout>section.panel>.city-stage,
        body.r14-focused-secondary-workspace .layout>section.panel>.city-summary{display:none!important}
        body.r14-focused-secondary-workspace .layout>section.panel>.tabs{margin-top:0!important}
      }
    `;
    document.head.appendChild(style);
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
    installStyles();
    const view = activeView();
    if(!TABS.includes(view)) return view;
    document.body?.setAttribute('data-primary-workspace', view);
    document.body?.classList.toggle('r14-focused-secondary-workspace', SECONDARY.has(view));
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
    installStyles();
    sync();
    document.addEventListener('click', e => { if(e.target.closest?.('[data-tab]')) schedule(); }, true);
    const observer = new MutationObserver(mutations => {
      if(mutations.some(m => m.type === 'childList' || (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'data-view')))) schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-view']});
    addEventListener('resize', schedule, {passive:true});
    window.visualViewport?.addEventListener?.('resize', schedule, {passive:true});
    // Legacy phases finish booting asynchronously. Reassert ownership while they settle.
    let passes = 0;
    const timer = setInterval(() => { sync(); if(++passes >= 40) clearInterval(timer); },250);
  }

  C.TabSurfaceOwnership = {TABS,PANEL_IDS,MOCK_SURFACES,activeView,sync,install,installStyles};
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
