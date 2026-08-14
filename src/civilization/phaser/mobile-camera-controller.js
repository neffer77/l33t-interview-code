(function(C){
  'use strict';
  function scene(){return C.phaserCity?.game?.scene?.getScene('CodeopolisCity')||null}
  function clampCamera(){
    const s=scene();if(!s?.cameras?.main||!s.snapshot)return;
    const c=s.cameras.main,t=s.tile||32,pad=48,w=s.snapshot.width*t,h=s.snapshot.height*t;
    const vw=c.width/Math.max(.001,c.zoom),vh=c.height/Math.max(.001,c.zoom);
    const minX=-pad,maxX=Math.max(minX,w-vw+pad),minY=-pad,maxY=Math.max(minY,h-vh+pad);
    c.scrollX=Math.max(minX,Math.min(maxX,c.scrollX));c.scrollY=Math.max(minY,Math.min(maxY,c.scrollY));
    s.persistCamera?.();
  }
  function resize(){
    const p=C.phaserCity;if(!p?.host)return;
    const vv=window.visualViewport;
    if(vv&&document.querySelector('#codeopolisIonicShell')?.dataset.view==='city'){
      const footer=document.querySelector('#codeopolisIonicShell ion-tab-bar');
      const header=document.querySelector('#codeopolisIonicShell ion-header');
      const reserved=(header?.getBoundingClientRect().height||52)+(footer?.getBoundingClientRect().height||64)+18;
      p.host.style.height=`${Math.max(300,Math.floor(vv.height-reserved))}px`;
    }
    p.resize?.();requestAnimationFrame(clampCamera);
  }
  function focusSelection(){
    const s=scene();if(!s)return;const target=s.world?.world?.selected||s.snapshot?.buildings?.[0]||{x:Math.floor(s.snapshot.width/2),y:Math.floor(s.snapshot.height/2)};
    const c=s.cameras.main,t=s.tile||32;c.centerOn(target.x*t+t/2,target.y*t+t/2);clampCamera();
  }
  function reset(){
    const s=scene();if(!s)return;const c=s.cameras.main,w=s.snapshot.width*(s.tile||32),h=s.snapshot.height*(s.tile||32);
    const fit=Math.max(.55,Math.min(1.35,Math.min(c.width/Math.max(1,w+96),c.height/Math.max(1,h+96))));c.setZoom(fit);c.centerOn(w/2,h/2);clampCamera();
  }
  function controls(){
    const host=C.phaserCity?.host;if(!host||host.querySelector('.phase44-camera-controls'))return;
    host.style.position='relative';const wrap=document.createElement('div');wrap.className='phase44-camera-controls';wrap.style.cssText='position:absolute;right:10px;top:10px;z-index:20;display:flex;gap:8px;pointer-events:auto';
    const mk=(label,title,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;b.setAttribute('aria-label',title);b.style.cssText='width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(10,23,30,.82);color:white;font-size:18px;font-weight:800;backdrop-filter:blur(8px)';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn()});return b};
    wrap.append(mk('◎','Focus selected tile',focusSelection),mk('↺','Reset city camera',reset));host.append(wrap);
  }
  function install(){
    let tries=0;const timer=setInterval(()=>{tries++;const s=scene();if(!s){if(tries>100)clearInterval(timer);return}clearInterval(timer);controls();resize();
      let lastTap=0;s.input.on('pointerup',p=>{const now=performance.now();if(now-lastTap<320){const wp=p.positionToCamera(s.cameras.main),x=Math.floor(wp.x/(s.tile||32)),y=Math.floor(wp.y/(s.tile||32));if(s.world.inside(x,y)){s.world.select(x,y);s.cameras.main.centerOn(x*(s.tile||32)+(s.tile||32)/2,y*(s.tile||32)+(s.tile||32)/2);clampCamera()}}lastTap=now;requestAnimationFrame(clampCamera)});
      s.input.on('pointermove',()=>requestAnimationFrame(clampCamera));s.input.on('wheel',()=>requestAnimationFrame(clampCamera));
      window.visualViewport?.addEventListener('resize',resize,{passive:true});window.visualViewport?.addEventListener('scroll',resize,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(resize,120),{passive:true});window.addEventListener('resize',resize,{passive:true});
      C.events.on('world:selected',()=>requestAnimationFrame(clampCamera));C.events.emit('civilization:mobile-camera-ready',{});
    },100);
  }
  C.register('Phase44MobileCamera',{install,resize,reset,focusSelection,clampCamera});
})(window.Codeopolis);
