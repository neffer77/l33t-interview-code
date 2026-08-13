# Phase 39 — Beta Readiness

Phase 39 freezes feature expansion long enough to verify that the accumulated Codeopolis systems are testable as one product.

## Automated gates

CI now checks:

- JavaScript syntax across the repository
- local assets referenced by `index.html`
- required PWA and Scriptable runtime assets
- phase runtime/loader presence through Phase 38
- core evidence event contracts used by learning, Interview Day, and engineering projects
- manifest standalone behavior
- Scriptable WebView launch contract

Run locally with:

```bash
node tests/beta-smoke.mjs
python3 -m http.server 8000
```

## Browser smoke path

On a clean origin/localStorage state verify:

1. App boots without console errors.
2. A Python challenge can execute and pass judged tests.
3. A verified solve produces mastery/currency/city feedback.
4. Navigation reaches Learn, Engineer, Interview Day, City, relationships, team missions, and squad projects.
5. Save export creates JSON and import rejects malformed data.
6. Reload preserves progress.

Then repeat with an existing pre-Phase-39 save to exercise migrations.

## iOS/PWA

After GitHub Pages is enabled for Actions deployments, open the hosted game in Safari, add it to Home Screen, launch standalone, reload, and verify persistence. Test one judged Python problem after Pyodide has loaded at least once online.

## Scriptable

Run `scriptable/Codeopolis.js`. Confirm the hosted URL loads in WebView, progress persists across launches, and a judged challenge executes.

## Boundary

Automated checks cannot substitute for real Safari/Scriptable execution. iOS WebView persistence, service-worker behavior, external Pyodide caching, file pickers, and Home Screen installation require a physical-device smoke test.
