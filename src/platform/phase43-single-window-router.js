// Phase 43 — true single-window routing for major standalone systems.
(() => {
  if (!document.querySelector('link[href="phase43-core-viewport.css"]')) {
    const shellCss = document.createElement('link');
    shellCss.rel = 'stylesheet';
    shellCss.href = 'phase43-core-viewport.css';
    document.head.appendChild(shellCss);
  }

  const root = window.Codeopolis = window.Codeopolis || {};
  const app = document.querySelector('main.app');
  if (!app || document.querySelector('.phase43-workspace-host')) return;

  const surfaces = [
    { key:'ai', id:'aiStudio', label:'🤖 AI Character Studio' },
    { key:'projects', id:'realProjects', label:'🛠️ Engineering Projects' },
    { key:'repo', id:'repositorySim', label:'🧪 Repository Lab' }
  ];

  const host = document.createElement('section');
  host.className = 'phase43-workspace-host panel hidden';
  host.innerHTML = '<div class="phase43-workspace-head"><button type="button" class="btn" data-workspace-back>← Back</button><h2 data-workspace-title>Workspace</h2></div><div class="phase43-workspace-body"></div>';
  app.insertBefore(host, document.querySelector('.footer') || null);
  const body = host.querySelector('.phase43-workspace-body');
  const title = host.querySelector('[data-workspace-title]');
  const registry = new Map();
  let active = null;

  surfaces.forEach(meta => {
    const el = document.getElementById(meta.id);
    if (!el) return;
    registry.set(meta.key, { meta, el, parent:el.parentNode, next:el.nextSibling });
    el.classList.add('phase43-routed-surface');
  });

  function restore(item){
    if (!item || item.el.parentNode !== body) return;
    if (item.next && item.next.parentNode === item.parent) item.parent.insertBefore(item.el, item.next);
    else item.parent.appendChild(item.el);
  }

  function showCore(){
    if (active) restore(active);
    active = null;
    host.classList.add('hidden');
    document.body.classList.remove('phase43-workspace-open');
    document.querySelector('.layout')?.classList.remove('phase43-core-hidden');
  }

  function openRoute(key){
    const item = registry.get(key);
    if (!item) return;
    if (active && active !== item) restore(active);
    active = item;
    document.querySelector('.layout')?.classList.add('phase43-core-hidden');
    document.body.classList.add('phase43-workspace-open');
    host.classList.remove('hidden');
    title.textContent = item.meta.label;
    body.appendChild(item.el);
    window.scrollTo?.(0,0);
  }

  host.querySelector('[data-workspace-back]').addEventListener('click', showCore);

  function addLaunchers(){
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    surfaces.forEach(meta => {
      if (!registry.has(meta.key) || sidebar.querySelector(`[data-phase43-workspace="${meta.key}"]`)) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn phase43-workspace-launch';
      b.dataset.phase43Workspace = meta.key; b.textContent = meta.label;
      b.addEventListener('click', () => openRoute(meta.key));
      sidebar.appendChild(b);
    });
  }

  document.addEventListener('click', event => {
    const b = event.target.closest?.('[data-phase43-workspace]');
    if (!b) return;
    event.preventDefault(); openRoute(b.dataset.phase43Workspace);
  });

  addLaunchers();
  new MutationObserver(addLaunchers).observe(document.body,{childList:true,subtree:true});
  root.phase43SingleWindow = { openRoute, showCore, surfaces };
})();
