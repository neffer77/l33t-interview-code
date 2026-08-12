# Phase 28 — PWA & Scriptable Hardening

Phase 28 packages Codeopolis as a more resilient iOS/browser app without splitting gameplay into separate implementations.

## Browser / PWA

- Adds a web app manifest with standalone display metadata.
- Adds iOS web-app metadata dynamically through the Phase 28 runtime.
- Registers a same-origin service worker that caches the local application shell and learned assets after first use.
- Keeps third-party resources such as Pyodide outside the service worker cache policy.
- Supports Add to Home Screen on iPhone/iPad and normal install flows in browsers that support PWAs.

## Save resilience

- Creates a backup copy of the primary Codeopolis save on startup and page hide.
- Adds JSON file export with a dated filename.
- Adds JSON file import with object validation and a pre-import backup.
- Existing legacy export remains compatible.

## Scriptable

`scriptable/Codeopolis.js` opens the deployed HTTPS build in a Scriptable WebView. The launcher stores its URL in iCloud Documents under `Codeopolis/launcher.json`, so the URL can be changed without modifying the game.

This intentionally avoids embedding a duplicate copy of the application inside the Scriptable script. Browser, PWA, and Scriptable therefore execute the same authoritative game build and save schema.

## Offline boundary

The service worker provides an offline application shell and caches same-origin assets as they are requested. Python execution still depends on Pyodide being available/cached by the browser environment; Phase 28 does not pretend the externally hosted Python runtime is guaranteed offline on a cold install.

## Security / privacy

No new analytics or backend is introduced. Save import is local and validates that the uploaded JSON has an object root before replacing the active save.