# Codeopolis

A mobile-first civilization/city-building game for learning Python coding-interview patterns. Solving interview missions earns money and research points that grow your city and unlock technology.

## Phase 2

Codeopolis now has a real in-browser Python judge powered by Pyodide rather than the original structural keyword checker.

- 8 Python interview missions: hash maps, stacks, one-pass arrays, binary search, sliding window, two pointers, graph traversal, and dynamic programming.
- Real Python execution in WebAssembly with Pyodide 314.0.3.
- Separate visible tests for development and hidden edge-case tests for mission submission.
- Python exception and failed-test feedback.
- Runtime measurements per submission.
- Intended Big-O targets plus lightweight complexity coaching.
- Per-problem attempts, passes, best runtime, and last-solved timestamps.
- Persistent solution history and recent pass-rate metrics.
- A spaced-review queue that brings solved patterns back after increasing intervals.
- Money + research reward economy, buildable city, research tree, levels, streaks, hints, and sequential mission unlocking.
- Existing Phase 1 `localStorage` saves are migrated forward instead of discarded.
- Responsive webpage and Scriptable iOS WebView launcher remain supported.

## Run locally

Serve the directory rather than opening the file directly so the Pyodide runtime and assets load consistently:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The first visit downloads the Pyodide runtime from jsDelivr, so Python may take a moment to become ready. Later loads can benefit from normal browser caching.

## iOS / Scriptable

Host `index.html`, `app.js`, and `styles.css` together. Copy `scriptable.js` into a new Scriptable script. The included launcher expects GitHub Pages at:

`https://neffer77.github.io/l33t-interview-code/`

Enable GitHub Pages after merging/publishing the site, or replace `GAME_URL` with any URL where the site is hosted. You can add the Scriptable script to an iOS Shortcut or Home Screen.

## How judging works

`Run tests` executes the visible examples only. `Submit mission` runs the visible suite first and then an additional hidden edge-case suite. Rewards are granted only after all tests pass.

Each submission executes the user's function inside a fresh Python namespace. Test arguments are recreated for every test case so solutions that mutate their inputs do not contaminate later cases.

The complexity feedback is intentionally heuristic. The stated target complexity is the learning objective; the browser does not attempt to mathematically prove Big-O from arbitrary Python source.

## Current safety/runtime limitation

Pyodide executes locally in the page. This keeps the project backend-free and is convenient for iOS, but an intentionally infinite loop in submitted Python can still occupy the page's execution thread. Moving execution into a Web Worker with a hard timeout is a good hardening step for a later iteration.

## Roadmap

### Phase 3 — deeper civilization game
- Isometric/canvas city map.
- District specialization tied to interview patterns.
- Population, happiness, energy, production, and research rates.
- Tech-tree prerequisites.
- Random city events that trigger review questions.
- Daily quests and boss interviews.
- Stronger mastery-driven unlock requirements rather than completion alone.

### Phase 4 — learning system
- 75–150 curated problems organized by pattern.
- Adaptive problem selection based on weak patterns.
- Recall questions before coding and pattern-recognition drills.
- Interview timer mode and company/topic playlists.
- More sophisticated mastery decay and scheduled review.
- Optional reference solutions and post-solve walkthroughs.

## Design principle

The civilization layer should reward learning rather than distract from it: the player should always know which Python pattern they are practicing, why it works, what tests demonstrated correctness, and what city progress they earned by demonstrating it.
