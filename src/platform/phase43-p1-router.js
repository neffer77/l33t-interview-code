// Phase 43 P1 — true single-window router for previously stacked systems.
(() => {
  const root = window.Codeopolis = window.Codeopolis || {};
  const routeKey = 'codeopolis.phase43.single-window-route.v1';
  const surfaces = [
    {id:'aiStudio', key:'ai', label:'🤖 AI Studio'},
    {id:'realProjects', key:'projects', label:'🛠️ Projects'},
    {id:'repositorySim', key:'repo', label:'🧪 Repository Lab'}
  ];
  const app = document.querySelector('main.app');
  if (!app) return;

  const host = document.createElement('section');
  host.className = 'phase43-route-host panel hidden';
  host.innerHTML = '<div class="phase43-route-head"><button type="button" class="btn" data-route-back>← Back</button><h2 data-route-title>Workspace</h2></div><div class="phase43-route-body"></div>';
  const anchor = document.querySelector('.footer');
  app.insertBefore(host, anchor || null);
  const body = host.querySelector('.phase43-route-body');
  const title = host.querySelector('[data-route-title]');
  const parked = new Map();

  surfaces.forEach(s => {
    const el = document.getElementById(s.id);
    if (!el) return;
    parked.set(s.key, {meta:s, el, parent:el.parentNode, next:el.nextSibling});
    el.classList.add('phase43-routed-surface');
  });

  function hideCore(){
    document.querySelector('.layout')?.classList.add('phase43-core-hidden');
    host.classList.remove('hidden');
    document.body.classList.add('phase43-route-open');
  }
  function showCore(){
    host.classList.add('hidden');
    document.querySelector('.layout')?.classList.remove('phase43-core-hidden');
    document.body.classList.remove('phase43-route-open');
    body.replaceChildren();
    try { localStorage.removeItem(routeKey); } catch(_) {}
  }
  function openRoute(key){
    const item = parked.get(key); if (!item) return;
    hideCore(); body.replaceChildren(item.el); title.textContent = item.meta.label;
    try { localStorage.setItem(routeKey,key); } catch(_) {}
    window.scrollTo?.(0,0);
  }
  host.querySelector('[data-route-back]').onclick = showCore;

  const existingMore = document.querySelector('.phase43-more-grid');
  function addLaunchers(){
    const targets = [document.querySelector('.sidebar'), existingMore].filter(Boolean);
    targets.forEach(target => surfaces.forEach(s => {
      if (target.querySelector?.(`[data-phase43-route="${s.key}"]`)) return;
      const b=document.createElement('button'); b.type='button'; b.className='btn phase43-route-launch'; b.dataset.phase43Route=s.key; b.textContent=s.label; b.onclick=()=>openRoute(s.key); target.appendChild(b);
    }));
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-phase43-route]'); if(b){ e.preventDefault(); openRoute(b.dataset.phase43Route); }
  });
  addLaunchers();
  const observer = new MutationObserver(addLaunchers); observer.observe(document.body,{childList:true,subtree:true});
  try { const last=localStorage.getItem(routeKey); if(last&&parked.has(last)) setTimeout(()=>openRoute(last),500); } catch(_) {}
  root.phase43SingleWindow={openRoute,showCore,surfaces};
})();
