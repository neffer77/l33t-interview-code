# Phase 44 P3-C — Visible Learning Consequences

P3-C makes the result of a city-targeted coding solve visually obvious on the civilization surface.

## Behavior

After a matching `Train to unlock` mission completes, the Learning City Loop now produces a normalized feedback model with:

- progress vs. unlock state
- building name and icon
- quantified requirement progress
- remaining requirement amount
- a normalized progress percentage
- a build-ready signal when the learning gate clears

The building catalog displays this result as a prominent animated city-side feedback card. Newly unlocked buildings receive a visible highlight and a direct **Build it now** action.

## Player loop

`Locked building → targeted coding mission → solve → return to city → visible progress/unlock → build immediately`

## Validation

`tests/learning-city-loop.mjs` verifies both partial progress and full unlock feedback, the visible-consequence event, persisted pending feedback, and delivery to the city catalog.
