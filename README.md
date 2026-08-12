# Codeopolis

A mobile-first civilization/city-building game for learning Python coding-interview patterns. Real judged interview problems power a living city, retained mastery controls civilization growth, and Phase 8 gives that progression a cast, narrative context, and in-world recruiting loop.

## Phase 8 — People & Possibility

Phase 8 adds characters, relationships, recruiting, narrative reactions, richer crisis follow-ups, and interview encounters without replacing the existing learning engine. The 52-problem Python bank, timeout-isolated judge, adaptive scheduling, mocks, mastery economy, interactive city, discoveries, doctrines, civic contracts, and megaprojects remain intact.

### Engineering team

Six persistent characters now inhabit Codeopolis:

- 🧠 Maya Chen — Staff Algorithms Engineer
- 🛠️ Theo Brooks — Infrastructure Engineer
- 🔬 Luna Alvarez — Research Scientist
- 🎙️ Marcus Reed — Engineering Manager
- 🏗️ Jin Park — Systems Architect
- 🚀 Ada Vale — Founder

Characters have specialties, relationship XP, levels, unlock conditions, and a persistent interaction log. Relationship progress is earned through relevant mastery, crisis work, and interview practice rather than dialogue clicking.

### Narrative reactions

The story layer reacts to meaningful game events:

- first-time and repeated mastery
- career progression
- city engineering incidents
- crisis resolution
- recruiting messages
- interview starts and outcomes

Mentor reactions are short and skill-oriented. They are intended to make progress emotionally legible without turning the app into a visual novel.

### Recruiting world

Five fictional companies can now contact the player when real readiness thresholds are met:

- 🤖 Nova Robotics
- ☁️ Atlas Cloud
- 🧬 Helix AI
- 🛡️ Vector Security
- 🛰️ Orbital Systems

Each company has a different skill profile and requires a combination of retained Knowledge Index, solved-problem breadth, and career rank before it can reach out.

Recruiting messages therefore represent demonstrated readiness, not random loot or passive timers.

### Interview encounters

Company interviews are three-round coding encounters. The coding problem for each round is selected from the existing judged challenge bank with preference for the company's technical focus.

A round only advances after the relevant problem passes the real hidden-test judge. After a successful coding round, the player receives a short communication follow-up covering skills such as:

- stating assumptions and invariants
- explaining failed edge cases
- discussing time/space tradeoffs
- comparing competing approaches
- justifying complexity

The communication component contributes to the final interview score, but it cannot replace working code.

Successful company loops award city resources and become persistent recruiting history. Completed companies are removed from the active inbox so they cannot be farmed repeatedly.

### Crisis chains

Phase 7 incidents now have narrative aftermath. Solving incidents such as a transit partition, cache stampede, planning deadlock, or scheduler overload can produce follow-up engineering reviews with the relevant specialist.

These aftermath beats reinforce the broader lesson behind the code—for example, moving from restoring graph connectivity to thinking about traffic concentration and resilience.

### Team UI

Phase 8 adds a **👥 Team** surface with:

- character roster and relationship levels
- mentor specialties
- recruiting inbox
- active interview round tracker
- story feed
- communication follow-up overlays
- interview result reports

Mission Control also surfaces the most recent team/recruiting development and active interview status.

## Phase 8 architecture

Phase 8 continues the modular `/src` migration:

```text
src/
  story/
    characters.js             roster + relationships
    recruiting.js             company readiness + offers
    narrative.js              milestone/reaction feed
    interview-encounters.js   coding + communication round controller
    crisis-chains.js          post-incident narrative chains
    phase8-ui.js              team/recruiting/story surfaces
    phase8-bootstrap.js       integration with verified learning events
```

The existing learning stack remains the source of truth. Phase 8 listens to `learning:mastered`, crisis, career, and other established events instead of inventing a parallel correctness system.

## Core Phase 8 loop

1. Practice the highest-value weak or due skill.
2. Pass the actual Python judge.
3. Build mastery, city capability, and mentor trust.
4. Resolve incidents alongside specialists.
5. Meet real recruiting thresholds.
6. Enter a fictional company's coding loop.
7. Pass judged coding rounds and communicate reasoning.
8. Receive an interview outcome and relationship/city progression.
9. Use the next weak skill, crisis, discovery, or career opportunity to continue.

## Existing systems retained

Codeopolis still includes:

- 52 fully judged Python problems
- arrays, hashing, windows, stacks, intervals, graphs, DP, linked lists, trees, BSTs, heaps, tries, and backtracking
- Pyodide execution in a hard-timeout Web Worker
- visible and hidden tests
- adaptive learning and mastery decay
- spaced recall
- timed practice and mock interviews
- Candidate → Principal career progression
- interactive isometric city placement
- roads, citizens, traffic, construction, day/night rendering
- learning-aligned celebrations and Momentum
- durable Knowledge Index
- hidden discoveries
- strategic compute doctrines
- learning-driven crises
- civic contracts and megaprojects

## Run locally

Serve the repository over HTTP:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The default Scriptable launcher points to:

`https://neffer77.github.io/l33t-interview-code/`

## Validation

`.github/workflows/validate.yml` recursively runs JavaScript syntax checks and verifies local assets referenced by `index.html`. It automatically covers all Phase 8 modules.

## Next game-quality milestone

### Phase 9 — AI interviewer, debugging, and deeper engineering simulation

The next major learning leap should make interviews and incidents less scripted:

- AI interviewer conversation with reasoning evaluation
- progressive interviewer hints rather than solution dumping
- communication scoring from freeform explanations
- debugging incidents using intentionally broken production-style code
- performance/complexity follow-ups
- richer behavioral rounds
- beginning of visual system-design simulations
- character-generated missions driven by current weak skills

## Design principle

**The most emotionally rewarding events should still require useful learning.** Characters provide attachment and context, but relationships, recruiting, story progression, and city advancement should continue to be earned primarily by demonstrated skill rather than passive interaction.
