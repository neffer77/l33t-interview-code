# Phase 44 P4-G — Phase 4 Integration & Balance

P4-G is the exit gate for original P4 — Age I & II.

It requires the following systems to be present together:

- formal age curriculum pools
- Town Center advancement
- civilization-wide age visual evolution
- district maturity evolution
- age/district landmark unlocks
- age-transition reveal and milestone rewards

The integration score also checks that the current age agrees with the active curriculum pool, landmark count remains bounded, district maturity stays within the canonical 1–5 range, and the one-time age-transition reward bundle remains intentionally small.

A missing P4 subsystem blocks `ready` rather than silently degrading the phase. P4-G also closes a runtime integration gap by ensuring `AgeTransitionReveal` is loaded and installed before final readiness is emitted.

## Exit criterion

When `Codeopolis.P4Integration.score(state, world).ready === true`, Phase 4 is considered coherent enough to proceed to **P5 — Living City**.
