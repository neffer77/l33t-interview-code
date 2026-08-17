# R7 — Operational Buildings & Maintenance

R7 turns placed buildings from permanent trophies into operating city infrastructure while preserving the Codeopolis rule that learning/mastery progress is never destroyed by city failure.

## Player loop

1. Buildings consume small periodic money upkeep and accumulate wear.
2. Poor road/power/service conditions accelerate degradation.
3. Condition moves through healthy → maintenance → degraded → outage.
4. Degraded buildings lose production, jobs, housing support, and utility generation through a shared operation multiplier.
5. The map visibly marks buildings that need maintenance and shows outages.
6. Tapping an affected building exposes **Repair with coding**.
7. R7 uses the adaptive interview selector to choose a useful real coding problem, records the building as the world-mission origin, and opens the coding workspace.
8. A progression-eligible correct solve restores the building to 100%, returns to City, and triggers a visible repair consequence.

## Safety / balance

- City degradation never modifies solved-problem history, mastery, retention, interview readiness, or earned learning progress.
- Operational failure is recoverable.
- Repair solves still pass through the existing coding reward and anti-grind pipeline.
- A progression-blocked solve does not complete a repair.
- Upkeep is intentionally gradual (60-second active-world cycles) so maintenance creates planning pressure rather than constant interruption.

## Runtime contracts

- `Codeopolis.BuildingOperations`
- `world.buildingOperationStatus(x, y)`
- `world.operationsSummary()`
- `building:operation-status-changed`
- `building:outage`
- `building:repair-mission-started`
- `world:building-repaired`

## Acceptance

A player can let a building degrade, see its output/capacity fall, tap it, select **Repair with coding**, solve a real adaptive interview problem, return to the same city, and visibly see the building restored to full operation without losing any learning progress.
