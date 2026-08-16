# Phase 44 P3-D — Mastery-Gated Buildings

P3-D deepens the Learning City Loop by making advanced city growth require demonstrated learning evidence, not only accumulated currency/resources.

## Behavior

- Basic buildings remain available without mastery gates so new players can establish a city immediately.
- Advanced curriculum districts (`graphs`, `dp`, `systems`, `reliability`, `infrastructure`, `network`) require at least **Competent** mastery evidence in that district.
- Later/high-cost advanced buildings require **Proficient** mastery.
- Building registry lock reasons expose the exact missing mastery level.
- Learning City contracts put the mastery prerequisite first and attach an adaptive training recommendation.
- Mastery updates rerender the building catalog, so crossing the threshold immediately changes city availability.

## Design goal

A player should be able to look at a locked advanced building and understand the real learning action required to construct it. City growth becomes evidence of demonstrated skill rather than a passive resource grind.

## Anti-grind compatibility

Mastery is sourced from the existing Concept Mastery pipeline, which already respects P2-K anti-grind/progression blocking. Repeating trivial or progression-blocked solves therefore cannot bypass these building gates.
