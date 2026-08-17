# R11 — Crises & Disasters

R11 turns city failures into systemic, player-visible incidents rather than random story cards.

## Crisis sources

The crisis scanner reads the real city every 20 seconds and watches sustained pressure. A crisis does not trigger from a single random roll; the city has to remain in a dangerous condition across multiple scans.

- **⚡ Grid Cascade** — low power ratio, disconnected powered buildings, or grid overload.
- **🚧 Transit Gridlock** — population demand exceeds the capacity of the physical road network.
- **🛠️ Maintenance Cascade** — degraded/outage buildings accumulate faster than the city is maintaining them.
- **📦 Supply Chain Breakdown** — R9 production is blocked by missing inputs or disconnected logistics.
- **💸 Budget Emergency** — low cash, negative operating flow, and budget-blocked production combine into fiscal pressure.

At least three placed buildings are required before R11 can trigger a systemic crisis, and a resolved crisis has a cooldown before the same underlying pressure can create another incident.

## Cascading consequences

Crises have severity levels 1–3. If the player ignores an incident, it escalates and can affect more buildings.

Affected buildings receive temporary real throughput penalties to housing, energy, happiness, money, research, power supply, and other service capacity. At critical severity there is also a modest city-wide spillover penalty. These modifiers compose with R5 roads/power, R6 population, R7 operations, R8 zoning, R9 supply chains, and R10 Age/technology capability.

A crisis never deletes solved problems, mastery, retention, interview readiness, technology progress, or other earned learning state.

## Coding response

The alert panel exposes **Resolve with coding**. R11 uses the existing adaptive challenge selector and P6 world-origin mission bridge:

1. The crisis chooses a concept aligned with the failure type.
2. The originating city building is retained as mission context.
3. The full coding workspace opens.
4. Only a correct, progression-eligible solve resolves the incident.
5. The player returns to the City view at the affected location.
6. Crisis overlays disappear and normal throughput is restored.

The player can also spend city money on **Emergency stabilize**. This can reduce severity and delay escalation, but it does not count as the technical resolution and does not erase the underlying city-planning problem.

## World presentation

Active crises are visible without relying on dashboards:

- pulsing affected-building rings,
- outage lightning,
- smoke from maintenance failures,
- broken supply markers,
- road gridlock barriers,
- fiscal emergency markers,
- an in-world origin banner,
- and a dedicated crisis response panel.

## Legacy crisis migration

The old Phase 7 crisis system was driven by a post-mastery random roll. R11 retires new random crisis triggers once the systemic crisis engine is present. An already-active legacy crisis is preserved in bounded R11 history as `legacy-retired` and cleared from the old active slot so two crisis engines cannot compete for the player.

## Acceptance

A qualifying physical city failure must be able to create a visible incident, reduce real city capability, escalate when ignored, open a contextual interview coding mission, and visibly recover after a valid solve. Poor city planning can matter and cascade, but months of learning progress remain protected.
