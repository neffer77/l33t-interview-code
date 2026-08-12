# Phase 17 — Procedural Endgame

Phase 17 turns Codeopolis's existing judged and scored systems into a repeatable endgame without adding fake progress, server-only dependencies, or FOMO mechanics.

## Design invariant

A high-value endgame action must still be a useful engineering-learning action.

Phase 17 therefore does not invent a second correctness system. It composes the systems already proven in earlier phases:

- hidden-test Python mastery
- structured reasoning interviews
- production debugging scenarios
- scored system-design reviews
- the transparent Phase 16 readiness model

## Seeded operations

Each ISO calendar week maps to a deterministic public seed. That seed selects:

- an engineering theme
- two coding challenges
- one debugging scenario
- one system-design scenario

Themes include reliability, optimization, security response, scale, and frontier systems.

The week is only a content key. It is **not** an expiration deadline. Generated operations stay in the local archive and can be resumed later. Missing a week never removes rewards, breaks a streak, lowers readiness, or damages the civilization.

## Operation stages

A standard operation contains five stages:

1. Precision judged solve
2. Reasoning interview on the next problem
3. Hidden-test implementation of that problem
4. Production debugging repair
5. Architecture defense

Progression gates are evidence based:

- coding: a real `learning:mastered` event
- reasoning: finished interview with score >= 70
- debugging: a real `debugging:resolved` event
- design: finished design with score >= 70

A button click alone cannot advance an operation.

## Endgame access

Seeded operations are intended for advanced play and unlock at either:

- readiness >= 55, or
- 35 judged solves

A seeded coding problem can still remain unavailable if its normal challenge gate has not been satisfied. The UI tells the player to continue the Coach path and return later rather than bypassing progression.

## Frontier Gauntlet

The Frontier Gauntlet is a separate repeatable coding mode.

It selects three unlocked challenges from distinct weak districts. Selection favors unsolved and higher-difficulty work while still rotating between runs.

Eligibility:

- readiness >= 65, or
- 45 judged solves

There is no failure timer or expiration. Elapsed time is recorded as context only. The gauntlet progresses exclusively through real mastery events.

## Scorecards and sharing

Completed seeded operations produce a local scorecard containing:

- week key
- operation theme
- final score
- readiness score
- public seed
- statement that technical stages were completed through Codeopolis judged/scored systems

When supported, the browser's native share sheet is used. Otherwise the text can be copied to the clipboard. There is no simulated leaderboard and no claim that local scorecards are tamper-proof.

## Privacy and telemetry

Endgame state stays in the existing local save. Phase 11 local telemetry receives only local event summaries such as operation stage type, score, gauntlet challenge ID, and completion time. Phase 17 adds no network analytics.

## Accessibility

The Endgame UI inherits the existing reduced-motion and accessibility systems. It does not introduce forced countdowns, destructive streaks, or animation-dependent information.
