# Phase 44 P6-G — City Visual State Projection & Integration QA

P6-G closes Existing Systems Integration by projecting the bounded P6 consequence state onto the live Phaser city map.

## Visual projection

- Career recruiting visibility emphasizes research/trade buildings.
- Company alignment emphasizes compute/infrastructure buildings.
- Team synergy drives citizen energy and emphasizes materials/core buildings.
- World continuity emphasizes stability buildings.
- Low world stability produces a persistent crisis presentation.
- High legacy produces a persistent legacy presentation.
- The map background, world-border aura, and world-anchored city-state marker update with the current profile.

All effects are visual projections only. P6-G does not add currency, rewards, mastery, or progression bypasses.

## Integration gate

`CityVisualStateProjection.audit(state)` verifies that the P6 bridge, dashboard, and all four consequence systems are available and that their projected scores remain bounded to 0–100. A passing audit marks P6 ready to proceed to P7 final integration, polish, and release QA.

## Refresh behavior

The projection refreshes after career, company, social/team, and world/story updates, after citizens render, and after key world/map changes so Phaser refreshes cannot permanently remove the visual state.
