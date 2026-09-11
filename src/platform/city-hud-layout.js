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
// Runs on every width. Mobile additionally gets the bottom dock, which is where
// the collisions were worst. Desktop keeps its FABs as direct children of the
// host (they must stay there to keep the z-index the R14 flow depends on) but
// gets them laid out into declared columns/rows instead of hand-picked offsets:
// measured on a seeded city, four desktop pairs were landing on top of each
// other (services/zoning at bottom 162 vs 164, construction/spec at top 54 vs
// 58, campaign/undo at 110 vs 112, crisis/customize at 64 vs 62), which left
// "Services" entirely buried behind "Zones".
// At every width the info rails are collapsed by default and a "📊 Info"
// toggle reveals them, so the map is the hero instead of being flanked by ~10
// telemetry panels. The choice is remembered in localStorage. R14 acceptance
// taps buildable tiles (not buttons), so relocating the buttons keeps them
// tappable.
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
  // Desktop layout: the same controls, but stacked along the host edges in a
  // declared order rather than at whatever offset each feature picked. Bottom
  // groups grow upwards as columns; top groups grow inwards as a single row so
  // they stay clear of the info rails underneath them. Only visible controls
  // take a slot, so a hidden FAB (crisis, specialization) leaves no gap.
  const COLUMNS = [
    { side: 'right', edge: 'bottom', base: 62, step: 52,
      order: ['p1-build-fab', 'p1-road-fab', 'r8-zoning-fab', 'p1-services-fab', 'r9ef'] },
    { side: 'left', edge: 'bottom', base: 62, step: 52,
      order: ['p2-district-fab', 'p1-undo-fab', 'r13-campaign-fab'] },
    { side: 'right', edge: 'top', base: 56, row: true,
      order: ['p1-construction-fab', 'p1f-spec-fab'] },
    { side: 'left', edge: 'top', base: 56, row: true,
      order: ['r12-custom-fab', 'r11-crisis-fab'] },
  ];

  // Customize (r12-custom-fab) is deliberately left at its native position and
  // z-index (77). The player flow opens the Campaign panel and then clicks
  // Customize while that panel is open; Customize only stays clickable because
  // its native z-index sits above the panel. Docking it (or routing it into a
  // rail, which drops it to the rail's lower z-index) puts it behind the panel
  // and the panel intercepts the click. So it is never reparented — the desktop
  // column above only moves it, leaving it a direct child of the host and so
  // still covered by the z-index rule.

  function host() {
    return window.Codeopolis?.phaserCity?.host || document.getElementById('phaserCityHost');
  }
  const isMobile = () => !matchMedia('(min-width: 900px)').matches;

  // Remember whether the player wants the telemetry rails up. Default closed.
  const RAILS_KEY = 'codeopolis.hudRailsOpen';
  function railsOpen() { try { return localStorage.getItem(RAILS_KEY) === '1'; } catch { return false; } }
  function saveRails(open) { try { localStorage.setItem(RAILS_KEY, open ? '1' : '0'); } catch { /* private mode */ } }

  function ensureStyles() {
    if (document.getElementById('cityHudLayoutStyle')) return;
    const s = document.createElement('style');
    s.id = 'cityHudLayoutStyle';
    s.textContent = `
      .hud-stack{position:absolute;z-index:60;display:flex;flex-direction:column;gap:6px;
        pointer-events:none;max-height:calc(100% - 132px);overflow-y:auto;overflow-x:visible;scrollbar-width:none}
      .hud-stack::-webkit-scrollbar{display:none}
      .hud-stack-tl{top:106px;left:8px;align-items:flex-start;max-width:min(346px,42%)}
      .hud-stack-tr{top:106px;right:8px;align-items:flex-end;max-width:min(360px,42%)}
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
      /* Collapse toggle: a dock item on mobile, a floating pill on desktop where
         there is no dock. Desktop parks it in the top chrome band, to the left of
         the camera controls, so it occupies no new part of the map. */
      .hud-rail-toggle{min-width:40px;min-height:40px;padding:8px 12px;border:1px solid #35566a;
        border-radius:999px;background:#16303fee;color:#cfe7d8;font:800 12px system-ui;cursor:pointer}
      .hud-rail-toggle-float{position:absolute;top:8px;right:108px;z-index:95;
        box-shadow:0 5px 18px #0007}
      /* The empty-land onboarding screen owns the whole map: no chrome at all. */
      .phaser-city-host.r14-first-run .hud-rail-toggle{display:none!important}
      /* The info rails are telemetry, not controls: collapsed by default at every
         width so the map is the hero, revealed on demand by the toggle. */
      .phaser-city-host:not(.hud-rails-open) .hud-stack-tl,
      .phaser-city-host:not(.hud-rails-open) .hud-stack-tr{display:none}
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
      // Re-append only when the order is actually wrong: re-appending a node
      // that is already in place still counts as a childList mutation, so an
      // unconditional pass feeds the observer below and respins route() every
      // frame (measured at ~1500 mutations/second on a phone viewport).
      const rank = el => {
        for (let i = 0; i < DOCK_ORDER.length; i++) if (el.classList.contains(DOCK_ORDER[i])) return i;
        return DOCK_ORDER.length;
      };
      const ordered = [...s.dock.children].sort((a, b) => rank(a) - rank(b));
      if (ordered.some((el, i) => s.dock.children[i] !== el)) ordered.forEach(el => s.dock.appendChild(el));
    }
    ensureToggle(h, s);
    layoutFloating(h);
  }

  // Rail collapse toggle: only meaningful once the info rails have content. On
  // mobile it is the last dock item so the primary actions stay leftmost; on
  // desktop it floats in the top chrome band.
  let toggle = null;
  // Write only on an actual change. route() runs on every DOM mutation under the
  // host, and assigning textContent replaces a child node — which is itself a
  // childList mutation the observer sees, so an unconditional write reschedules
  // route() forever at requestAnimationFrame rate.
  function paintToggle(open) {
    const label = open ? '✕ Hide' : '📊 Info';
    if (toggle.textContent === label) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = label;
  }
  function ensureToggle(h, s) {
    // Offer the toggle only when a rail actually holds something. Test each
    // panel's own display: while the rails are collapsed they are display:none,
    // so offsetParent/getClientRects would report every child as hidden and the
    // toggle could never be used to open them again.
    const hasInfo = [...s.tl.children, ...s.tr.children]
      .some(el => getComputedStyle(el).display !== 'none');
    if (!hasInfo) { toggle?.remove(); return; }
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'hud-rail-toggle';
      toggle.addEventListener('click', () => {
        const open = h.classList.toggle('hud-rails-open');
        saveRails(open);
        paintToggle(open);
      });
    }
    const open = railsOpen();
    h.classList.toggle('hud-rails-open', open);
    paintToggle(open);
    toggle.classList.toggle('hud-rail-toggle-float', !s.dock);
    const home = s.dock || h;
    // In the dock it must stay last; floating, position is fixed by CSS.
    if (toggle.parentNode !== home || (s.dock && toggle !== home.lastElementChild)) home.appendChild(toggle);
  }

  // Only ever clear an inline offset this module wrote. Several controls set
  // their own inline top/left (the camera cluster does), and blanket-removing
  // those drops an absolutely positioned element to its static position — which
  // parked the camera cluster on the host's bottom edge.
  function setOffset(el, prop, value) {
    (el.__hudOffsets || (el.__hudOffsets = new Set())).add(prop);
    if (el.style[prop] !== value) el.style[prop] = value;
  }
  function clearOffsets(el) {
    if (!el.__hudOffsets) return;
    for (const prop of el.__hudOffsets) el.style.removeProperty(prop);
    el.__hudOffsets.clear();
  }

  // Desktop: give the host's own floating controls a deterministic layout so two
  // features can never claim the same offset. Mobile clears the inline offsets —
  // the dock owns those controls there.
  function layoutFloating(h) {
    const mobile = isMobile();
    for (const col of COLUMNS) {
      let offset = col.row ? 8 : col.base;
      for (const cls of col.order) {
        const el = h.querySelector(':scope > .' + cls);
        if (!el) continue;
        if (mobile) { clearOffsets(el); continue; }
        if (!el.offsetParent) continue; // hidden control takes no slot
        if (col.row) {
          setOffset(el, 'top', col.base + 'px');
          setOffset(el, col.side, offset + 'px');
          offset += el.offsetWidth + 6;
        } else {
          setOffset(el, col.edge, offset + 'px');
          offset += col.step;
        }
      }
    }
    // Mobile: the resource strip is forced to span the full host width, so the
    // camera cluster pinned to the same top offset lands on top of it. Drop the
    // cluster below the strip (measured, since the strip wraps to two lines on
    // narrow phones) and start the info rails below that.
    const cam = h.querySelector(':scope > .phase44-camera-controls');
    if (cam) {
      const strip = h.querySelector(':scope > .p2-resource-hud');
      if (!mobile || !strip?.offsetParent || !cam.offsetParent) {
        clearOffsets(cam);
        if (stacks) { clearOffsets(stacks.tl); clearOffsets(stacks.tr); }
      } else if (strip.offsetLeft + strip.offsetWidth > cam.offsetLeft) {
        const top = strip.offsetTop + strip.offsetHeight + 6;
        setOffset(cam, 'top', top + 'px');
        const railTop = top + cam.offsetHeight + 6 + 'px';
        if (stacks) { setOffset(stacks.tl, 'top', railTop); setOffset(stacks.tr, 'top', railTop); }
      }
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
