# Codeopolis

A mobile-first civilization/city-building game for learning Python interview engineering. Real judged code powers a living city; retained mastery controls civilization growth; mentors, recruiting, debugging, communication, and system design turn interview preparation into an engineering game.

## Phase 9 — Engineering Simulator

Phase 9 expands the game beyond whether the final code passes. It trains the work that surrounds a strong interview solution: explaining an approach, identifying assumptions and invariants, debugging broken production code, defending performance, communicating impact, and reasoning about larger systems.

Phase 9 is stacked on the Phase 8 branch because Phase 8 has not yet landed on `main`. It preserves the 52-problem bank, timeout-isolated Pyodide judge, adaptive learning, mastery economy, living city, characters, recruiting, and company interview loops.

### Local adaptive interviewer

The first interviewer implementation is deliberately local-first. It does not require an API key or external AI service, so it works in a hosted webpage or Scriptable WebView.

A rubric/NLP evaluator scores freeform explanations across:

- approach selection
- assumptions and constraints
- invariants
- edge cases
- time/space complexity
- tradeoffs

The interviewer identifies missing dimensions and generates an adaptive follow-up. After the relevant coding problem passes the real hidden-test judge, it asks a performance/scaling follow-up and records a combined reasoning score.

The system is architected so a future LLM-backed interviewer can replace or augment the local evaluator without changing the gameplay contract.

### Production debugging incidents

Phase 9 adds challenge-compatible debugging missions that run through the same Python worker and hidden tests as normal problems.

Current incidents include:

- duplicate-index bug in a hash-map lookup
- binary-search boundary/infinite-loop defects
- quadratic repeated-work performance bug in a sliding-window service

Players start from intentionally broken code, diagnose the violated invariant or repeated work, repair it, and pass hidden tests. Debugging completions award city/research resources and relationship progress with the infrastructure mentor.

### Performance and complexity defense

Passing code is no longer always the end of an interviewer session. The local interviewer can ask the player to justify the target complexity, explain which operation drives it, discuss memory-vs-CPU tradeoffs, or identify the practical bottleneck at 100× input size.

### Behavioral interviews

A behavioral practice system scores freeform stories for:

- Situation/context
- Task/ownership
- personal Actions
- Result
- measurable Evidence
- Reflection/learning

It encourages concise STAR-style answers with explicit ownership and quantified impact rather than memorized multiple-choice responses.

### Visual system-design lab

Phase 9 introduces the first visual architecture exercises:

- Social Timeline
- URL Shortener
- Distributed Job Runner

Players select architecture components on a visual board, then explain scaling and failure-handling decisions. Designs are scored on required components, useful optional infrastructure, and reasoning concepts such as caching, queues, partitioning, retries, idempotency, availability, and backpressure.

Passing designs grant research and relationship progress with the systems-architecture mentor.

### Engineering tab

A new **🧰 Engineer** surface combines:

- freeform reasoning interviewer
- debugging incidents
- visual system-design scenarios
- behavioral interview practice
- persistent best scores and completion progress

The existing Challenge, Learn, Mock, Team, Strategy, City, and career systems remain available.

## Phase 9 architecture

```text
src/
  interview/
    reasoning-evaluator.js   local freeform rubric evaluator
    ai-interviewer.js        adaptive reasoning + performance sessions
    behavioral.js            STAR/ownership/evidence scoring
    phase9-ui.js              engineering practice surface
    phase9-bootstrap.js       integration with verified mastery events

  game/
    debugging-system.js      broken-code production incidents
    system-design.js         visual architecture scenarios + scoring
```

The existing Python judge remains the source of truth for coding correctness. Phase 9 listens to `learning:mastered` and only advances coding-dependent interview flows after a verified pass.

## Core Phase 9 loop

1. Explain your intended approach before coding.
2. Receive an adaptive follow-up on missing reasoning.
3. Implement the solution in real Python.
4. Pass visible and hidden tests.
5. Defend runtime, memory, and scaling behavior.
6. Practice repairing intentionally broken production code.
7. Design larger systems and explain tradeoffs.
8. Practice behavioral communication with measurable evidence.
9. Feed stronger engineering judgment back into mentor, career, city, and recruiting progression.

## Existing systems retained

Codeopolis still includes:

- 52+ fully judged Python challenges plus Phase 9 debugging incidents
- Pyodide execution in a hard-timeout Web Worker
- adaptive practice, spaced recall, and mastery decay
- timed mocks and company interview encounters
- Candidate → Principal career progression
- interactive isometric city with roads, citizens, traffic, construction, and day/night rendering
- learning-aligned celebrations and Momentum
- durable Knowledge Index and mastery-gated buildings
- hidden discoveries and strategic compute doctrines
- learning-driven city crises
- civic contracts and megaprojects
- persistent engineering mentors and relationships
- fictional recruiting companies and narrative events

## Run locally

Serve the repository over HTTP:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The default Scriptable launcher points to:

`https://neffer77.github.io/l33t-interview-code/`

## Validation

`.github/workflows/validate.yml` recursively syntax-checks every JavaScript file and verifies local assets referenced by `index.html`. It automatically covers the modular Phase 9 files.

## Next milestone

The next interview-quality step should add an optional real LLM interviewer adapter, spoken responses where platform APIs permit, richer debugging scenarios, load/failure simulation in system design, and integrated full interview loops mixing coding, debugging, behavioral, and system-design rounds.

## Design principle

**The most emotionally rewarding actions should also train transferable engineering skill.** Passing code matters, but great interview performance also requires reasoning, debugging, communication, tradeoff analysis, and system thinking.
