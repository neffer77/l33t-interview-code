# Phase 44 P7-A — Release Readiness & Full-Loop Playtest Gate

P7 begins after P6-N established a world-first player-experience acceptance criterion. P7-A turns that criterion into a reusable release gate instead of relying on individual subsystem tests alone.

## Release contract

`Codeopolis.P7ReleaseReadiness.audit()` returns one bounded report with:

- `ready`: whether the current build satisfies every release blocker check.
- `score`: percentage of top-level gates currently passing.
- `blockers`: actionable reasons the build is not ready.
- module/capability presence for the playable civilization loop.
- persisted-state safety checks.
- the P6-N world-first acceptance report.
- a live City viewport check when the City surface is visible.

The same audit is exposed in the browser as `window.codeopolisReleaseAudit()` for manual playtesting and production diagnostics.

## Required playable loop

A release-ready P7 build must retain the complete P6 loop:

1. enter a physically populated City,
2. interact with a building, citizen, or system venue,
3. accept a world-origin technical mission,
4. complete eligible coding work,
5. receive a visible civilization consequence.

## Safety checks

P7-A also rejects release readiness when core persisted numeric state becomes negative/non-finite, when world-origin mission history exceeds its bounded contract, when required runtime modules are absent, or when the visible mobile City map falls below the world-first viewport threshold.

## Scope

P7-A does not rebalance rewards or add new progression. It is the first P7 quality/release slice and provides the gate later P7 balance, performance, accessibility, visual polish, and release-candidate work can build on.
