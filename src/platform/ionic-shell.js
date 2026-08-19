// Ionic shell migration: wrap existing vanilla Codeopolis surfaces in an Ionic mobile app shell.
(() => {
  const MOBILE = matchMedia('(max-width: 899px)');
  const root = window.Codeopolis = window.Codeopolis || {};
  const tabs = [
    {key:'challenge', label:'Code', icon:'code-slash-outline'},
    {key:'learning', label:'Learn', icon:'school-outline'},
    {key:'city', label:'City', icon:'business-outline'},
    {key:'mock', label:'Interview', icon:'mic-outline'},
    {key:'stats', label:'Progress', icon:'stats-chart-outline'}
  ];
  const homes=new Map();
  let legacyPrimary=null;
  let sharedBindings=false;
  let rendererObserver=null;
  let rendererEventBound=false;

  function loadIonic(){
    if (!document.querySelector('link[data-codeopolis-ionic]')) {
      const css=document.createElement('link'); css.rel='stylesheet'; css.href='https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css'; css.dataset.codeopolisIonic='1'; document.head.appendChild(css);
    }
    if (!document.querySelector('script[data-codeopolis-ionic]')) {
      const mod=document.createElement('script'); mod.type='module'; mod.src='https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js'; mod.dataset.codeopolisIonic='1'; document.head.appendChild(mod);
      const legacy=document.createElement('script'); legacy.noModule=true; legacy.src='https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js'; legacy.dataset.codeopolisIonic='1'; document.head.appendChild(legacy);
    }
    if (!document.querySelector('script[data-codeopolis-ionicons]')) {
      const icons=document.createElement('script'); icons.type='module'; icons.src='https://cdn.jsdelivr.net/npm/ionicons/dist/ionicons/ionicons.esm.js'; icons.dataset.codeopolisIonicons='1'; document.head.appendChild(icons);
    }
  }

  function activeTab(){ return document.querySelector('.tabs button.active[data-tab]')?.dataset.tab || 'challenge'; }
  function primaryPanel(){return legacyPrimary||document.querySelector('main.app .layout > section.panel')}
  function shellOwns(el){return !!el?.closest?.('#codeopolisIonicShell')}
  function rememberHome(el,parent=null,before=null){
    if(!el||homes.has(el))return;
    const marker=document.createElement('span');
    marker.hidden=true;
    marker.setAttribute('aria-hidden','true');
    marker.dataset.codeopolisIonicAnchor=el.id||el.className||el.tagName;
    const targetParent=parent||(!shellOwns(el)?el.parentNode:null)||primaryPanel();
    if(!targetParent)return;
    const targetBefore=before||(!shellOwns(el)?el:null);
    targetParent.insertBefore(marker,targetBefore||null);
    homes.set(el,marker);
  }
  function ensureRendererHome(el){
    if(!el||homes.has(el))return;
    const primary=primaryPanel();
    if(!primary)return;
    const tabRow=primary.querySelector('.tabs');
    rememberHome(el,primary,tabRow||null);
  }
  function restoreHomes(){
    for(const [el,marker] of homes){
      if(!marker?.isConnected)continue;
      marker.parentNode.insertBefore(el,marker);
    }
  }

  function go(tab){
    if (typeof window.switchTab==='function') window.switchTab(tab);
    else document.querySelector(`.tabs button[data-tab="${tab}"]`)?.click();
    sync();
  }

  function citySurface(){return document.querySelector('#codeopolisIonicShell .codeopolis-mobile-city-peek')}
  function hasGeometry(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.01&&r.width>1&&r.height>1}

  function mountLiveCityRenderer(){
    const city=citySurface();
    if(!city) return false;
    const canvas=document.querySelector('#cityCanvas');
    const host=document.querySelector('#phaserCityHost');
    if(canvas && canvas.parentElement!==city){rememberHome(canvas);city.appendChild(canvas)}
    if(host){ensureRendererHome(host);if(host.parentElement!==city)city.appendChild(host)}
    return !!(host||canvas);
  }

  function activateCityRenderer(){
    const shell=document.querySelector('#codeopolisIonicShell');
    const city=citySurface();
    const host=document.querySelector('#phaserCityHost');
    if(!shell||shell.dataset.view!=='city'||!hasGeometry(city)||!hasGeometry(host))return false;
    root.phaserCity?.setActive?.(true);
    root.phaserCity?.resize?.();
    return true;
  }

  function scheduleCityActivation(){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      mountLiveCityRenderer();
      if(!activateCityRenderer())setTimeout(()=>{mountLiveCityRenderer();activateCityRenderer()},80);
    }));
  }

  function sync(){
    const tab=activeTab();
    document.querySelectorAll('#codeopolisIonicTabs ion-tab-button[data-tab]').forEach(b=>b.selected=b.dataset.tab===tab);
    const title=document.querySelector('#codeopolisIonicTitle');
    const match=tabs.find(x=>x.key===tab); if(title) title.textContent=match?.label || 'Codeopolis';
    const shell=document.querySelector('#codeopolisIonicShell');
    if(shell) shell.dataset.view=tab;
    if(shell)mountLiveCityRenderer();
    if(shell&&tab==='city')scheduleCityActivation();
    else if(shell)root.phaserCity?.setActive?.(false);
  }

  async function openMore(){
    const existing=document.querySelector('#codeopolisIonicMore'); if(existing){existing.present?.();return;}
    const modal=document.createElement('ion-modal'); modal.id='codeopolisIonicMore'; modal.initialBreakpoint=.58; modal.breakpoints=[0,.58,.9];
    const page=document.createElement('div'); page.className='ionic-more-page';
    page.innerHTML='<ion-header><ion-toolbar><ion-title>More</ion-title><ion-buttons slot="end"><ion-button data-close-more>Done</ion-button></ion-buttons></ion-toolbar></ion-header><ion-content class="ion-padding"><ion-list id="codeopolisMoreList"></ion-list></ion-content>';
    const list=page.querySelector('#codeopolisMoreList');
    const secondary=[['build','Build','construct-outline'],['research','Research','flask-outline'],['events','Events','dice-outline']];
    secondary.forEach(([key,label,icon])=>{ const item=document.createElement('ion-item'); item.button=true; item.innerHTML=`<ion-icon slot="start" name="${icon}"></ion-icon><ion-label>${label}</ion-label>`; item.onclick=()=>{go(key);modal.dismiss();}; list.appendChild(item); });
    [['ai','AI Character Studio','people-outline'],['projects','Engineering Projects','hammer-outline'],['repo','Repository Lab','git-branch-outline']].forEach(([key,label,icon])=>{const item=document.createElement('ion-item');item.button=true;item.innerHTML=`<ion-icon slot="start" name="${icon}"></ion-icon><ion-label>${label}</ion-label>`;item.onclick=()=>{root.phase43SingleWindow?.openRoute?.(key);modal.dismiss();};list.appendChild(item);});
    modal.appendChild(page); document.body.appendChild(modal); page.querySelector('[data-close-more]').onclick=()=>modal.dismiss(); await modal.present?.();
  }

  function bindShared(){
    if(sharedBindings)return;
    sharedBindings=true;
    document.addEventListener('click',e=>{if(e.target.closest?.('.tabs button[data-tab]'))setTimeout(sync,0);});
    rendererObserver=new MutationObserver(()=>{if(document.querySelector('#codeopolisIonicShell'))mountLiveCityRenderer()});
    rendererObserver.observe(document.body,{childList:true,subtree:true});
    if(!rendererEventBound){rendererEventBound=true;root.events?.on?.('civilization:phaser-ready',()=>{if(!document.querySelector('#codeopolisIonicShell'))return;mountLiveCityRenderer();if(activeTab()==='city')scheduleCityActivation()})}
  }

  function build(){
    if (!MOBILE.matches || document.querySelector('#codeopolisIonicShell')) return false;
    const app=document.querySelector('main.app'); const layout=document.querySelector('.layout'); const primary=layout?.querySelector(':scope > section.panel');
    if(!app||!primary)return false;
    legacyPrimary=primary;
    loadIonic();
    document.body.classList.add('codeopolis-ionic-mobile');

    const shell=document.createElement('ion-app'); shell.id='codeopolisIonicShell';
    const header=document.createElement('ion-header'); header.translucent=true; header.innerHTML='<ion-toolbar><ion-title id="codeopolisIonicTitle">Code</ion-title><ion-buttons slot="end"><ion-button id="codeopolisMoreButton" aria-label="More"><ion-icon slot="icon-only" name="ellipsis-horizontal"></ion-icon></ion-button></ion-buttons></ion-toolbar>';
    const content=document.createElement('ion-content'); content.id='codeopolisIonicContent'; content.fullscreen=true;
    const stage=document.createElement('div'); stage.className='codeopolis-ionic-stage';
    const city=document.createElement('section'); city.className='codeopolis-mobile-city-peek';
    const title=primary.querySelector('.section-title'); const canvas=primary.querySelector('#cityCanvas'); const phaserHost=document.querySelector('#phaserCityHost'); const summary=primary.querySelector('.city-summary');
    for(const el of [title,canvas,phaserHost,summary])if(el)rememberHome(el);
    if(title) city.appendChild(title); if(canvas) city.appendChild(canvas); if(phaserHost){ensureRendererHome(phaserHost);city.appendChild(phaserHost)} if(summary) city.appendChild(summary);
    const work=document.createElement('section'); work.className='codeopolis-mobile-workspace';
    ['challengeTab','learningTab','mockTab','cityTab','buildTab','researchTab','eventsTab','statsTab'].forEach(id=>{const el=document.getElementById(id);if(el){rememberHome(el);work.appendChild(el)}});
    stage.append(city,work); content.appendChild(stage);
    const footer=document.createElement('ion-footer');
    const bar=document.createElement('ion-tab-bar'); bar.id='codeopolisIonicTabs'; bar.slot='bottom';
    tabs.forEach(t=>{const b=document.createElement('ion-tab-button');b.dataset.tab=t.key;b.innerHTML=`<ion-icon name="${t.icon}"></ion-icon><ion-label>${t.label}</ion-label>`;b.onclick=()=>go(t.key);bar.appendChild(b);});
    const more=document.createElement('ion-tab-button');more.innerHTML='<ion-icon name="ellipsis-horizontal-circle-outline"></ion-icon><ion-label>More</ion-label>';more.onclick=openMore;bar.appendChild(more);footer.appendChild(bar);
    shell.append(header,content,footer); document.body.appendChild(shell);
    app.classList.add('codeopolis-legacy-mounted');
    document.querySelector('#codeopolisMoreButton').onclick=openMore;
    bindShared();
    mountLiveCityRenderer();
    sync();
    root.events?.emit?.('codeopolis:responsive-shell-mounted',{mode:'mobile',view:activeTab()});
    return true;
  }

  function teardown(){
    const shell=document.querySelector('#codeopolisIonicShell');
    const app=document.querySelector('main.app');
    if(!shell){document.body.classList.remove('codeopolis-ionic-mobile');app?.classList.remove('codeopolis-legacy-mounted');return false}
    const view=activeTab();
    root.phaserCity?.setActive?.(false);
    document.querySelector('#codeopolisIonicMore')?.remove();
    restoreHomes();
    shell.remove();
    document.body.classList.remove('codeopolis-ionic-mobile');
    app?.classList.remove('codeopolis-legacy-mounted');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      root.Phase44Lifecycle?.syncLifecycle?.();
      root.R14PlayerAcceptance?.sync?.();
      if(view==='city'){
        root.phaserCity?.setActive?.(true);
        root.phaserCity?.resize?.();
        root.get?.('Phase44MobileCamera')?.resize?.();
      }
    }));
    root.events?.emit?.('codeopolis:responsive-shell-unmounted',{mode:'desktop',view});
    return true;
  }

  function boot(){
    bindShared();
    if(MOBILE.matches){loadIonic();build()}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  root.ionicShell={build,teardown,go,sync,openMore,mountLiveCityRenderer,activateCityRenderer,scheduleCityActivation,hasGeometry,rememberHome,restoreHomes};
})();
