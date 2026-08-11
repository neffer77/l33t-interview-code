# Codeopolis

A mobile-first civilization/city-building game for learning Python coding-interview patterns. Real judged interview problems power a living city, adaptive mastery decides what to review, and the civilization increasingly reflects what the player can actually remember and apply.

## Phase 7 — Mastery Civilization

Phase 7 builds directly on the interactive city and game-feel engine from Phase 6. The central design change is that **money is no longer sufficient to build the best civilization**. Advanced infrastructure, discoveries, megaprojects, and strategy now depend on durable knowledge.

The 52-problem Python bank, timeout-isolated Pyodide judge, adaptive scheduler, mock interviews, career ladder, living Canvas city, touch controls, roads, citizens, traffic, day/night cycle, Momentum, and solve celebrations remain intact.

## Mastery economy

Phase 7 introduces a durable **Knowledge Index** derived from the player's retained mastery across the six major algorithm districts:

- Arrays / windows / pointers
- Hashing / retrieval
- Data structures
- Search
- Graphs
- Dynamic programming

A district's score is based on solved breadth plus current effective mastery, including Phase 4 mastery decay. This means a problem solved once months ago is less economically meaningful than a pattern that can still be recalled and applied.

Knowledge now affects the game in two ways:

1. A modest global knowledge multiplier improves passive money and research production.
2. Advanced buildings have explicit knowledge gates.

Examples:

- Hash Market requires Hash mastery.
- Search Observatory requires Search mastery.
- Graph Transit Hub requires Graph mastery plus the Network Science discovery.
- DP Research Lab requires Dynamic Programming mastery plus the Dynamic Planning discovery.
- Algorithm Tower requires meaningful breadth across several districts.
- Interview Academy requires broad mastery plus career progression.

Phase 7 also adds four mastery landmarks:

- 💠 Knowledge Exchange
- 🛰️ Autonomous Routing Nexus
- 🧬 Optimization Institute
- 🛡️ Resilience Command Center

These cannot be reached by currency grinding alone.

## Hidden Discovery Atlas

The technology tree now contains genuinely hidden fields. Locked discoveries display a clue rather than their final identity.

Phase 7 currently includes ten discoveries, including:

- Fast Retrieval Systems
- Algorithmic Industry
- Network Science
- Dynamic Planning
- Structured Computation
- Systems Science
- Resilient Infrastructure
- Optimization Science
- Autonomous Networks
- Computational Frontier

Discoveries are triggered by combinations of retained algorithm mastery, career progress, and physical city development such as road connectivity.

When a new field is discovered, the player receives an audiovisual reveal and a small research reward. These reveals are deterministic consequences of demonstrated progress rather than login rewards or idle loot.

Existing saves receive credit for mastery already earned before Phase 7.

## Strategic compute doctrines

Discovering **Systems Science** unlocks a civilization-wide compute doctrine.

### 🖥️ Centralized Supercomputing

Prioritizes research throughput while sacrificing some economic flexibility.

### 🌐 Distributed Systems

Provides balanced production and substantially stronger crisis resilience.

### 📡 Edge Civilization

Prioritizes commercial productivity and local autonomy with a smaller research bonus.

The first doctrine choice is free. Switching later costs research, so choices matter, but the player is not permanently trapped by an early decision.

## Learning-driven city crises

Phase 7 pulls part of the planned crisis system forward because it is a natural consequence of the mastery economy.

Possible incidents include:

- Cache Stampede
- Data Pipeline Congestion
- Scheduler Overload
- Search Index Outage
- Transit Network Partition
- Planning Deadlock

Crises do **not** choose an arbitrary question. The system identifies a weak algorithm district and chooses a useful unlocked problem from that district.

While a crisis is active, one portion of passive production is modestly degraded. The player can:

1. Solve the engineering incident through the normal visible + hidden Python judge, earning a substantial resolution reward, or
2. Use expensive emergency mitigation to restore the city without completing the learning challenge.

