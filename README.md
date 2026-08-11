# Codeopolis

A mobile-first civilization/city-building game for learning Python coding-interview patterns. Solving real interview missions powers a growing city, unlocks specialized districts, and advances the civilization through increasingly difficult interview eras.

## Phase 4

Phase 4 turns Codeopolis into an adaptive interview-training system instead of a fixed sequence of problems.

### Adaptive learning

- 32 fully testable Python interview problems, expanded from the original 8.
- Problems span hashing, arrays, two pointers, sliding windows, monotonic stacks, binary search, intervals, greedy, graph traversal, topological sort, Union-Find, backtracking, and dynamic programming.
- Adaptive mission scoring considers:
  - current mastery strength
  - time-based mastery decay
  - scheduled reviews
  - recent failed submissions
  - whether a problem is new
  - under-trained city districts
- Spaced-review intervals grow after successful reviews and reset after failures.
- Effective mastery decays when a learned pattern has not been revisited.
- The Learn tab shows the highest-priority practice queue.
- Recall drills test pattern recognition before coding and award small research bonuses.
- Interview timer blocks support 20, 30, and 45 minute practice sessions.
- Topic playlists include Foundations, Arrays & Windows, Graphs, and Dynamic Programming.
- Company-style practice mixes are included for variety. These are curated practice categories, **not** claims about current or leaked company interview question lists.
- Post-solve walkthroughs explain the recognition clue, intended complexity, core idea, and an optional reference solution.
- Reference solutions remain hidden until after a problem has been solved.
- Era boss interviews now dynamically target the player’s weakest current patterns rather than using only a fixed question set.

### Real Python judging

- Real Python execution remains powered by Pyodide 314.0.3.
- Visible tests support development; hidden tests determine mission completion.
- Python exceptions, expected-vs-actual output, runtime, and complexity guidance are shown in the UI.
- Phase 4 moves actual submissions into `python-worker.js`, a dedicated Web Worker.
- Every judge request has a 5-second hard timeout.
- If submitted Python hangs or contains an infinite loop, the worker is terminated and restarted instead of freezing the Codeopolis UI.
- The original main-thread Pyodide initialization still exists for Phase 3 compatibility, but Phase 4 judging is routed through the worker bridge.

### Civilization systems retained from Phase 3

- Pseudo-isometric canvas city.
- Specialized algorithm districts.
- Population, happiness, energy, money production, and research production.
- Buildings with technology and era prerequisites.
- Offline production capped to six hours.
- Technology tree.
- Random city events.
- Daily coding quests.
- Era progression and boss interviews.
- District mastery XP tied directly to coding practice.
- Existing Phase 1–3 saves migrate forward through additive state defaults.

## Core learning loop

1. Recall the underlying pattern.
2. Let the adaptive coach select a weak/new/due problem, or choose a playlist.
3. Optionally start an interview timer.
4. Write Python and run visible tests.
5. Submit against hidden edge cases in the timeout-isolated worker.
6. Earn city resources and district mastery.
7. Read the post-solve walkthrough only after proving the solution.
8. Let Codeopolis schedule the pattern for later review.
9. Revisit the problem as mastery decays.
10. Face boss interviews built around current weak areas.

## Problem bank

The current Phase 4 bank contains 32 judged problems. The architecture now supports continued expansion without making `app.js` larger: Phase 4 problems and learning logic live in `phase4.js`.

The next content milestone is expanding the curated bank toward 75–150 problems while keeping test quality, explanations, and pattern coverage high rather than padding the bank with low-value variants.

## Run locally

Serve the directory so Web Workers, Pyodide, and browser assets load consistently:

```bash
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

Do not rely on opening `index.html` directly from `file://`; worker and browser security behavior is more consistent over HTTP.

The first visit downloads Pyodide from jsDelivr. Later launches can use normal browser caching.

## iOS / Scriptable

Host these files together:

- `index.html`
- `styles.css`
- `app.js`
- `phase4.js`
- `adaptive-boss.js`
- `worker-bridge.js`
- `python-worker.js`

Copy `scriptable.js` into a Scriptable script. The included launcher expects GitHub Pages at:

`https://neffer77.github.io/l33t-interview-code/`

The same Scriptable launcher can be run from an iOS Shortcut or Home Screen icon.

## Architecture

`app.js` contains the Phase 3 civilization and core judge UI.

`phase4.js` extends the game with the larger problem bank, adaptive scheduling, mastery decay, playlists, timer mode, recall drills, and walkthroughs.

`adaptive-boss.js` replaces fixed-only boss questions with questions selected from current weak patterns.

`worker-bridge.js` routes judge requests away from the page thread and enforces the execution timeout.

`python-worker.js` owns the isolated Pyodide runtime and test execution.

This modular approach keeps Phase 4 from turning the original application file into a single increasingly fragile script.

## Current limitations

- The bank is 32 problems, not yet the long-term 75–150 target.
- Complexity coaching is heuristic; arbitrary Python source is not formally proven to satisfy a Big-O bound.
- The worker timeout is currently fixed at 5 seconds. Very slow devices or future computationally heavy problems may require per-problem timeout policies.
- Pyodide is still initially loaded by the legacy Phase 3 page path as well as inside the judge worker. A future cleanup can remove the redundant main-thread runtime initialization and reduce memory/startup overhead.
- Company-style playlists are intentionally generic practice mixes rather than scraped or purportedly current interview banks.

## Suggested next phase

### Phase 5 — scale, realism, and long-term progression

- Expand the curated bank toward 75–150 high-quality problems.
- Move challenge data into dedicated data modules rather than keeping it alongside learning logic.
- Add tree, linked-list, heap, trie, and advanced graph data structures to the Python test harness.
- Add full mock-interview sessions containing multiple problems plus behavioral/system-design prompts.
- Add session summaries: time-to-first-run, failed edge cases, hints used, complexity quality, and pattern recognition accuracy.
- Add freeform city placement, roads, district landmarks, and stronger visual growth.
- Add achievements and prestige/new-game progression tied to durable mastery rather than raw solve count.

## Design principle

The civilization layer should reward learning rather than distract from it: the player should always know what pattern they are practicing, why the solution works, what tests demonstrated correctness, how durable that mastery currently is, and what city progress was earned by demonstrating it.
