# Phase 18 — Hiring Pipelines

Phase 18 turns Codeopolis recruiting into full, replayable hiring processes instead of isolated interview encounters.

## Design goals

- Preserve the five fictional recruiting companies introduced in Phase 8.
- Reuse the real judged/scored subsystems already in the game.
- Make hiring outcomes deterministic and explainable rather than random.
- Make failed loops useful: the player gets a signal-by-signal debrief instead of a cooldown penalty.
- Keep offers optional. Accepting a role never removes durable mastery, blocks other companies, or resets the civilization.

## Company loops

Each available company builds a loop from its existing recruiting focus and a company-specific work sample.

### Nova Robotics

- Technical screen
- Technical deep dive
- System design
- Behavioral
- Hiring bar: 72/100

### Atlas Cloud

- Technical screen
- Technical deep dive
- Production incident
- Behavioral
- Hiring bar: 75/100

### Helix AI

- Technical screen
- Technical deep dive
- System design
- Behavioral
- Hiring bar: 76/100

### Vector Security

- Technical screen
- Technical deep dive
- Production debugging
- Behavioral
- Hiring bar: 78/100

### Orbital Systems

- Technical screen
- Technical deep dive
- Production incident
- System design
- Behavioral
- Hiring bar: 80/100

## Evidence model

The pipeline stores evidence for five possible signals:

- coding
- reasoning
- production
- systems
- behavioral

Coding completion requires the existing hidden-test mastery event. The reasoning round uses the Phase 16 adaptive interviewer and therefore includes explanation, judged implementation, and a performance follow-up. Production rounds reuse Phase 9 debugging or Phase 10 engineering incidents. System design reuses the Phase 9 scored architecture lab. Behavioral answers use the existing STAR/evidence/reflection scorer.

No hiring score replaces any underlying judge. Phase 18 only aggregates their results.

## Critical signal floors

A loop cannot produce an offer merely by averaging a very strong score against a failed critical signal. The current floors are:

- coding: hidden-test pass
- reasoning: 70+
- behavioral: 65+
- production, when present: 65+
- systems, when present: 70+

The player must also clear the company-specific weighted hiring bar.

## Debrief

After the final round, the loop records:

- weighted loop score
- company hiring bar
- Hire / Strong Hire / No Hire verdict
- signal-by-signal scores
- weakest measured signal
- readiness at start and end
- complete round evidence

A failed loop can be retried immediately. The intended next action is to improve the weak evidence through the Coach or normal game systems, not to wait for an artificial timer.

## Offers and up-leveling

A passing loop creates a persistent offer. Strong evidence can create an up-level offer only when both conditions are true:

- loop score is at least 90
- current Phase 16 readiness is at least 80

This makes up-leveling depend on broad durable evidence rather than a single lucky performance.

Offers are fictional in-game career outcomes; they are not claims about real-world compensation, hiring policies, or level calibration.

## Employment

Accepting an offer creates a current employment record and keeps prior employment history. It also awards civilization resources as a game reward. Accepting a role does not erase:

- mastery
- solved problems
- interview history
- career specialization
- company reputation
- endgame records
- other open interview possibilities

## Compatibility

Phase 18 is layered on top of the existing recruiting system. Older saves and the original Phase 8 three-problem company encounters remain compatible. The new full-loop system becomes available when the existing recruiting evidence says the company is ready to engage.

The entire system remains browser- and Scriptable-compatible and requires no backend.