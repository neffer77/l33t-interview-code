# Phase 22 — Repository Lab

Phase 22 expands Codeopolis from greenfield interview implementation into realistic repository review judgment.

## Core loop

1. Open a fictional Python pull request from one of the five companies.
2. Inspect a focused unified diff and its engineering context.
3. Identify seeded correctness, reliability, security, performance, and testing defects.
4. Write substantive review comments explaining failure modes and concrete fixes.
5. Propose regression tests.
6. Run local review CI.
7. Earn approval at 75+ and record the review in persistent local history.

## Initial scenario set

- Atlas Cloud — cache stampede concurrency guard
- Vector Security — authorization filter refactor
- Nova Robotics — scheduler complexity/API regression
- Helix AI — inference telemetry memory/privacy retention
- Orbital Systems — retry/backoff/idempotency failure

## Scoring contract

The score is intentionally evidence based. Correctly identifying seeded issues supplies most of the score, while substantive review comments and a useful test strategy supply the remaining communication/testing signal. Merely opening a PR or clicking through the UI does not count as completion.

The simulator emits `codeopolis:repo-review-scored` and `codeopolis:repo-review-complete` events so later career, leadership, curriculum, and telemetry systems can consume repository-review evidence without changing the scoring authority.

## Learning goal

Interview preparation often over-trains blank-editor implementation. Repository Lab trains the inverse skill: recognize broken invariants, complexity regressions, unsafe authorization assumptions, reliability hazards, ownership/lifetime problems, and missing tests in code written by someone else.

## Platform constraints

The feature remains local-first and browser/Scriptable compatible. It introduces no backend, no network analytics, no countdowns, and no passive XP.