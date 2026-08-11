# Codeopolis

A mobile-first civilization/city-building game for learning Python coding-interview patterns. Real interview missions power the city, adaptive mastery decides what to review, and scored mock interviews measure readiness under pressure.

## Phase 5

Phase 5 focuses on interview realism and long-term progression while retaining the Phase 3 civilization systems and Phase 4 adaptive-learning engine.

### Problem bank and real data structures

- The bank now contains **52 fully judged Python problems**.
- Phase 5 adds linked lists, binary trees, BSTs, heaps, tries, and more backtracking.
- The isolated Python worker now provides realistic `ListNode` and `TreeNode` classes.
- Challenge adapters can convert compact test fixtures into:
  - one linked list
  - two linked lists
  - one tree
  - two trees
  - a tree plus real `p` / `q` node references
- Returned linked lists and trees are normalized back into deterministic test representations.
- Node-returning problems can be judged by returned node value.
- Existing arrays, hashing, intervals, graphs, DP, sliding-window, binary-search, and other Phase 4 problems remain available.

### Mock interviews

The new **Mock** tab creates multi-problem adaptive interviews from the real problem bank.

Available presets:

- 30 minutes / 2 problems
- 45 minutes / 3 problems
- 60 minutes / 4 problems

Mock interviews:

- deliberately mix problem districts where possible
- use the normal visible + hidden Python judge
- count only actual hidden-test passes as solved
- track attempts and runtimes per problem
- track hints used during the interview
- enforce a session clock
- produce a 0–100 scorecard using correctness, pace, and hint independence
- save the last 30 interview scorecards locally
- award money and research based on the final score

### Career ladder

Mock performance and breadth of solved problems now drive a persistent career track:

1. Candidate
2. Software Engineer
3. Senior Engineer
4. Staff Engineer
5. Principal Engineer

Promotions require both a minimum solved-problem count and a minimum mock-interview score. Promotions award city money, research, and happiness, giving long-term civilization progression a concrete interview-readiness objective.

### Adaptive learning retained

Phase 4 systems remain active:

- adaptive next-problem recommendations
- mastery decay
- spaced reviews
- recall drills
- topic playlists
- generic company-style practice mixes
- post-solve walkthroughs and reference solutions
- mastery-driven boss interviews
- district mastery XP

Company-style playlists are generic training mixes, not claims about leaked or current company interview banks.

## Python judge architecture

Python runs in `python-worker.js` using Pyodide 314.0.3.

`worker-bridge.js` sends the player solution, tests, and optional data-structure adapters into the worker. Every submission has a 5-second hard timeout. A runaway solution terminates and restarts the worker instead of freezing the page.

For data-structure problems the worker injects `ListNode` and `TreeNode` into the solution namespace, matching normal interview-style function signatures.

## Core Phase 5 loop

1. Use the adaptive coach to train weak or decaying patterns.
2. Solve real Python problems against visible and hidden tests.
3. Practice linked lists, trees, heaps, tries, graphs, arrays, and DP.
4. Enter a timed multi-problem mock interview.
5. Receive a scored interview report.
6. Use weak-pattern data to drive the next training block.
7. Earn career promotions as breadth and mock performance improve.
8. Spend rewards on city research and infrastructure.
9. Repeat until durable mastery, not just one-time completion, improves.

## Run locally

Serve the repository over HTTP so Web Workers and Pyodide load consistently:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Avoid relying on `file://` loading because browser worker/security behavior is less consistent.

## iOS / Scriptable

Host the site files together and use `scriptable.js` as the iOS WebView launcher. The default launcher expects:

`https://neffer77.github.io/l33t-interview-code/`

The same Scriptable script can be launched through an iOS Shortcut or Home Screen icon.

Phase 5 adds these web assets to the existing set:

- `phase5.js`
- `phase5-career.js`
- `phase5.css`

## Module layout

- `app.js` — civilization systems and core challenge UI
- `phase4.js` — adaptive learning and Phase 4 challenge bank
- `adaptive-boss.js` — weakness-driven era interviews
- `worker-bridge.js` — timeout-isolated judge routing
- `python-worker.js` — Pyodide runtime, tests, and data-structure adapters
- `phase5.js` — Phase 5 challenges, mock interviews, and mock analytics
- `phase5-career.js` — career progression and promotion UI

## Current limitations / next phase

- 52 problems is substantially broader, but still below the long-term 75–150 curated target.
- Mock interviews currently focus on coding rather than behavioral or system-design rounds.
- Session analytics track correctness, runtime, hints, and score, but do not yet track time-to-first-run or detailed per-test debugging sequences.
- The challenge catalog should eventually move into dedicated data modules instead of phase-specific JavaScript files.
- Freeform city placement, roads, richer district visuals, achievements, and prestige progression remain future civilization upgrades.
- The legacy page still initializes main-thread Pyodide before the worker starts; removing that redundant load would improve startup memory and performance.

## Suggested Phase 6

- Expand to 75–100 carefully tested problems.
- Add behavioral interview prompts and system-design mini-rounds to mock sessions.
- Record time-to-first-run, compile/runtime errors, failed edge-case categories, and revision count.
- Generate a detailed post-interview scorecard by pattern and interview dimension.
- Add achievements, prestige, freeform city placement, roads, and district landmarks.
- Remove the redundant main-thread Pyodide initialization.

## Design principle

The civilization should make sustained practice more rewarding without hiding the learning objective. Every progression system should point back to real interview competence: pattern recognition, correct code, edge-case handling, complexity reasoning, durable recall, and performance under realistic time pressure.
