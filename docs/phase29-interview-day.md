# Phase 29 — Realistic Interview Day

Phase 29 adds a practice-only end-to-end interview simulation that reuses Codeopolis' existing authoritative technical scorers.

## Company calibration profiles

Five fictional company profiles provide different round mixes, target time budgets, focus areas, and calibration bars:

- Nova Robotics — coding, technical deep dive, system design, behavioral
- Atlas Cloud — coding, technical deep dive, production incident, behavioral
- Helix AI — coding, technical deep dive, system design, behavioral
- Vector Security — coding, technical deep dive, debugging, behavioral
- Orbital Systems — coding, technical deep dive, production incident, system design, behavioral

## Two modes

**Realistic** records elapsed round time against a target budget and includes pacing in the final calibration.

**Practice** keeps the same round structure but gives a neutral pacing score so the player can deliberately learn without being pressured by the clock.

Time never auto-fails a round. Existing hidden tests and scored interview/design/incident/behavioral systems remain authoritative for technical quality.

## Interviewer pressure prompts

Each round exposes contextual follow-up prompts such as invariant questions, adversarial edge cases, rollback decisions, backpressure questions, and ownership/evidence probes. These prompts simulate interviewer pressure but do not award or remove progression.

## Final calibration

The debrief reports:

- average round quality;
- pacing;
- cross-round consistency;
- overall calibration score;
- company calibration bar;
- weakest round type;
- Below Bar / Hire Calibration / Strong Hire Calibration.

Technical rounds must individually clear a minimum floor so one exceptional round cannot hide a severe weakness elsewhere.

## Isolation from recruiting

Interview Day is practice. It does not create job offers, rejection history, recruiting cooldowns, compensation, promotions, or employment changes. An active real hiring loop blocks starting Interview Day so one authoritative event cannot accidentally advance both systems.

## Learning goal

The goal is to train the full interview experience: correctness under observation, explicit reasoning, pacing, consistency, tradeoff defense, and communication across multiple consecutive rounds.