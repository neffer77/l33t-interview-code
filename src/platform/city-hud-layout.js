// City HUD layout — stop the corner-anchored overlays from colliding.
//
// The Phaser city mounts ~20 independently absolute-positioned HUD panels and
// action buttons into the city host. Each feature (phase1/2, r8..r13, phase44)
// drops its own control at a hand-picked pixel offset with no shared layout, so
// several land on the same corner and pile on top of each other — and because
// the panels use translucent-glass backgrounds, the overlaps read as an
// unreadable muddy band. This manager gives them an actual layout:
//   - informational panels  -> two vertical flex stacks (top-left / top-right)
//   - functional action FABs -> one horizontal "dock" (mobile) so they flow in
//     a row and cannot overlap, inside a single opaque bar.
// Runs on every width. Desktop keeps the two info stacks (its FABs already have
// room); mobile additionally gets the bottom dock, which is where the collisions
// were worst. R14 acceptance taps buildable tiles (not buttons), so relocating
// the buttons into a dock keeps them tappable without blocking the map.
(() => {
  'use strict';

  // Informational panels -> top-corner stacks. Order defines top-to-bottom.
  const ROUTES = new Map([
    ['r6-population-hud', 'tl'],
    ['p1-road-summary', 'tl'],
    ['r12-custom-summary', 'tl'],
    ['phase44-tech-tree', 'tl'],
    ['phase44-adaptive', 'tl'],
    ['p1-overlay-ui', 'tl'],
    ['phase44-learning-intelligence', 'tr'],
    ['phase44-specialization-panel', 'tr'],
    ['phase44-mastery', 'tr'],
    ['phase44-knowledge-retention', 'tr'],
    ['phase44-landmarks', 'tr'],
    ['r8-zone-summary', 'tr'],
  ]);

  // Functional action buttons -> the mobile dock, in this left-to-right order
  // (primary actions first so they stay visible before the dock scrolls).
  const DOCK_ORDER = [
    'p1-build-fab', 'p1-road-fab', 'p2-district-fab', 'r8-zoning-fab',
    'r13-campaign-fab', 'r9ef', 'p1-services-fab', 'p1-construction-fab',
    'p1f-spec-fab', 'p1-undo-fab', 'r11-crisis-fab',
    'phase44-diagnostics-button',
  ];
  // The bottom-sheet panels (campaign/custom/etc.) cover the bottom dock, so any
  // control that must stay clickable while a panel is open cannot live in the
  // dock. Customize is opened right after Campaign in the player flow, so it is
  // pinned to the top-left rail (above the sheet zone) instead of docked.
  const TOP_PINNED = ['r12-custom-fab'];

  function host() {
    return window.Codeopolis?.phaserCity?.host || document.getElementById('phaserCityHost');
  }
  const isMobile = () => !matchMedia('(min-width: 900px)').matches;

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
      /* Mobile action dock: one opaque scrollable row; buttons flow, never overlap. */
      /* Wrap (never horizontal-scroll): every docked control must stay inside the
         city host — the R14 audit fails a control whose rect leaves the host. */
      .hud-dock{position:absolute;left:6px;right:6px;bottom:calc(env(safe-area-inset-bottom,0px) + 8px);
        z-index:88;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:5px;padding:6px;
        max-height:calc(100% - 96px);overflow-y:auto;
        background:#0b141dee;border:1px solid #26414d;border-radius:14px;box-shadow:0 6px 22px #0008;
        scrollbar-width:none;-webkit-overflow-scrolling:touch}
      .hud-dock::-webkit-scrollbar{display:none}
      .hud-dock>*{position:static!important;inset:auto!important;top:auto!important;left:auto!important;
        right:auto!important;bottom:auto!important;margin:0!important;transform:none!important;
        flex:0 0 auto;white-space:nowrap;display:inline-flex!important;align-items:center;
        box-shadow:none!important;animation:none!important}
      .hud-dock:empty{display:none}
      /* On mobile: keep the info rails compact so the map stays the hero.
         Narrow columns, capped height with internal scroll, above the dock. */
      @media (max-width:899px){
        .hud-stack-tl,.hud-stack-tr{top:44px;max-width:44%;
          max-height:min(46%,360px);gap:5px}
        .hud-stack-tl{left:6px}
        .hud-stack-tr{right:6px}
      }
    `;
    document.head.appendChild(s);
  }

  let stacks = null;
  function ensureStacks() {
    const h = host();
    if (!h) return null;
    if (stacks && stacks.tl.parentNode === h && stacks.tr.parentNode === h &&
        (!stacks.dock || stacks.dock.parentNode === h)) return stacks;
    ensureStyles();
    const mk = (cls, corner) => {
      let el = h.querySelector(':scope > .' + cls + (corner ? '-' + corner : ''));
      if (!el) { el = document.createElement('div'); el.className = cls + (corner ? ' ' + cls + '-' + corner : ''); }
      if (el.parentNode !== h) h.appendChild(el);
      return el;
    };
    stacks = {
      tl: mk('hud-stack', 'tl'),
      tr: mk('hud-stack', 'tr'),
      dock: isMobile() ? mk('hud-dock', '') : null,
    };
    return stacks;
  }

  let queued = false;
  function route() {
    queued = false;
    const h = host();
    if (!h) return;
    const s = ensureStacks();
    if (!s) return;
    // Informational panels -> corner stacks.
    ROUTES.forEach((corner, cls) => {
      const target = corner === 'tl' ? s.tl : s.tr;
      h.querySelectorAll(':scope > .' + cls).forEach(el => {
        if (el.parentNode !== target) target.appendChild(el);
      });
    });
    // Functional action buttons -> the mobile dock, in priority order.
    if (s.dock) {
      DOCK_ORDER.forEach(cls => {
        h.querySelectorAll(':scope > .' + cls).forEach(el => {
          if (el.parentNode !== s.dock) s.dock.appendChild(el);
        });
      });
      // Keep dock children in the declared order even if some arrive late.
      const rank = el => {
        for (let i = 0; i < DOCK_ORDER.length; i++) if (el.classList.contains(DOCK_ORDER[i])) return i;
        return DOCK_ORDER.length;
      };
      [...s.dock.children].sort((a, b) => rank(a) - rank(b)).forEach(el => s.dock.appendChild(el));
      // Controls that must stay clickable while a bottom sheet is open live at the
      // very top of the top-left rail, above the sheet zone.
      TOP_PINNED.forEach(cls => {
        const el = h.querySelector('.' + cls);
        if (el && !(el.parentNode === s.tl && s.tl.firstChild === el)) s.tl.insertBefore(el, s.tl.firstChild || null);
      });
    }
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(route);
  }

  function boot() {
    schedule();
    // Panels/buttons are created (and some re-appended) as the city boots and
    // refreshes; re-assert their home when the host's children change.
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    addEventListener('resize', schedule, { passive: true });
    let passes = 0;
    const timer = setInterval(() => { schedule(); if (++passes >= 60) clearInterval(timer); }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
