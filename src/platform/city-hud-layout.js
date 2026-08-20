// City HUD layout — stop the corner-anchored overlays from colliding.
//
// The Phaser city mounts ~20 independently absolute-positioned HUD panels into
// the city host; several of them anchor to the same top-left / top-right spot
// and pile on top of each other (and over the centered resource bar). This
// manager reparents the informational panels into two vertical flex stacks that
// clear the resource bar, so they flow instead of overlapping. Functional FAB
// clusters (build/roads/zoning/campaign/camera) and the resource bar keep their
// own positions — they don't collide and R14 acceptance depends on them.
// Desktop/tablet-wide only; the Ionic mobile shell has its own city layout.
(() => {
  'use strict';
  // class -> corner. Order within a corner defines top-to-bottom stack order.
  const ROUTES = new Map([
    ['r6-population-hud', 'tl'],
    ['p1-road-summary', 'tl'],
    ['phase44-tech-tree', 'tl'],
    ['phase44-adaptive', 'tl'],
    ['r12-custom-fab', 'tl'],
    ['phase44-diagnostics-button', 'tl'],
    ['p1-overlay-ui', 'tl'],
    ['phase44-learning-intelligence', 'tr'],
    ['phase44-specialization-panel', 'tr'],
    ['phase44-mastery', 'tr'],
    ['phase44-knowledge-retention', 'tr'],
    ['phase44-landmarks', 'tr'],
    ['r8-zone-summary', 'tr'],
  ]);

  function host() {
    return window.Codeopolis?.phaserCity?.host || document.getElementById('phaserCityHost');
  }

  function ensureStyles() {
    if (document.getElementById('cityHudLayoutStyle')) return;
    const s = document.createElement('style');
    s.id = 'cityHudLayoutStyle';
    s.textContent = `
      .hud-stack{position:absolute;z-index:60;display:flex;flex-direction:column;gap:6px;
        pointer-events:none;max-height:calc(100% - 132px);overflow-y:auto;overflow-x:visible;scrollbar-width:none}
      .hud-stack::-webkit-scrollbar{display:none}
      .hud-stack-tl{top:52px;left:8px;align-items:flex-start;max-width:min(346px,42%)}
      .hud-stack-tr{top:52px;right:8px;align-items:flex-end;max-width:min(360px,42%)}
      .hud-stack>*{position:static!important;inset:auto!important;top:auto!important;left:auto!important;
        right:auto!important;bottom:auto!important;margin:0!important;transform:none!important;
        max-width:100%!important;pointer-events:auto}
    `;
    document.head.appendChild(s);
  }

  let stacks = null;
  function ensureStacks() {
    const h = host();
    if (!h) return null;
    if (stacks && stacks.tl.parentNode === h && stacks.tr.parentNode === h) return stacks;
    ensureStyles();
    const mk = corner => {
      let el = h.querySelector(':scope > .hud-stack-' + corner);
      if (!el) { el = document.createElement('div'); el.className = 'hud-stack hud-stack-' + corner; }
      if (el.parentNode !== h) h.appendChild(el);
      return el;
    };
    stacks = { tl: mk('tl'), tr: mk('tr') };
    return stacks;
  }

  let queued = false;
  function route() {
    queued = false;
    const h = host();
    if (!h) return;
    const s = ensureStacks();
    if (!s) return;
    ROUTES.forEach((corner, cls) => {
      const target = corner === 'tl' ? s.tl : s.tr;
      h.querySelectorAll(':scope > .' + cls).forEach(el => {
        if (el.parentNode !== target) target.appendChild(el);
      });
    });
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(route);
  }

  function boot() {
    if (!matchMedia('(min-width: 900px)').matches) return; // Ionic owns mobile city.
    schedule();
    // Panels are created (and some re-appended) as the city boots and refreshes;
    // re-assert their home when the host's children change.
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    addEventListener('resize', schedule, { passive: true });
    let passes = 0;
    const timer = setInterval(() => { schedule(); if (++passes >= 60) clearInterval(timer); }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
