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
  function go(tab){
    if (typeof window.switchTab==='function') window.switchTab(tab);
    else document.querySelector(`.tabs button[data-tab="${tab}"]`)?.click();
    sync();
  }

  function sync(){
    const tab=activeTab();
    document.querySelectorAll('#codeopolisIonicTabs ion-tab-button[data-tab]').forEach(b=>b.selected=b.dataset.tab===tab);
    const title=document.querySelector('#codeopolisIonicTitle');
    const match=tabs.find(x=>x.key===tab); if(title) title.textContent=match?.label || 'Codeopolis';
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

  function build(){
    if (!MOBILE.matches || document.querySelector('#codeopolisIonicShell')) return;
    const app=document.querySelector('main.app'); const layout=document.querySelector('.layout'); const primary=layout?.querySelector(':scope > section.panel');
    if(!app||!primary)return;
    document.body.classList.add('codeopolis-ionic-mobile');

    const shell=document.createElement('ion-app'); shell.id='codeopolisIonicShell';
    const header=document.createElement('ion-header'); header.translucent=true; header.innerHTML='<ion-toolbar><ion-title id="codeopolisIonicTitle">Code</ion-title><ion-buttons slot="end"><ion-button id="codeopolisMoreButton" aria-label="More"><ion-icon slot="icon-only" name="ellipsis-horizontal"></ion-icon></ion-button></ion-buttons></ion-toolbar>';
    const content=document.createElement('ion-content'); content.id='codeopolisIonicContent'; content.fullscreen=true;
    const stage=document.createElement('div'); stage.className='codeopolis-ionic-stage';
    const city=document.createElement('section'); city.className='codeopolis-mobile-city-peek';
    const title=primary.querySelector('.section-title'); const canvas=primary.querySelector('#cityCanvas'); const summary=primary.querySelector('.city-summary');
    if(title) city.appendChild(title); if(canvas) city.appendChild(canvas); if(summary) city.appendChild(summary);
    const work=document.createElement('section'); work.className='codeopolis-mobile-workspace';
    ['challengeTab','learningTab','mockTab','cityTab','buildTab','researchTab','eventsTab','statsTab'].forEach(id=>{const el=document.getElementById(id);if(el)work.appendChild(el);});
    stage.append(city,work); content.appendChild(stage);
    const footer=document.createElement('ion-footer');
    const bar=document.createElement('ion-tab-bar'); bar.id='codeopolisIonicTabs'; bar.slot='bottom';
    tabs.forEach(t=>{const b=document.createElement('ion-tab-button');b.dataset.tab=t.key;b.innerHTML=`<ion-icon name="${t.icon}"></ion-icon><ion-label>${t.label}</ion-label>`;b.onclick=()=>go(t.key);bar.appendChild(b);});
    const more=document.createElement('ion-tab-button');more.innerHTML='<ion-icon name="ellipsis-horizontal-circle-outline"></ion-icon><ion-label>More</ion-label>';more.onclick=openMore;bar.appendChild(more);footer.appendChild(bar);
    shell.append(header,content,footer); document.body.appendChild(shell);
    app.classList.add('codeopolis-legacy-mounted');
    document.querySelector('#codeopolisMoreButton').onclick=openMore;
    document.addEventListener('click',e=>{if(e.target.closest?.('.tabs button[data-tab]'))setTimeout(sync,0);});
    sync();
  }

  function boot(){ loadIonic(); setTimeout(build,700); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  root.ionicShell={build,go,sync,openMore};
})();
