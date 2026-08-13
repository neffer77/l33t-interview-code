# Phase 40 — Guided Beta Onboarding

Phase 40 makes the first Codeopolis beta session understandable without replacing discovery with a long tutorial.

## Guided path

The Mission Control sidebar gains a compact Beta Guide. It asks the player to:

1. Open Challenge and orient to the judged-code loop.
2. Earn one real `learning:mastered` result.
3. Open City and see learning reflected in civilization state.
4. Open Learn and inspect the durable learning layer.
5. Produce one engineering-judgment signal through reasoning, incident response, system design, behavioral practice, or Interview Day.
6. Reload or close/reopen the app to prove persistence.

Steps advance from real events and navigation, not manual completion checkboxes.

## Why cues

Every step explains why the activity exists. The goal is to teach the mental model of Codeopolis: judged engineering evidence powers a persistent civilization, while broader interview skills and retention make that competence transferable.

## Beta instrumentation

Phase 40 stores a lightweight local beta ledger under `codeopolis-phase40-beta-v1` containing:

- session starts
- tab visits
- guide-step completion
- timestamps
- optional 1–5 fun ratings
- optional 1–5 clarity ratings
- short tester notes

When Phase 11 telemetry exists, the same high-level beta events are sent through that local telemetry layer. No external analytics service is introduced.

## Integrity boundary

Guided onboarding does not change hidden tests, mastery thresholds, interview scores, hiring outcomes, city economics, or rewards beyond existing micro-feedback for completed guide steps.

## Intended beta workflow

Complete the guide once, then play naturally. Use the small feedback panel whenever something feels confusing, delightful, slow, or unrewarding. The resulting evidence should guide future UX and balance work rather than optimizing for raw session length.