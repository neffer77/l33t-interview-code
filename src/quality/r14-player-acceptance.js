(function(C){
  'use strict';
  const VERSION=8;
  const VIEWPORTS=Object.freeze({
    phone_portrait:{width:390,height:844,label:'Phone portrait'},
    phone_landscape:{width:844,height:390,label:'Phone landscape'},
    tablet:{width:834,height:1112,label:'Tablet'},
    desktop:{width:1440,height:1000,label:'Desktop'},
    wide_desktop:{width:1920,height:1080,label:'Wide desktop'}
  });
  const NEUTRAL_CARD_SELECTOR='#phaserCityHost>.p1-guide:not(.hidden),#phaserCityHost>.p3-city-nav,#phaserCityHost>.phase44-transfer-generalization,#phaserCityHost>.phase44-learning-objectives,#phaserCityHost>.phase44-interleaving,#phaserCityHost>.phase44-ages,#phaserCityHost>.phase44-p2-integration-panel,#phaserCityHost>.p6-civ-status';
  function viewportSize(){const vv=window.visualViewport,w=Math.round(vv?.width||document.documentElement.clientWidth||window.innerWidth||0),h=Math.round(vv?.height||document.documentElement.clientHeight||window.innerHeight||0);return{width:w,height:h}}
  function modeFor(w,h){const v=viewportSize();w=Number.isFinite(w)?w:v.width;h=Number.isFinite(h)?h:v.height;if(w<=480&&h>=w)return'phone_portrait';if(h<=480&&w>h)return'phone_landscape';if(w<1100)return'tablet';if(w<1700)return'desktop';return'wide_desktop'}
  function visible(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>1&&r.height>1}
  function rect(el){if(!el)return null;const r=el.getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height),right:Math.round(r.right),bottom:Math.round(r.bottom)}}
  function state(){return C.game?.state||window.state||null}
  function world(){return C.game?.world||null}
  function firstRun(){const s=state(),w=world();return!!s?.r4Construction?.manualStart&&(w?.placedBuildings?.().length||0)===0&&['earn','solve','build'].includes(s.r4Construction.stage)}
  function cityViewportHealthy(hostRect,vp,mode){if(!hostRect)return false;if(mode==='phone_landscape')return hostRect.width>=vp.width*.9&&hostRect.height>=vp.height*.6;return hostRect.width>=vp.width*.85&&hostRect.height>=vp.height*.7}
  function installCss(){if(document.getElementById('r14CleanAcceptanceStyle'))return;const st=document.createElement('style');st.id='r14CleanAcceptanceStyle';st.textContent=`
    .phaser-city-host{position:relative;isolation:isolate;overscroll-behavior:contain;max-width:100%}
    .phaser-city-host>.p1-guide,.phaser-city-host>.p1-guide-reopen,.phaser-city-host>.p3-city-nav,.phaser-city-host>.phase44-transfer-generalization,.phaser-city-host>.phase44-learning-objectives,.phaser-city-host>.phase44-interleaving,.phaser-city-host>.phase44-ages,.phaser-city-host>.phase44-p2-integration-panel,.phaser-city-host>.p6-civ-status{display:none!important}
    .phaser-city-host>.r12-custom-fab,.phaser-city-host>.r13-campaign-fab,.phaser-city-host>.p1-build-fab{z-index:120!important}
    .phaser-city-host.r14-empty-land > :not(canvas){display:none!important}
    .phaser-city-host.r14-build-ready > :not(canvas):not(.p1-catalog){display:none!important}
    .phaser-city-host.r14-build-ready > .p1-catalog.hidden{display:none!important}
    body.r14-first-run-state .codeopolis-mobile-city-peek>.city-summary,body.r14-first-run-state .codeopolis-mobile-city-peek>.section-title{display:none!important}
    .phaser-city-host.r14-first-run [class*="-fab"],.phaser-city-host.r14-first-run [class*="-hud"],.phaser-city-host.r14-first-run .phase44-camera-controls{display:none!important}
    @media(max-width:899px){
      .phaser-city-host{border-radius:0!important}
      body.r14-first-run-state .codeopolis-mobile-city-peek{grid-template-rows:minmax(0,1fr)!important;padding:0!important;border:0!important;background:#08111f!important}
      body.r14-first-run-state .codeopolis-mobile-city-peek>#phaserCityHost{grid-row:1!important;border-radius:0!important;min-height:0!important}
      .r6-population-hud{max-width:calc(100% - 128px);white-space:normal;line-height:1.25}
      .p2-resource-hud{top:8px!important;left:8px!important;right:8px!important;max-width:calc(100% - 16px)!important}
      .p2-resource-chip{font-size:9px!important;padding:3px 5px!important}
      .p1-catalog,.r12-custom-panel,.r13-campaign-panel{max-height:min(74dvh,560px)!important;overscroll-behavior:contain}
      .p1-catalog-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
    @media(max-width:430px){.p1-catalog-grid{grid-template-columns:1fr!important}.r4-start-panel{max-width:calc(100% - 24px)!important}}
    @media(max-height:500px) and (orientation:landscape){
      .phaser-city-host{min-height:280px!important;height:calc(100dvh - 104px)!important}
      .r6-population-hud small{display:none!important}
      .r13-campaign-fab{bottom:58px!important}
      .p1-catalog,.r12-custom-panel,.r13-campaign-panel{max-height:88%!important}
    }
  `;document.head.appendChild(st)}
  function closeCompetingPanel(kind){const p=C.phaserCity||{};if(kind!=='campaign'&&p.campaign){p.campaign.open=false;p.campaign.panel?.classList?.remove('show')}if(kind!=='customization'&&p.customization){if(p.customization.active?.())p.customization.stop?.();else{p.customization.open=false;p.customization.panel?.classList?.remove('show')}}if(kind!=='catalog')p.catalog?.close?.();if(kind!=='manager')p.manager?.close?.()}
  function installPanelExclusivity(){if(installPanelExclusivity.done)return;installPanelExclusivity.done=true;document.addEventListener('click',e=>{if(e.target.closest?.('.r13-campaign-fab'))closeCompetingPanel('campaign');else if(e.target.closest?.('.r12-custom-fab'))closeCompetingPanel('customization');else if(e.target.closest?.('.p1-build-fab'))closeCompetingPanel('catalog')},true)}
  function settleRenderer(){const host=C.phaserCity?.host;if(!host||currentView()!=='city')return;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(host.clientWidth>1&&host.clientHeight>1){C.phaserCity?.resize?.();C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity')?.refresh?.()}}))}
  function sync(){installCss();installPanelExclusivity();const mode=modeFor(),s=state(),fresh=firstRun(),stage=s?.r4Construction?.stage||null;document.documentElement.dataset.r14Mode=mode;document.body?.classList.toggle('r14-first-run-state',fresh);document.body?.classList.toggle('r14-build-ready-state',fresh&&stage==='build');const host=C.phaserCity?.host;if(host){host.classList.toggle('r14-first-run',fresh);host.classList.toggle('r14-empty-land',fresh&&stage!=='build');host.classList.toggle('r14-build-ready',fresh&&stage==='build');settleRenderer()}return mode}
  function keyControls(){return[...document.querySelectorAll('.p1-build-fab,.r12-custom-fab,.r13-campaign-fab,.phase44-camera-controls button')].filter(visible).map(el=>({selector:el.className||el.tagName,text:(el.textContent||'').trim().slice(0,40),rect:rect(el)}))}
  function audit(){sync();const host=C.phaserCity?.host,legacy=document.getElementById('cityCanvas'),scene=C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity'),s=state(),w=world(),issues=[],hostRect=rect(host),vp=viewportSize(),mode=modeFor(vp.width,vp.height),overflowX=Math.max(0,document.documentElement.scrollWidth-vp.width),legacyVisible=visible(legacy),phaserReady=!!C.phaserCity?.game&&!!scene?.sys?.isActive?.();if(!phaserReady)issues.push('Phaser city renderer is not active');if(legacyVisible)issues.push('Legacy Canvas2D renderer is visible');if(overflowX>4)issues.push(`Document overflows viewport by ${overflowX}px`);if(!cityViewportHealthy(hostRect,vp,mode))issues.push(`City does not own enough of ${mode} viewport (${hostRect?.width||0}x${hostRect?.height||0} of ${vp.width}x${vp.height})`);for(const c of keyControls()){if(c.rect.width<38||c.rect.height<38)issues.push(`Touch target too small: ${c.text||c.selector}`);if(hostRect&&(c.rect.left<hostRect.x-2||c.rect.right>hostRect.right+2||c.rect.top<hostRect.y-2||c.rect.bottom>hostRect.bottom+2))issues.push(`Control clipped outside city host: ${c.text||c.selector}`)}const fresh=firstRun(),startPanel=document.querySelector('.r4-start-panel');if(fresh&&!visible(startPanel)&&currentView()==='city')issues.push('Empty-land onboarding panel is not visible');const legacyCards=[...document.querySelectorAll(NEUTRAL_CARD_SELECTOR)].filter(visible),externalCityPanels=currentView()==='city'?[...document.querySelectorAll('#phase29InterviewDay,#phase30Remediation')].filter(visible):[];if(legacyCards.length)issues.push(`Persistent dashboard cards cover the city (${legacyCards.length})`);if(externalCityPanels.length)issues.push(`Non-city panels consume City viewport (${externalCityPanels.length})`);const economyText=document.querySelector('.r9ef')?.textContent||'';if(economyText.includes('[object Object]'))issues.push('Economy status renders an object instead of a numeric warning count');return{version:VERSION,mode,viewport:{width:vp.width,height:vp.height,dpr:devicePixelRatio||1},renderer:phaserReady?'phaser':legacyVisible?'legacy':'missing',phaserReady,legacyVisible,host:hostRect,overflowX,firstRun:fresh,manualStart:!!s?.r4Construction?.manualStart,stage:s?.r4Construction?.stage||null,placed:w?.placedBuildings?.().length||0,roads:w?.roadTiles?.().length||0,controls:keyControls(),legacyCards:legacyCards.length,externalCityPanels:externalCityPanels.length,economyText,issues,pass:issues.length===0}}
  function currentView(){return document.querySelector('#codeopolisIonicShell')?.dataset?.view||document.querySelector('.tabs button.active[data-tab]')?.dataset?.tab||'city'}
  function install(){if(install.done)return true;install.done=true;sync();addEventListener('resize',sync,{passive:true});window.visualViewport?.addEventListener?.('resize',sync,{passive:true});addEventListener('orientationchange',()=>setTimeout(sync,100),{passive:true});for(const evt of['civilization:phaser-ready','civilization:phaser-fallback','world:building-placed','world:building-unplaced','world:expanded','learning:resource-earned','r4:empty-land-ready','r4:first-resource-earned','campaign:ready'])C.events?.on?.(evt,()=>setTimeout(sync,0));C.events?.emit?.('r14:player-acceptance-ready',{version:VERSION,viewports:VIEWPORTS});return true}
  C.R14PlayerAcceptance={VERSION,VIEWPORTS,NEUTRAL_CARD_SELECTOR,viewportSize,modeFor,visible,rect,firstRun,cityViewportHealthy,sync,audit,closeCompetingPanel,settleRenderer,install};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window.Codeopolis=window.Codeopolis||{});
