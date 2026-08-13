(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    const style = document.createElement('style');
    style.textContent = `:root{--p2-glow:0 0 0 1px rgba(120,190,255,.18),0 12px 36px rgba(0,0,0,.28)}body{background:radial-gradient(circle at 20% 0%,rgba(36,94,160,.16),transparent 34%),radial-gradient(circle at 90% 15%,rgba(109,64,180,.12),transparent 28%),#09111f}.panel,.pill,.tag,.btn{transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease}.panel{box-shadow:var(--p2-glow)}.btn:active{transform:scale(.96)}.btn:hover{transform:translateY(-1px)}.tabs button.active{animation:p2Tab .28s}.pill.p2-bump{animation:p2Bump .45s}.p2-reveal{animation:p2Reveal .32s}.p2-float{position:fixed;z-index:9999;pointer-events:none;font-weight:900;text-shadow:0 2px 8px #000;animation:p2Float 1.05s ease forwards}#cityCanvas{animation:p2CityBreath 7s ease-in-out infinite}@keyframes p2Tab{50%{transform:scale(1.04)}}@keyframes p2Bump{45%{transform:scale(1.12)}}@keyframes p2Reveal{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes p2Float{0%{opacity:0}18%{opacity:1}100%{opacity:0;transform:translate(-50%,-54px)}}@keyframes p2CityBreath{50%{filter:saturate(1.16) brightness(1.04)}}`;
    document.head.appendChild(style);
    const selectors=['#money','#research','#population','#energy','#happiness','#level','#streak'],previous=new Map();
    setInterval(()=>selectors.forEach(s=>{const el=document.querySelector(s);if(!el)return;const v=el.textContent,old=previous.get(s);if(old!=null&&old!==v){const p=el.closest('.pill');if(p){p.classList.remove('p2-bump');void p.offsetWidth;p.classList.add('p2-bump')}}previous.set(s,v)}),450);
    document.addEventListener('click',e=>{const tab=e.target.closest?.('[data-tab]');if(tab)setTimeout(()=>{const p=document.querySelector(`#${tab.dataset.tab}Tab`);if(p){p.classList.remove('p2-reveal');void p.offsetWidth;p.classList.add('p2-reveal')}},0)},true);
  }
  function load(src){if(document.querySelector(`script[src="${src}"]`))return;const s=document.createElement('script');s.src=src;s.defer=true;document.body.appendChild(s)}
  function css(href){if(document.querySelector(`link[href="${href}"]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
  css('phase43-p3.css'); load('src/platform/phase43-p3-navigation.js');
})();
