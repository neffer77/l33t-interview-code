(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const style = document.createElement('style');
  style.textContent = `
  :root{--p2-glow:0 0 0 1px rgba(120,190,255,.18),0 12px 36px rgba(0,0,0,.28)}
  body{background:radial-gradient(circle at 20% 0%,rgba(36,94,160,.16),transparent 34%),radial-gradient(circle at 90% 15%,rgba(109,64,180,.12),transparent 28%),#09111f}
  .panel,.pill,.tag,.btn{transition:transform .18s ease,box-shadow .18s ease,background .18s ease,border-color .18s ease,opacity .18s ease}
  .panel{box-shadow:var(--p2-glow)}
  .btn:active{transform:scale(.96)} .btn:hover{transform:translateY(-1px)}
  .tabs button.active{animation:p2Tab .28s cubic-bezier(.2,.8,.2,1)}
  .pill.p2-bump{animation:p2Bump .45s cubic-bezier(.2,.9,.3,1)}
  .p2-reveal{animation:p2Reveal .32s cubic-bezier(.2,.8,.2,1)}
  .p2-flash{animation:p2Flash .7s ease}
  .p2-float{position:fixed;z-index:9999;pointer-events:none;font-weight:900;text-shadow:0 2px 8px #000;animation:p2Float 1.05s ease forwards}
  #cityCanvas{filter:saturate(1.08) contrast(1.04);animation:p2CityBreath 7s ease-in-out infinite}
  .phase43-start-card{animation:p2Start .5s cubic-bezier(.18,.9,.3,1)}
  @keyframes p2Tab{0%{transform:scale(.94)}60%{transform:scale(1.04)}100%{transform:scale(1)}}
  @keyframes p2Bump{0%{transform:scale(1)}45%{transform:scale(1.12)}100%{transform:scale(1)}}
  @keyframes p2Reveal{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:none}}
  @keyframes p2Flash{0%,100%{box-shadow:var(--p2-glow)}40%{box-shadow:0 0 0 2px rgba(110,220,255,.65),0 0 32px rgba(80,180,255,.28)}}
  @keyframes p2Float{0%{opacity:0;transform:translate(-50%,8px) scale(.85)}18%{opacity:1}100%{opacity:0;transform:translate(-50%,-54px) scale(1.08)}}
  @keyframes p2CityBreath{0%,100%{filter:saturate(1.05) brightness(1)}50%{filter:saturate(1.16) brightness(1.04)}}
  @keyframes p2Start{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}
  `;
  document.head.appendChild(style);

  const selectors = ['#money','#research','#population','#energy','#happiness','#level','#streak'];
  const previous = new Map();

  function bumpStat(el){
    const pill = el.closest('.pill'); if(!pill)return;
    pill.classList.remove('p2-bump'); void pill.offsetWidth; pill.classList.add('p2-bump');
  }
  function watchStats(){
    selectors.forEach(s=>{const el=document.querySelector(s);if(!el)return;const v=el.textContent;const old=previous.get(s);if(old!=null&&old!==v)bumpStat(el);previous.set(s,v)});
  }
  setInterval(watchStats,450); watchStats();

  document.addEventListener('click',e=>{
    const tab=e.target.closest?.('[data-tab]');
    if(tab){setTimeout(()=>{const name=tab.dataset.tab;const panel=document.querySelector(`#${name}Tab`);if(panel){panel.classList.remove('p2-reveal');void panel.offsetWidth;panel.classList.add('p2-reveal')}},0)}
  },true);

  function floatText(text,x,y){
    const el=document.createElement('div');el.className='p2-float';el.textContent=text;el.style.left=x+'px';el.style.top=y+'px';document.body.appendChild(el);setTimeout(()=>el.remove(),1100);
  }

  const C=window.Codeopolis;
  if(C?.events?.on){
    const celebrate=(label)=>()=>{
      const r=document.querySelector('#cityCanvas')?.getBoundingClientRect();
      floatText(label,r? r.left+r.width/2:innerWidth/2,r? r.top+r.height/2:innerHeight/2);
      const panel=document.querySelector('.panel');if(panel){panel.classList.remove('p2-flash');void panel.offsetWidth;panel.classList.add('p2-flash')}
    };
    ['learning:mastered','incident:completed','design:finished','project:completed','interview:completed','phase37:completed','phase38:completed'].forEach(ev=>C.events.on(ev,celebrate('✨ Progress')));
  }

  const observer=new MutationObserver(records=>{
    for(const r of records){for(const n of r.addedNodes){if(n.nodeType===1&&n.matches?.('.modal,.toast,.quest-card,.boss-card'))n.classList.add('p2-reveal')}}
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();