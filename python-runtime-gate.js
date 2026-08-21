// De-Bloat P0: keep the main-thread Pyodide runtime dormant unless the
// established Phase 43 fallback explicitly needs it (Scriptable, no Worker,
// or a failed worker boot). Normal browsers use python-worker.js only.
(() => {
  'use strict';

  const VERSION = '314.0.3';
  const BASE = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/`;
  let fallbackAllowed = false;
  let releaseFallback;
  let runtimeBoot = null;

  const fallbackGate = new Promise(resolve => { releaseFallback = resolve; });

  function shouldAllowFallback() {
    return fallbackAllowed ||
      window.Codeopolis?.phase43P0?.fallbackEnabled === true ||
      window.__CODEOPOLIS_FORCE_MAIN_THREAD_PYTHON__ === true;
  }

  function allowFallback(reason = 'explicit fallback') {
    if (!fallbackAllowed) {
      fallbackAllowed = true;
      releaseFallback?.();
      window.dispatchEvent(new CustomEvent('codeopolis:python-main-thread-fallback', {
        detail: { reason }
      }));
    }
    return bootRuntime();
  }

  async function bootRuntime(options = {}) {
    if (!runtimeBoot) {
      runtimeBoot = (async () => {
        const mod = await import(`${BASE}pyodide.mjs`);
        return mod.loadPyodide(Object.assign({ indexURL: BASE }, options));
      })();
    }
    return runtimeBoot;
  }

  // app.js still calls loadPyodide() during its legacy bootstrap. On normal
  // Worker-capable browsers that call intentionally waits here and causes no
  // Pyodide download. If Phase 43 later enables fallback, the same pending call
  // and the fallback path share one memoized runtime boot.
  window.loadPyodide = async function gatedLoadPyodide(options = {}) {
    if (!shouldAllowFallback()) await fallbackGate;
    return bootRuntime(options);
  };

  window.PYODIDE_VERSION = VERSION;
  window.CodeopolisPythonRuntimeGate = Object.freeze({
    VERSION,
    BASE,
    allowFallback,
    isFallbackAllowed: () => shouldAllowFallback(),
    hasBooted: () => !!runtimeBoot
  });
})();
