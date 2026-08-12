# Phase 16 — Personalized Curriculum & Adaptive Interview Intelligence

Phase 16 turns Codeopolis's accumulated learning evidence into a transparent coaching layer.

## Design invariant

The Coach may recommend and sequence work, but it never replaces the existing sources of truth:

- hidden-test Python judge for coding correctness;
- existing reasoning evaluator for communication quality;
- scored system-design labs for architecture;
- debugging/incident systems for production engineering;
- mock interviews for execution under interview constraints.

## Readiness model

The readiness score is an explicit weighted model built from:

- retained coding mastery and solved coverage;
- mock interview scores;
- structured reasoning interview scores;
- system-design and engineering-incident scores;
- production debugging completion;
- behavioral evidence;
- breadth across algorithm districts.

It also reports evidence confidence so a low-data profile is not presented as false precision.

## Daily curriculum

The planner supports 25, 40, 60, and 90 minute sessions.

- 25 min: weak retained review + stretch solve + reasoning practice.
- 40 min: adds production debugging or system design.
- 60+ min: adds career-specialization practice.

Recommendations prefer weak retained districts while respecting the player's chosen career path. Tasks complete only when the underlying judged/scored subsystem emits completion evidence.

## Adaptive interviewer

The Interview Director selects one of four local interviewer styles based on readiness:

1. Collaborative
2. Structured
3. Probing
4. Principal-level

The style changes prompting and follow-up depth, not correctness grading. Players can override the style for deliberate practice.

## Privacy

Phase 16 uses local save data. No network transmission is introduced. The optional Phase 10 remote LLM proxy remains a separate opt-in augmentation path.

## UX

A new **Coach** tab provides:

- overall readiness and confidence;
- component-level evidence bars;
- weakest evidence dimensions;
- career-path fit;
- today's adaptive plan and progress;
- direct launch controls for each recommended activity;
- adaptive interviewer profile controls.

The Coach is meant to reduce decision fatigue: the player should always have a small, explainable next set of useful actions.