# Phase 44 P4-D — District Age Evolution

P4-D makes curriculum districts evolve visually according to their own learning maturity instead of only inheriting the civilization-wide age style.

## Maturity stages

1. Learning Outpost
2. Workshop District
3. Established Campus
4. Advanced Institute
5. Mastery Landmark

The district maturity level is read from the existing `CurriculumDistricts.summary()` model. No parallel progression state is introduced.

## Visual effects

- district-specific halos around buildings
- increasing building scale as the district matures
- stage badges from workshop onward
- stronger vertical glow accents for advanced/mastered districts
- independent progression per district

This allows two districts in the same civilization age to look meaningfully different based on the learner's actual mastery.

## Refresh triggers

The visual layer reapplies after mastery updates, rewarded solves, building placement/upgrades, civilization readiness, and age/Town Center advancement.

## Compatibility

The system is additive and save-compatible. It does not mutate building ownership, map tiles, curriculum state, or age state.
