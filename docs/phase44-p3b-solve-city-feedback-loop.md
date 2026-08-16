# Phase 44 P3-B — Solve → City Feedback Loop

P3-B closes the first full Learning City Loop started in P3-A.

## Player loop

1. Open a locked building in the city.
2. Start its targeted learning contract.
3. Solve the recommended coding challenge.
4. The active city contract survives navigation/reload state.
5. On a matching successful solve, Codeopolis recomputes the building gate.
6. The game returns to the city, opens the build catalog, and shows either contract progress or a building-unlocked celebration.
7. Newly unlocked buildings are immediately available to acquire/build when their economic cost is satisfied.

## Runtime contract

`state.learningCity` stores a bounded history plus the active training target and pending city result. The feedback handler only consumes the solve when the rewarded challenge matches the active contract challenge, preventing unrelated solves from completing a selected city objective.

Events:
- `learning-city:training-started`
- `learning-city:contract-progress`
- `learning-city:building-unlocked`

This establishes the core P3 direction: coding activity initiated by the city must visibly return to and affect the city.