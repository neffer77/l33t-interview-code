// Phase 43 — open coding surfaces in a centered workspace overlay.
//
// The world-first viewport (phase43-core-viewport.css) locks the app to a
// single non-scrolling screen and budgets most of it to the Phaser city, which
// squeezes the coding tabs (Challenge/Learn/Mock) — and their code editor —
// into a few dozen pixels. Instead of fighting that layout, we keep the city
// full-screen and promote the active coding tab into a roomy centered overlay
// with a "back to city" affordance. Desktop/tablet-wide only; the <900px Ionic
// shell has its own workspace and is left untouched.
(() => {
  const CODING = { challenge: '⚔️ Challenge', learning: '🧠 Learn', mock: '🎙️ Mock' };

  function boot() {
    if (!matchMedia('(min-width: 900px)').matches) return; // Ionic owns mobile.
    const app = document.querySelector('main.app');
    if (!app || document.querySelector('.phase43-code-overlay')) return;

    const style = document.createElement('style');
    style.textContent = `
      body.phase43-code-open > .app > .layout { display: none !important; }
      .phase43-code-overlay { position: fixed; z-index: 80; left: 50%; top: 50%;
        transform: translate(-50%, -50%);
        width: min(1180px, calc(100vw - 32px)); height: min(880px, calc(100dvh - 32px));
        max-width: calc(100vw - 32px); max-height: calc(100dvh - 32px);
        display: flex; flex-direction: column; overflow: hidden;
        margin: 0 !important; padding: 14px; border-radius: 18px !important; box-sizing: border-box; }
      .phase43-code-overlay.hidden { display: none !important; }
      .phase43-code-overlay-head { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; padding-bottom: 10px; }
      .phase43-code-overlay-head h2 { margin: 0; font-size: 18px; }
      .phase43-code-overlay-body { flex: 1 1 auto; min-height: 0; overflow: auto; -webkit-overflow-scrolling: touch; }
      .phase43-code-overlay-body > [id$="Tab"] { display: block !important; }
      @media (max-width: 760px) { .phase43-code-overlay { width: calc(100vw - 12px);
        height: calc(100dvh - 16px); border-radius: 14px !important; padding: 10px; } }
    `;
    document.head.appendChild(style);

    const host = document.createElement('section');
    host.className = 'phase43-code-overlay panel hidden';
    host.innerHTML = '<div class="phase43-code-overlay-head">'
      + '<button type="button" class="btn" data-code-back>← Back to city</button>'
      + '<h2 data-code-title>Coding</h2></div>'
      + '<div class="phase43-code-overlay-body"></div>';
    app.insertBefore(host, document.querySelector('.footer') || null);
    const body = host.querySelector('.phase43-code-overlay-body');
    const title = host.querySelector('[data-code-title]');

    // Remember each routable tab's home so we can put it back exactly.
    const registry = new Map();
    Object.keys(CODING).forEach(name => {
      const el = document.getElementById(name + 'Tab');
      if (el) registry.set(name, { el, parent: el.parentNode, next: el.nextSibling });
    });
    let active = null;

    function restore(item) {
      if (!item || item.el.parentNode !== body) return;
      item.el.classList.add('hidden');
      if (item.next && item.next.parentNode === item.parent) item.parent.insertBefore(item.el, item.next);
      else item.parent.appendChild(item.el);
    }
    function close() {
      if (active) restore(active);
      active = null;
      host.classList.add('hidden');
      document.body.classList.remove('phase43-code-open');
    }
    function open(name) {
      const item = registry.get(name);
      if (!item) return close();
      if (active && active !== item) restore(active);
      active = item;
      item.el.classList.remove('hidden');
      body.appendChild(item.el);
      title.textContent = CODING[name];
      host.classList.remove('hidden');
      document.body.classList.add('phase43-code-open');
    }
    function currentTab() {
      return document.querySelector('.tabs button.active[data-tab]')?.dataset.tab
        || window.Codeopolis?.Phase44Lifecycle?.activeView?.() || 'challenge';
    }
    function sync() {
      // The Ionic mobile shell manages its own coding workspace — stand down.
      if (document.querySelector('#codeopolisIonicShell') || !matchMedia('(min-width: 900px)').matches) {
        return close();
      }
      const name = currentTab();
      if (CODING[name]) open(name); else close();
    }

    host.querySelector('[data-code-back]').addEventListener('click', () => {
      if (typeof window.switchTab === 'function') window.switchTab('city');
      else close();
    });

    // Re-sync after every tab change (buttons and programmatic calls both route
    // through window.switchTab). Wrap once, after Phase 44's lifecycle wrapper.
    const prev = window.switchTab;
    if (typeof prev === 'function' && !prev.__phase43CodeOverlay) {
      const wrapped = function () {
        const result = prev.apply(this, arguments);
        requestAnimationFrame(sync);
        return result;
      };
      wrapped.__phase43CodeOverlay = true;
      wrapped.__phase43Prev = prev;
      window.switchTab = wrapped;
    }

    (window.Codeopolis = window.Codeopolis || {}).phase43CodingOverlay = { open, close, sync };

    // World-first landing: if the app boots on a coding tab, show the city first
    // and let the player open coding deliberately.
    requestAnimationFrame(() => {
      if (CODING[currentTab()] && typeof window.switchTab === 'function') window.switchTab('city');
      else sync();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
