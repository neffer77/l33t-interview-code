# Phase 44 P6-H — Playable Settlement Bootstrap

P6-H is the first Playable Integration Recovery slice. Its purpose is to make the City read as a game world immediately rather than an empty visualization.

## Player-facing contract

A player with an empty or legacy-empty world enters City and sees a functioning starter settlement:

- Founder Camp / civic center
- two starter homes
- Recovery Park
- connected starter roads
- a non-zero population attached to visible habitation

The bootstrap is conservative: established cities with at least three placed buildings and a Founder Camp are left untouched.

## Why this exists

The previous state could display `12 population` while the Phaser map contained `0 buildings`. That violated the SimCity/Stardew-style world-first design goal because the statistics described a settlement that did not physically exist.

P6-H establishes the invariant that an inhabited settlement is visibly inhabited before later recovery slices add construction growth, NPC/world interaction, world-origin missions, embodied legacy systems, spectacle, and mobile game UX.

## Acceptance gate

`PlayableSettlementBootstrap.audit(state, world)` requires a civic center, at least three visible buildings, at least four road tiles, and non-zero population.
