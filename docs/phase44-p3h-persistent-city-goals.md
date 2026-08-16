# Phase 44 P3-H — Persistent City Learning Goals

P3-H makes a learning-driven construction target persist as an explicit city goal instead of being recalculated every time the player returns to the map.

## Player behavior

- `Make city goal` pins the current building contract.
- Starting `Train now` automatically pins that building as the active city goal.
- The pinned goal is stored in `state.learningCity.goal`, so it survives normal save serialization and navigation.
- The City Learning Navigator prioritizes the pinned contract until it is completed or explicitly unpinned.
- The map learning beacon is restored without forcing a camera pan when the runtime is reconstructed.
- When the building's learning contract becomes complete, the goal automatically clears.

## Why this belongs in P3

The original Learning City Loop requires the civilization to communicate a durable learning objective. P3-G spatially anchored that objective; P3-H gives it continuity across challenge screens, city visits, and saved sessions.

This intentionally does not add construction animation, workers, or ambient city behavior. Those remain later Living City work.

## Validation

`tests/persistent-city-goals.mjs` verifies that a pinned building goal persists through JSON save reconstruction, remains the navigator target, is established automatically by training, and clears when the contract completes.
