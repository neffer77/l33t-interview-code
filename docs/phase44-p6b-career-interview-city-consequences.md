# Phase 44 P6-B — Career & Interview Progress → City Consequences

P6-B connects existing interview/hiring/career events to the civilization through the P6-A bridge.

## City consequences

Career-domain activity now updates a bounded `state.careerCity` model:

- **prestige** — how established the civilization appears externally
- **opportunity** — how much career momentum the player has created
- **confidence** — accumulated interview/career evidence
- **recruitingVisibility** — derived from prestige and opportunity

Supported events are `interview:readiness`, `interview:completed`, `career:advanced`, and `job:offer`.

Each event also uses the existing Living City reaction renderer so citizens visibly acknowledge important career milestones.

## Design constraints

- The original interview/hiring/career systems remain authoritative.
- P6-B does not award currency or bypass progression gates.
- Consequence values are capped at 100 and event counters are bounded.
- The bridge lazily loads this module, so later P6 slices can follow the same adapter pattern.
