# Phase 44 P3-I — Goal Completion → Build Flow

P3-I closes another major gap in the Learning City Loop: completing a learning contract can now turn the future map blueprint directly into real city construction.

## Player loop

`Choose city goal → train exact concept → solve → contract completes → return to city → Build it now → future blueprint becomes real construction`

## Build-ready state

When a learning-city result has no remaining contract requirements, `GoalCompletionBuildFlow` stores a bounded `state.learningCity.buildReady` entry containing the building, the suggested blueprint site, and the completion timestamp.

The visible consequence is normalized to a 100% unlock result and emits `learning-city:build-ready`.

## Blueprint placement

The existing Learning Map Beacon already computes valid future sites that avoid water, roads, occupied cells, and footprint conflicts. P3-I captures that site when the learning contract completes.

When the player presses **Build it now**, the flow:

1. verifies the learning gate is still satisfied,
2. purchases the building through the existing multi-resource economy if necessary and affordable,
3. revalidates the stored blueprint site,
4. recomputes a safe site when the map changed after completion,
5. starts real construction with `world.placeBuilding(..., { construction: true })`,
6. clears the build-ready state and learning beacon,
7. emits `learning-city:goal-built`.

If construction resources are still missing, the normal catalog behavior remains available rather than bypassing the economy.

## Compatibility

P3-I does not introduce a separate construction system. It bridges the P3 learning contract into the existing P1 placement and P2 multi-resource economy systems. This keeps later P5 worker/pathing/construction-animation work in its original roadmap phase.

## Validation

`tests/goal-completion-build-flow.mjs` verifies:

- a completed contract becomes build-ready,
- the future blueprint site is retained,
- visible feedback reaches 100%,
- required construction purchase still occurs,
- the building is placed at the learning blueprint,
- build-ready state clears after construction starts.

The suite runs under `Validate Codeopolis`.