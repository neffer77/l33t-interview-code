(function(C){
  'use strict';
  const ACCEPTANCE_URL='src/quality/r14-player-acceptance.js';
  let responsiveFitTimer=null;
  function scene(){return C.phaserCity?.game?.scene?.getScene('CodeopolisCity')||null}
  function worldBounds(s){const l=s?.layout||s?.iso?.layout?.(s?.snapshot?.width||12,s?.snapshot?.height||8);return{width:Math.max(1,l?.worldWidth||1),height:Math.max(1,l?.worldHeight||1)}}
  function syncBounds(s=scene()){if(!s?.cameras?.main)return false;const b=worldBounds(s);s.cameras.main.setBounds?.(0,0,b.width,b.height,true);return true}
  function pointFor(s,target){if(!target)return null;const b=s.snapshot?.buildings?.find?.(v=>v.x===target.x&&v.y===target.y);return b&&s.iso?.footprintCenter?s.iso.footprintCenter({footprint:b.footprint||{w:1,h:1}},b.x,b.y,s.layout):s.toWorld?.(target.x,target.y)}
  function developedBounds(s=scene()){
    const snap=s?.snapshot,iso=s?.iso;if(!snap||!iso)return null;
    const points=[];let buildingCount=0,roadCount=0;
    const addCell=(x,y)=>{const corners=s.tilePolygon?.(x,y)||iso.corners?.(x,y,s.layout)||[];for(const p of corners)points.push(p)};
    for(const b of snap.buildings||[]){buildingCount++;const cells=iso.footprintCells?.({footprint:b.footprint||{w:1,h:1}},b.x,b.y)||[{x:b.x,y:b.y}];for(const c of cells)addCell(c.x,c.y)}
    for(const r of snap.roads||[]){roadCount++;addCell(r.x,r.y)}
    if(!points.length)return null;
    const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    return{x:minX,y:minY,width:Math.max(1,maxX-minX),height:Math.max(1,maxY-minY),centerX:(minX+maxX)/2,centerY:(minY+maxY)/2,buildingCount,roadCount};
  }
  function clampCamera(){const s=scene();if(!s?.cameras?.main||!s.snapshot)return;syncBounds(s);const c=s.cameras.main,{width:w,height:h}=worldBounds(s),pad=48,vw=c.width/Math.max(.001,c.zoom),vh=c.height/Math.max(.001,c.zoom),minX=-pad,maxX=Math.max(minX,w-vw+pad),minY=-pad,maxY=Math.max(minY,h-vh+pad);c.scrollX=Math.max(minX,Math.min(maxX,c.scrollX));c.scrollY=Math.max(minY,Math.min(maxY,c.scrollY));s.persistCamera?.()}
  function fitDeveloped(s=scene(),options={}){
    if(!s?.cameras?.main)return false;const b=developedBounds(s);if(!b?.buildingCount)return false;
    syncBounds(s);const c=s.cameras.main,mobile=(window.visualViewport?.width||innerWidth)<900,padX=mobile?96:160,padY=mobile?120:150,minZoom=mobile?.7:.85,maxZoom=mobile?1.55:2.15;
    const fit=Math.max(minZoom,Math.min(maxZoom,Math.min(c.width/Math.max(1,b.width+padX),c.height/Math.max(1,b.height+padY))));
    c.setZoom(fit);c.centerOn(b.centerX,b.centerY);clampCamera();if(options.persist!==false)s.persistCamera?.();return true;
  }
  function framingMetrics(s=scene()){
    const b=developedBounds(s),c=s?.cameras?.main;if(!b||!c)return null;
    return{zoom:c.zoom,widthRatio:(b.width*c.zoom)/Math.max(1,c.width),heightRatio:(b.height*c.zoom)/Math.max(1,c.height),buildingCount:b.buildingCount,roadCount:b.roadCount,bounds:b};
  }
  function scheduleResponsiveFit(s=scene(),delay=90){clearTimeout(responsiveFitTimer);responsiveFitTimer=setTimeout(()=>{const width=window.visualViewport?.width||innerWidth,view=document.querySelector('#codeopolisIonicShell')?.dataset?.view||document.querySelector('.tabs button.active[data-tab]')?.dataset?.tab||'city';if(width>=900&&view==='city'&&s?.snapshot?.buildings?.length)fitDeveloped(s);else clampCamera()},delay)}
  function resize(){const p=C.phaserCity;if(!p?.host)return;const vv=window.visualViewport;if(vv&&document.querySelector('#codeopolisIonicShell')?.dataset.view==='city'){const footer=document.querySelector('#codeopolisIonicShell ion-tab-bar'),header=document.querySelector('#codeopolisIonicShell ion-header'),reserved=(header?.getBoundingClientRect().height||52)+(footer?.getBoundingClientRect().height||64)+(vv.height<500?6:18),minimum=vv.height<500?280:300;p.host.style.height=`${Math.max(minimum,Math.floor(vv.height-reserved))}px`}p.resize?.();requestAnimationFrame(()=>{syncBounds();scheduleResponsiveFit(scene(),70)})}
  function focusSelection(){const s=scene();if(!s)return;const target=s.world?.world?.selected||s.snapshot?.buildings?.[0]||{x:Math.floor(s.snapshot.width/2),y:Math.floor(s.snapshot.height/2)},p=pointFor(s,target);if(p)s.cameras.main.centerOn(p.x,p.y);clampCamera()}
  function reset(){const s=scene();if(!s)return;if(fitDeveloped(s))return;syncBounds(s);const c=s.cameras.main,{width:w,height:h}=worldBounds(s),fit=Math.max(.55,Math.min(1.35,Math.min(c.width/Math.max(1,w+96),c.height/Math.max(1,h+96))));c.setZoom(fit);c.centerOn(w/2,h/2);clampCamera()}
  function controls(){const host=C.phaserCity?.host;if(!host||host.querySelector('.phase44-camera-controls'))return;host.style.position='relative';const wrap=document.createElement('div');wrap.className='phase44-camera-controls';wrap.style.cssText='position:absolute;right:10px;top:10px;z-index:20;display:flex;gap:8px;pointer-events:auto';const mk=(label,title,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;b.setAttribute('aria-label',title);b.style.cssText='width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(10,23,30,.82);color:white;font-size:18px;font-weight:800;backdrop-filter:blur(8px)';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn()});return b};wrap.append(mk('◎','Focus selected tile',focusSelection),mk('↺','Reset city camera',reset));host.append(wrap)}
  function loadAcceptance(){if(C.R14PlayerAcceptance)return;if(document.querySelector('script[data-r14-player-acceptance]'))return;const s=document.createElement('script');s.src=ACCEPTANCE_URL;s.dataset.r14PlayerAcceptance='1';document.head.appendChild(s)}
  function install(){let tries=0;const timer=setInterval(()=>{tries++;const s=scene();if(!s){if(tries>100)clearInterval(timer);return}clearInterval(timer);controls();syncBounds(s);resize();loadAcceptance();let lastTap=0;s.input.on('pointerup',p=>{const now=performance.now();if(now-lastTap<320){const wp=p.positionToCamera(s.cameras.main),q=s.fromWorld?.(wp.x,wp.y);if(q&&s.world.inside(q.x,q.y)){s.world.select(q.x,q.y);const pt=s.toWorld(q.x,q.y);s.cameras.main.centerOn(pt.x,pt.y);clampCamera()}}lastTap=now;requestAnimationFrame(clampCamera)});s.input.on('pointermove',()=>requestAnimationFrame(clampCamera));s.input.on('wheel',()=>requestAnimationFrame(clampCamera));window.visualViewport?.addEventListener('resize',resize,{passive:true});window.visualViewport?.addEventListener('scroll',resize,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(resize,120),{passive:true});window.addEventListener('resize',resize,{passive:true});C.events.on('world:selected',()=>requestAnimationFrame(clampCamera));C.events.on('world:building-placed',()=>setTimeout(()=>scheduleResponsiveFit(scene(),60),90));C.events.on('world:expanded',()=>setTimeout(()=>{const current=scene();current?.refresh?.();syncBounds(current);resize();fitDeveloped(current)},0));C.events.emit('civilization:mobile-camera-ready',{projection:'iso-pixel-v1'})},100)}
  C.register('Phase44MobileCamera',{install,resize,reset,focusSelection,clampCamera,worldBounds,syncBounds,pointFor,developedBounds,fitDeveloped,framingMetrics,scheduleResponsiveFit,loadAcceptance});
})(window.Codeopolis);
