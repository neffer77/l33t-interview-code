# Phase 44 P3-A — Building Learning Contracts

P3 begins the original **Learning City Loop** by making locked buildings actionable learning goals rather than passive lock messages.

## Player loop

1. Open the city build catalog.
2. A locked building explains the exact missing learning evidence.
3. The building exposes a resource-aligned recommended coding mission.
4. **Train to unlock** launches that challenge directly.
5. Solves flow through the existing P2 reward/mastery/retention systems.
6. The building card updates as requirements are satisfied.

## Runtime

`src/progression/learning-city-loop.js` provides a learning contract for each building, mapping Resource-Gated Building requirements to Adaptive Challenge Selection.

A contract contains:
- building identity
- lock/completion state
- exact missing requirements
- human-readable requirement text
- recommended mission for each missing requirement
- the next highest-priority learning action

## City UI

The existing building catalog now shows a **Learning contract** on locked buildings and a **Train to unlock** action when a suitable coding mission is available.

This is intentionally the first P3 slice: the civilization begins becoming the interface to the curriculum rather than sitting above a separate challenge interface.

## Validation

`tests/learning-city-loop.mjs` verifies exact prerequisite explanation, resource-aligned mission selection, and direct training mission launch.
