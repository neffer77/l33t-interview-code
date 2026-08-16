# Phase 44 P3-G — Map Learning Beacons

P3-G spatially anchors the Learning City Loop in the civilization map.

## Goal

A learning objective should feel like a city objective, not a detached panel. The City Learning Navigator now includes **Show on map**, which focuses the Phaser camera on the relevant city location and draws a pulsing learning beacon.

## Behavior

- If the target building is already placed, the beacon points to its real map location.
- If the target building has not been built yet, Codeopolis finds a valid open future blueprint site near the city center.
- Future sites avoid water, roads, existing buildings, and footprint conflicts.
- A semi-transparent building ghost marks the future structure location.
- The camera pans to the goal and raises zoom when needed.
- The map emits `learning-city:map-focused` for diagnostics and future game-feel effects.
- Unlocking the target clears the old beacon.

## Learning loop

`City navigator → Show on map → see the future/actual building → understand what learning unlocks → Train now → solve → return to city consequence`

This is intentionally a P3 spatial-navigation feature. Rich construction animation and living-city activity remain in later roadmap phases.
