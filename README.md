# Codeopolis

A mobile-first civilization/city-building game for learning Python coding-interview patterns. Real interview missions power a city you can physically shape, adaptive mastery decides what to review, and scored mock interviews measure readiness under pressure.

## Phase 6 — Living Codeopolis

Phase 6 changes the priority from adding more interview questions to making the existing learning loop feel like a real game. The 52-problem Phase 5 bank, adaptive scheduler, career ladder, mock interviews, and timeout-isolated Python judge remain intact.

The new goal is simple: **the most exciting actions in the game should also be the actions that produce real learning.**

### Interactive city

The old fixed pseudo-isometric display is replaced by a persistent interactive Canvas 2D world.

- 12×8 isometric city grid with a saved world model.
- Drag to pan on desktop or mobile.
- Scroll/pinch to zoom.
- Tap tiles to inspect, build, or edit roads.
- Purchased buildings enter a placement inventory instead of appearing at a fixed location.
- Existing buildings can be relocated without losing ownership.
- Roads are real saved map objects and cost city credits to construct.
- Existing Phase 1–5 saves migrate their current buildings into a starter city automatically.
- Camera position, layout, roads, audio preference, and world state persist locally.

### Living simulation

The city now moves even when the player is not clicking menus.

- Animated citizens scale with city population.
- Cars follow connected road tiles.
- Agents choose new connected road segments as they move.
- Day/night lighting runs on an accelerated world clock.
- Buildings illuminate at night.
- Construction sites grow over several seconds after placement.
- Construction cranes and particle effects make new infrastructure visibly arrive.
- Reward particles can focus on the district associated with the solved problem.

The simulation remains intentionally lightweight and dependency-free so the same app can run in a normal browser and the Scriptable iOS WebView.

### Mastery changes the skyline

District mastery is no longer just a number in a menu. Building height and visual intensity scale with district XP.

For example, repeated graph mastery makes Graph Transit infrastructure visibly more developed, while DP mastery grows Dynamic Planning structures. The long-term intent is for a screenshot of a city to communicate what the player actually knows.

### Game feel and audiovisual feedback

Phase 6 adds a procedural game-feel layer without requiring external audio assets.

- Web Audio API solve/build/discovery cues generated at runtime.
- Optional vibration/haptic requests on supported devices.
- Sound can be muted from the city toolbar.
- Major solve celebrations are skippable.
- Reduced-motion browser preferences disable the strongest animations.
- The camera can fly to the relevant algorithm district after a meaningful solve.

### Learning-aligned RewardEngine

Phase 6 introduces a centralized reward presentation layer around the existing economy rather than replacing the proven Phase 1–5 scoring.

The engine observes the real result of the Python judge and reacts to:

- new problem mastery
- spaced/repeated mastery
- problem difficulty
- city district XP earned
- actual money/research changes
- successful recall drills

It does **not** reward waiting, repeatedly opening the app, or tapping idle reward buttons.

#### Momentum instead of brittle streaks

Phase 6 adds a 0–100 Momentum meter. Meaningful learning raises momentum. Time away lets it decline gradually, but missing a day never resets months of progress to zero.

This is designed to create a strong “I am in a groove” signal without making absence feel catastrophic.

#### Research breakthroughs

Newly mastered problems can occasionally trigger a deterministic surprise **Research Breakthrough**. Breakthroughs are intentionally gated behind a real first solve and can happen only once per problem.

A breakthrough gives a small research/happiness bonus and an extra audiovisual reveal. Variable reinforcement is therefore attached to demonstrated learning rather than passive engagement.

### Solve celebration

A successful submission can now trigger a dedicated game payoff showing:

- mission mastered / mastery reinforced
- credits earned
- research earned
- district mastery gained
- current momentum
- optional research breakthrough

The corresponding city district receives particle effects and the camera can move toward it. Hard/new solves receive stronger presentation than routine reviews, while the celebration remains dismissible.

## Phase 6 architecture

Phase 1–5 grew through fast additive scripts. Phase 6 starts the migration toward a maintainable game architecture without risking the existing learning/judge stack.

```text
src/
  core/
    namespace.js       shared namespace, utilities, event bus

  game/
    world.js           saved grid, roads, placement, migration
    camera.js          isometric transforms, pan/zoom/touch input
    simulation.js      citizens, traffic, day/night, particles
    renderer.js        procedural isometric rendering
    audio.js           generated sound + optional haptics
    reward-engine.js   learning-aligned reward presentation
    game-ui.js         planner controls, placement, celebrations
    bootstrap.js       compatibility integration with Phase 1–5
```

