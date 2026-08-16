# Phase 44 P6-E — Civilization Crises, Legacy & Story Arcs → Living City

P6-E projects the existing civilization-world systems into the Living City without replacing them.

## Source systems

- Civilization Crises
- Civilization Legacy
- Emergent Story Arcs

These systems remain authoritative. P6-E listens to normalized P6 bridge events and derives city-facing consequence state.

## City consequence state

`state.worldStoryCity` tracks bounded 0–100 signals:

- `resilience` — the civilization's ability to absorb disruption.
- `legacy` — accumulated lasting impact from civilization milestones.
- `narrative` — strength of the current emergent story.
- `stability` — immediate world/city steadiness.
- `continuity` — derived average of the four primary signals.

Crises lower resilience/stability while increasing narrative pressure. Legacy events strongly increase legacy. Story arcs primarily strengthen narrative. No new spendable economy is introduced.

## Living City feedback

World events reuse the existing Living City reaction layer:

- crises → incident reaction
- legacy milestones → unlock/celebration reaction
- story arcs → recovery/continuation reaction

## Balance constraints

All signals are clamped to 0–100. The module does not grant learning mastery, bypass age gates, create resources, or mutate the authoritative legacy/crisis/story simulations.