There is no countdown that destroys the city and no punishment for taking time away. The purpose is contextual pressure and relevance, not anxiety.

## Civic contracts

Phase 7 adds three lightweight daily learning contracts:

- reinforce the current weakest district
- complete two successful recall drills
- master one previously unsolved problem

Contracts auto-complete when the underlying real learning event occurs and award small city resources.

They are intentionally different from login quests: opening the app or waiting does not complete anything.

## Megaprojects

Four long-horizon projects provide multi-session objectives:

### ☁️ Civic Knowledge Cloud

Combines strong Hash + Search mastery, the Fast Retrieval discovery, and city development.

### 🚄 Autonomous Transit Grid

Requires Autonomous Networks, high Graph/Search mastery, and a developed road network.

### 🧬 Optimization Campus

Requires Optimization Science plus strong DP and Array mastery.

### 🛡️ Resilient Civic Network

Requires broad retained knowledge, Resilient Infrastructure, and an extensive road system.

Megaprojects award unique landmark buildings plus money/research. The landmark enters the Phase 6 placement inventory so the player chooses where the achievement physically appears in the city.

## Strategy UI

Phase 7 adds an **✨ Strategy** surface containing:

- Knowledge Index
- district mastery cards
- hidden Discovery Atlas
- compute doctrine selection
- civic contracts
- megaproject progress

Mission Control also displays active engineering incidents and lets the player jump directly to the associated challenge.

## Architecture

Phase 7 continues the modular architecture started in Phase 6.

```text
src/
  core/
    namespace.js

  game/
    world.js
    camera.js
    simulation.js
    renderer.js
    audio.js
    reward-engine.js
    game-ui.js
    bootstrap.js
    crisis-system.js          Phase 7 incidents
    phase7-ui.js              strategy/discovery/crisis UI

  progression/
    mastery-economy.js        durable knowledge + infrastructure gates
    discoveries.js            hidden technology graph
    quests.js                 civic contracts + megaprojects
    phase7-bootstrap.js       event integration
```

The existing learning code remains the source of truth for whether a player actually solved something. Phase 7 listens to those verified events rather than creating a parallel scoring system.

## Core Phase 7 loop

1. The adaptive coach identifies useful practice.
2. The player recognizes a pattern and writes real Python.
3. Visible and hidden tests verify the implementation.
4. Effective mastery and the matching district strengthen.
5. A new knowledge combination may reveal a hidden discovery.
6. Knowledge unlocks better infrastructure or a new strategic doctrine.
7. Weak areas can surface naturally as city engineering incidents.
8. Civic contracts create short goals; megaprojects create long goals.
9. Completed landmarks are physically placed in the interactive city.
10. The city increasingly becomes a map of retained computer-science knowledge.

## Run locally

Serve over HTTP so Web Workers and Pyodide behave consistently:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The default Scriptable launcher points to:

`https://neffer77.github.io/l33t-interview-code/`

## Validation

`.github/workflows/validate.yml` recursively syntax-checks every JavaScript file and verifies that every local asset referenced from `index.html` exists. This automatically covers the new Phase 7 modules.

## Next game-quality milestone

### Phase 8 — characters, narrative, and interview encounters

The strongest next step is to give the systems emotional context:

- persistent engineering characters with specialties and progression
- characters who react to discoveries, crises, promotions, and megaprojects
- multi-step story missions
- fictional companies and recruiting messages
- interview boss encounters presented as in-world opportunities
- algorithm crises with richer multi-stage event chains
- debugging incidents
- behavioral and eventually system-design rounds

The AI interviewer should follow after that foundation so conversation and communication scoring have a world and cast to attach to.

## Design principle

**The most exciting action available to the player should also be a useful learning action.**

Currency is satisfying, but knowledge is power. A skyline upgrade should represent retained mastery, a discovery should represent concepts becoming connected, and a crisis should point toward exactly the skill the player most benefits from practicing next.
