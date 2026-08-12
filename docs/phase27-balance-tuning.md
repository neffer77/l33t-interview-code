# Phase 27 — Explicit Balance Tuning

Phase 27 applies concrete fixes suggested by the Phase 25 Game Health Lab while keeping progression transparent and learning-first.

## Rules

### Early city payoff

The first three newly mastered challenges each receive a +90 credit / +12 research Civic Starter Grant. This makes the solve → city consequence visible sooner without changing hidden-test difficulty or base challenge rewards.

### Breadth / transfer

A first-time solve from a skill family that has not appeared in the recent four-family window receives +35 credits / +8 research. Repeating the same family is never penalized; it simply does not receive the transfer bonus.

### Retention

When Phase 26 reports Retained skill evidence associated with the solved challenge, the solve can receive +60 credits / +18 research. The underlying retained state remains controlled by Phase 26's authoritative solve evidence.

### Session recovery

After 45 minutes with no solved objective in the current session, the Quality tab recommends a short recovery path: guided weak-skill work, Repository Lab, or another 5–10 minute review. This is guidance only; there is no timer failure, streak loss, or forced stop.

## Design constraints

- Bonus-only: Phase 27 does not subtract previously earned base rewards.
- Deterministic and visible: thresholds and amounts are shown in the Quality tab.
- Hidden tests remain authoritative.
- The system does not manipulate rewards based on opaque engagement predictions.
- All tuning metadata remains local.

## Future tuning

Phase 25 audit history can be used to revise these constants in later reviewed changes. The game should tune from observed learning/economy evidence, not automatically optimize for time spent.