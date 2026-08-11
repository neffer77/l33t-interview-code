# Codeopolis

A mobile-first civilization/city-building game for learning Python coding-interview patterns. Solving real interview missions powers a growing city, unlocks specialized districts, and advances the civilization through increasingly difficult interview eras.

## Phase 3

Phase 3 turns the coding judge into the economic engine for a deeper civilization game.

### Coding and mastery

- 8 Python interview missions covering hash maps, stacks, arrays, binary search, sliding windows, two pointers, graph traversal, and dynamic programming.
- Real Python execution in WebAssembly with Pyodide 314.0.3.
- Visible tests for development and hidden edge-case tests for mission submission.
- Exception, expected-vs-actual, runtime, and target-complexity feedback.
- Attempts, passes, best runtime, history, and spaced review tracking.
- Solves now award mastery XP to the matching city district.
- Re-solving mastered problems still advances district mastery, so review has an in-game purpose.

### Civilization systems

- Pseudo-isometric canvas city map designed to remain lightweight on iPhone and in Scriptable WebView.
- Specialized algorithm districts:
  - Array Foundry
  - Hash Bazaar
  - Stack Quarter
  - Search Observatory
  - Graph Transit
  - Dynamic Planning Bureau
- Population, happiness, energy, passive money production, and passive research production.
- Buildings with district identities, resource yields, energy costs, technology requirements, and era requirements.
- Offline/passive production capped to six hours between sessions.
- Technology tree with explicit prerequisites instead of a flat shop.
- Civic Automation technology for a passive-production multiplier.
- Random city events with consequential choices and a persistent event log.
- Daily coding quests with city rewards.
- Multi-question boss interviews that gate later civilization eras.
- Stronger mission unlocks: later interview problems require both earlier mastery and progression through era bosses.
- Existing Phase 1 and Phase 2 saves migrate forward through additive defaults rather than being wiped.

## Core game loop

1. Recognize an interview pattern.
2. Write and test real Python.
3. Pass visible and hidden tests.
4. Earn money, research, XP, and district mastery.
5. Build specialized city infrastructure.
6. Research prerequisite technologies.
7. Maintain population, happiness, and energy.
8. Complete reviews and daily quests.
9. Pass an era boss interview.
10. Unlock harder problems and a more advanced civilization.

## Run locally

Serve the directory so Pyodide and browser assets load consistently:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The first visit downloads the Pyodide runtime from jsDelivr. Normal browser caching helps later launches.

## iOS / Scriptable

Host `index.html`, `app.js`, and `styles.css` together. Copy `scriptable.js` into a new Scriptable script. The included launcher expects GitHub Pages at:

`https://neffer77.github.io/l33t-interview-code/`

Enable GitHub Pages after merging/publishing the site, or replace `GAME_URL` with another hosted copy. The same launcher can be placed behind an iOS Shortcut or Home Screen icon.

## Python judge architecture

`Run tests` executes public examples. `Submit mission` executes public tests and then hidden edge cases. Rewards are granted only when all tests pass.

Each submission executes the player's function in a fresh Python namespace. Arguments are recreated for each case so input mutation does not contaminate later tests.

Complexity coaching remains intentionally heuristic. The target Big-O shown on the mission is the learning objective; arbitrary Python source is not formally analyzed for asymptotic complexity.

## Current limitations

Pyodide still executes submitted code on the page's main thread. A deliberately infinite loop can freeze the page. The next technical hardening step should move the judge into a Web Worker and enforce a hard execution timeout.

The city map is a lightweight pseudo-isometric canvas rather than a full tile-placement editor. Phase 3 focuses on tying civilization state to learning progression before adding freeform placement, roads, animated citizens, or richer simulation AI.

## Roadmap

### Phase 4 — adaptive learning system

- Expand to 75–150 curated interview problems organized by pattern.
- Adaptive mission selection based on weak patterns and historical mistakes.
- Recall questions before coding and pattern-recognition drills.
- Interview timer mode and company/topic playlists.
- More sophisticated mastery decay and scheduled review.
- Optional reference solutions and post-solve walkthroughs.
- Boss interviews built from live mastery weaknesses rather than fixed questions.
- Web Worker Python judge with hard execution timeout.

### Later civilization upgrades

- Freeform tile placement and roads.
- Animated city growth and district landmarks.
- More event chains and policies.
- Resource specialization by district level.
- Citizen/jobs simulation tied to algorithm mastery.
- Achievement system and long-term prestige/new-game progression.

## Design principle

The civilization layer should reward learning rather than distract from it: the player should always know which Python pattern they are practicing, why the solution works, what tests demonstrated correctness, and what city progress was earned by demonstrating mastery.