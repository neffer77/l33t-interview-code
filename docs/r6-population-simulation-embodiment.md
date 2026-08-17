# R6 — Population Simulation Embodiment

R6 makes population a consequence of the physical city instead of a mostly independent counter.

## Simulation contract

Population is constrained by real housing capacity, job capacity, road connectivity, power connectivity, and resulting happiness/desirability. Migration moves the saved population toward the capacity the current city can actually support.

- Empty land supports zero population.
- Housing creates resident capacity.
- Non-housing buildings create jobs from their worker demand.
- Disconnected or unpowered infrastructure lowers desirability and can cause population loss.
- Housing/job shortages surface as demand signals.
- Population growth/loss is gradual and recoverable; learning/mastery is never erased.

## Player-facing embodiment

The Phaser city gets a compact population HUD showing residents/capacity, jobs, happiness, housing demand, job demand, road coverage, and power coverage. Existing P5 citizens now scale from simulated population rather than from decorative building/road counts alone, and migration refreshes visible commuters.

## Acceptance

A player can start from R4 empty land, add housing and employment, connect infrastructure, and watch population migrate in. Breaking the road/power network reduces support and can reverse migration. The number of visible citizens follows the simulated population while remaining capped for mobile performance.

## R7 boundary

R7 adds operational buildings and maintenance: upkeep, degradation, outages, repair actions, coding-driven repairs, and recoverable cascading failures.
