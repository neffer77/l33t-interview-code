# Phase 44 P5-A — Citizens & NPC Pathing

P5 begins the original **Living City** phase by making the civilization visibly inhabited.

## Behavior

- Completed buildings become citizen destinations.
- Citizens route between destinations through the actual road graph when possible.
- Road routes use deterministic four-direction breadth-first pathing.
- When road segments are disconnected, citizens fall back safely rather than breaking the simulation.
- Citizen population scales with completed buildings and road infrastructure and is capped at 18 for predictable browser/mobile performance.
- Citizens are rendered as small animated pixel-style agents above the map and below interaction overlays.
- Citizens respawn/re-route after roads, construction, upgrades, age changes, and Phaser lifecycle events.
- Sleeping/waking the City view refreshes the living population.

## Design principle

Citizens are not decorative particles. Their motion is derived from real city topology and real completed structures, establishing a foundation for later jobs, schedules, mentors, incidents, ambient behaviors, and district-specific activity.

## Validation

`tests/living-city-citizens.mjs` checks completed-building destination selection, connected-road routing, bounded citizen population, deterministic trip planning, and safe disconnected-road fallback behavior.
