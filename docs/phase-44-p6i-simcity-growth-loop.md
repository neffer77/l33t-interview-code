# Phase 44 P6-I — SimCity Construction & Growth Loop

P6-I makes successful learning physically change the civilization.

## Player loop

A progression-eligible first solve now creates one visible city growth action:

- Prefer a building associated with the solved challenge district.
- If that district building is unlocked and absent, begin real construction using the existing placement/construction model.
- If a matching building already exists and can still grow, visibly upgrade it.
- If the district structure is still locked by tech/mastery progression, grow safe civic infrastructure instead of bypassing the lock.
- Move the city camera to the affected tile and display a short world-space construction/upgrade callout.

Repeated/farmed solves and anti-grind-blocked solves do not generate free city growth.

## District mapping

- Hash Map → Hash Market
- Arrays → Array Foundry
- Search → Search Observatory
- Graphs → Graph Transit Hub
- Dynamic Programming → DP Research Lab
- Structures → Recovery Park
- General/core → Housing Block

## Design invariant

The coding reward pipeline remains the authority for whether a solve counts. P6-I listens to `coding:rewarded` and converts eligible learning progression into an observable civilization consequence rather than creating a second solve/reward path.

`SimCityGrowthLoop.audit(state, world)` exposes construction/upgrade counts for acceptance testing.
