# Codeopolis

A mobile-first civilization/city-building game for learning Python coding-interview patterns. Solving interview missions earns money and research points that grow your city and unlock technology.

## MVP

- 8 Python interview missions: hash maps, stacks, one-pass arrays, binary search, sliding window, two pointers, graph traversal, and dynamic programming.
- Money + research reward economy.
- Buildable city and research technology tree.
- Levels, streaks, hints, mastery tracking, and mission unlocking.
- Responsive single-page web app with no dependencies/build step.
- Local save via `localStorage`.
- Scriptable launcher for iPhone/iPad.

## Run locally

Open `index.html` directly, or serve the directory:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## iOS / Scriptable

The simplest architecture is to host the same `index.html` as a webpage and let Scriptable open it in a native WebView. Copy `scriptable.js` into a new Scriptable script. The included launcher expects GitHub Pages at `https://neffer77.github.io/l33t-interview-code/`.

Enable GitHub Pages after merging/publishing the site, or replace `GAME_URL` with any URL where `index.html` is hosted. You can add the Scriptable script to an iOS Shortcut or Home Screen.

## Important MVP limitation

The browser cannot execute Python safely by itself, so this first version uses lightweight structural checks to make the learning/game loop immediately playable. It does **not** claim those checks prove a solution is correct.

The next major upgrade should add a real Python execution/test engine, preferably Pyodide for fully client-side Python execution or a sandboxed backend runner.

## Roadmap

### Phase 2 — real interview judge
- Pyodide Python runtime.
- Public + hidden test cases.
- Runtime and complexity feedback.
- Test-case visualization.
- Solution history and spaced repetition.

### Phase 3 — deeper civilization game
- Isometric/canvas city map.
- District specialization tied to interview patterns.
- Population, happiness, energy, production, and research rates.
- Tech-tree prerequisites.
- Random city events that trigger review questions.
- Daily quests and boss interviews.

### Phase 4 — learning system
- 75–150 curated problems organized by pattern.
- Adaptive problem selection based on weak patterns.
- Recall questions before coding and pattern-recognition drills.
- Interview timer mode and company/topic playlists.
- Mastery decay and scheduled review.

## Design principle

The civilization layer should reward learning rather than distract from it: the player should always know which Python pattern they are practicing, why it works, and what city progress they earned by demonstrating it.
