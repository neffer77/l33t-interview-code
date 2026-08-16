# Phase 44 — Original P2-M: Learning Analytics

P2-M turns the Phase 2 learning systems into one explainable learning-intelligence layer.

## Canonical analytics stream

`state.learningAnalytics.events` records progression-relevant solve events with concept, challenge, difficulty, attempts, hints, quality, anti-grind eligibility, spaced-review status, retention strength, transfer/generalization, mastery level, and interview verification evidence.

The stream is bounded and save-safe so analytics does not grow without limit.

## Concept profiles

`Codeopolis.LearningAnalytics.conceptProfile(state, conceptId)` combines:

- concept mastery
- retention strength and due status
- transfer/generalization breadth
- interview verification
- clean-solve rate
- hint dependence
- recent quality trend
- false-mastery evidence

Each profile produces a plain-language diagnosis rather than only a score.

## Trends and session summaries

`rangeSummary` exposes rolling 7-day/30-day attempts, solves, clean solves, concept breadth, review count, verification count, average quality, and quality trend. `finishSession` can persist a compact end-of-session report for future progression surfaces.

## Analytics → action

`recommendation` merges the weakest concept evidence with the existing adaptive challenge selector and explains why the next challenge is useful. The UI can launch that challenge directly.

## Learning Intelligence UI

A unified `📊 Learning Intelligence` panel is attached to the civilization surface with four views:

- Overview
- Concepts
- Interview
- History

This consolidates the previously fragmented Phase 2 learning signals without deleting the specialist Retention, Transfer, Interleave, Readiness, or Phase 2 audit systems.

## Validation

`tests/learning-analytics.mjs` checks event persistence, concept aggregation, weakness diagnosis, false-mastery surfacing, adaptive recommendation explanations, rolling summaries, interview-readiness integration, and save reconstruction.
