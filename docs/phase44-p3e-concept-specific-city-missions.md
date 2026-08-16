# Phase 44 P3-E — Concept-Specific City Missions

P3-E tightens the Learning City Loop so city requirements launch the challenge that actually trains the missing evidence.

## Problem

A mastery-gated building could previously recommend the highest-ranked challenge that happened to earn the same city resource. That could send a player to an Arrays problem while a Graphs building was blocked on Graph mastery.

## Behavior

Learning City requirements now match recommendations differently by requirement type:

- `mastery` and `district` requirements only accept challenges whose concept metadata or district matches the required concept/district.
- resource requirements continue to match by resource ID.
- there is no generic fallback for a mastery requirement; if the curriculum has no matching challenge, the UI reports that no concept-matched training mission is available rather than teaching the wrong thing.

The chosen recommendation also records the matched concept and requirement type for diagnostics and UI explanation.

## Player loop

`Graph building needs Graph mastery → Train to unlock → Graph challenge → mastery evidence → city progression`

This keeps the city as an accurate learning navigator rather than merely a themed reward surface.

## Validation

`tests/concept-specific-city-missions.mjs` proves that a lower-scoring Graph challenge beats a higher-scoring Arrays challenge when the city requirement is Graph mastery, even when both challenges share the same resource reward.