This lets future civilization, story, quest, audio, and rendering systems grow inside `/src` rather than continuing the `phaseN.js` pattern indefinitely.

The existing learning layer is intentionally preserved:

- `app.js` — original civilization systems and challenge UI
- `phase4.js` — adaptive learning, mastery decay, recall, walkthroughs
- `adaptive-boss.js` — weakness-driven era interviews
- `worker-bridge.js` — timeout-isolated judge routing
- `python-worker.js` — Pyodide and realistic data-structure adapters
- `phase5.js` — 52-problem bank additions and mock interviews
- `phase5-career.js` — career progression

### Integration strategy

`bootstrap.js` loads last. It wraps the existing public gameplay hooks rather than duplicating them:

- `submitCode()` still decides whether Python is correct; Phase 6 only presents the verified outcome.
- `buyBuilding()` still charges the established economy; Phase 6 turns the purchased structure into placement inventory.
- `render()` still renders all learning/career panels; Phase 6 decorates them and owns the city canvas.
- `resetGame()` still resets the established save; Phase 6 reloads cleanly after a confirmed reset.

This is intentionally lower risk than rewriting the judge, scheduler, career, and city economy at the same time.

## Phase 5 systems retained

The Phase 6 branch keeps all Phase 5 functionality:

- **52 fully judged Python problems**.
- Arrays, hashing, windows, pointers, intervals, graphs, Union-Find, DP, backtracking, linked lists, trees, BSTs, heaps, and tries.
- Real `ListNode` and `TreeNode` adapters inside the Python worker.
- 30 / 45 / 60 minute multi-problem mock interviews.
- Hidden-test-based mock scoring.
- Adaptive practice and mastery decay.
- Spaced review and recall drills.
- Post-solve walkthroughs.
- Candidate → Software Engineer → Senior → Staff → Principal career progression.

## Core Phase 6 loop

1. A useful adaptive challenge is selected.
2. Recognize the pattern and write real Python.
3. Run visible tests and debug failures.
4. Submit against hidden tests in the isolated worker.
5. A verified solve creates an audiovisual payoff.
6. The matching district visually responds.
7. Spend earned resources on a building or road.
8. Physically choose where that progress appears in the city.
9. Watch the civilization become more alive and specialized.
10. Follow the next adaptive challenge, mock interview, review, or city objective.

## Run locally

Serve the repository over HTTP so Web Workers and Pyodide work consistently:

```bash
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

Avoid relying on `file://` loading because worker/security behavior is less consistent.

## iOS / Scriptable

Host the complete repository site and use `scriptable.js` as the WebView launcher. The default launcher points to:

`https://neffer77.github.io/l33t-interview-code/`

The Phase 6 renderer uses pointer events and supports touch drag/pinch interaction. Web Audio still follows browser gesture rules, so sound becomes available after the first user interaction.

## Validation

`.github/workflows/validate.yml` now recursively runs `node --check` against every JavaScript file in the repository and verifies that every local asset referenced by `index.html` exists.

This matters more after Phase 6 because game code is intentionally split into multiple modules.

## Next game-quality milestones

Phase 6 establishes the engine foundation. The next high-value work should build *on this engine* rather than going back to a flat question-bank roadmap.

### Phase 7 — mastery economy and discoveries

- Centralize actual economic reward calculation, not only presentation.
- Knowledge-gated buildings and megaprojects.
- Hidden technology discoveries unlocked by combinations of mastered patterns.
- More meaningful strategic research choices.

### Phase 8 — crises, quests, and narrative

- City incidents whose engineering problem maps naturally to an interview pattern.
- Multi-session megaprojects.
- Characters who give missions and react to progress.
- Recruiting messages and interview boss encounters presented as in-world events.

### Later

- AI interviewer and communication scoring.
- Debugging incidents.
- System-design city simulation.
- Branching careers and fictional companies.
- Collections and learning-aligned achievements.
- Prestige / founder endgame.
- Expansion toward 100–150 high-quality problems after the surrounding game is compelling enough to make players want the next challenge.

## Design principle

Codeopolis should not hide studying behind arbitrary points. The civilization exists to make real learning outcomes emotionally legible: a solved problem should change the world, durable mastery should change the skyline, and the most satisfying actions in the game should also be the actions that make the player better at interviews.
