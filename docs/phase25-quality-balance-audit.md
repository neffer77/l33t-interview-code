# Phase 25 — Quality & Balance Audit

Phase 25 turns Codeopolis' existing local diagnostics into an explicit game-health feedback loop.

## Goal

Optimize for learning transfer and meaningful game progress rather than raw time-on-site. The audit asks whether judged practice visibly changes the city, whether the economy is rewarding without becoming meaningless, whether advanced players transfer skills into code review and multi-file engineering, and whether a session is producing understandable wins.

## Five health dimensions

- **Onboarding** — does the player reach a judged solve and understand the solve → city payoff?
- **Economy** — are credits and build costs plausibly paced against demonstrated mastery?
- **Learning** — is accumulated practice converting into readiness rather than solve-count grinding?
- **Variety** — do experienced players use repository review and real engineering projects instead of repeating one interaction type?
- **Retention quality** — do longer sessions still contain visible learning wins?

## Explainable heuristics

The audit only reads local save/telemetry evidence. Every warning includes the observed problem and a concrete tuning action. It does not silently modify rewards, scores, difficulty, progression, or player state.

This is intentional: balance changes should be reviewable engineering decisions, not opaque dynamic manipulation.

## Event refresh

The Game Health Lab refreshes after authoritative mastery, repository-review completion, and engineering-project completion events. Players can also run a fresh audit manually from the Quality tab.

## Current role

Phase 25 is the foundation for empirical tuning. Its history stores the most recent local audit snapshots so future work can compare progression curves and test targeted changes without adding network analytics.