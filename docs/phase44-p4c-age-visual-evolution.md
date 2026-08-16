# Phase 44 P4-C — Age-Specific City Visual Evolution

P4-C gives each civilization age an immediately visible city identity.

## Behavior

`AgeVisualEvolution` defines one visual profile per age. Profiles change the city atmosphere, building tint/scale, architectural accent language, and fixed city age badge.

The visual layer is intentionally additive: it restyles the existing Phaser city/building sprites instead of creating a second renderer or changing save data.

- Age I — workshop settlement with simple posts
- Age II — organized township with civic banners
- Age III — academic city with spire accents
- Age IV — industrial systems metropolis with stack accents
- Age V — advanced engineering capital with technical lighting
- Age VI — frontier research city with animated beacons

The layer reapplies after age advancement, Town Center advancement, building placement/upgrades, Phaser readiness, and when the City view becomes active.

## Acceptance criteria

1. Advancing from Age I to Age II changes the visible city presentation immediately.
2. Each age has a deterministic visual profile.
3. Existing buildings are restyled without changing world/save state.
4. New buildings receive the current age styling after placement.
5. The current age and architectural identity are visible on the map.
6. P4-C has deterministic CI coverage.
