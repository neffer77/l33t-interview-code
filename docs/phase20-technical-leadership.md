# Phase 20 — Technical Leadership

Phase 20 adds a staff/principal engineering leadership layer to Codeopolis. It is intentionally separate from ordinary company project delivery: higher-level progression requires evidence of cross-team judgment, architecture, incident leadership, mentoring, and roadmap prioritization rather than simply completing more coding work.

## Design invariant

The most exciting available action should still be useful engineering practice. Leadership progression is therefore produced by written/scored decisions and existing authoritative engineering simulators rather than dialogue clicks, elapsed time, or passive leadership XP.

## Employer-specific leadership programs

Each employer has one repeatable cross-team program:

- Nova Robotics — Autonomy Platform Charter
- Atlas Cloud — Regional Resilience Charter
- Helix AI — Model Systems Governance
- Vector Security — Secure Platform Standard
- Orbital Systems — Mission Compute Charter

Programs identify multiple stakeholder teams and contain five ordered stages:

1. RFC / technical strategy proposal
2. architecture review through the existing system-design lab
3. incident-command exercise through the existing engineering-incident simulator
4. mentoring/coaching plan
5. roadmap prioritization decision

Leadership stretch work unlocks after two completed projects at the current employer and 65 overall readiness.

## Transparent written rubrics

The local `LeadershipEvaluator` scores written exercises without network calls.

RFC evidence covers:
- problem framing
- constraints
- alternatives and tradeoffs
- rollout / reversibility
- observability
- risk
- ownership

Mentoring evidence covers:
- diagnosis through questions/evidence
- teaching principles rather than taking over
- autonomy
- specific feedback
- next-step plan
- psychological safety / respectful coaching

Roadmap evidence covers:
- outcomes
- metrics
- tradeoffs
- dependencies
- risk
- explicit decision and sequencing

Written stages require 70+. The UI exposes missing rubric dimensions and feedback rather than presenting a black-box score.

## Authoritative technical stages

Architecture review requires 75+ in the existing system-design lab.

Incident command requires 70+ in the existing engineering-incident simulator. The leadership program refuses to attach to an unrelated active design or incident.

## Leadership dossier

Completed programs persist by employer with all stage evidence and a weighted score:

- RFC: 25%
- architecture review: 20%
- incident command: 20%
- mentoring: 15%
- roadmap strategy: 20%

Changing employers does not transfer completed leadership programs into the new employer's promotion evidence. An unfinished program is superseded when employment changes.

## Staff and Principal gates

Phase 19 performance reviews remain necessary. Phase 20 adds leadership evidence on top of them.

Promotion into Staff requires:
- the existing Phase 19 promotion-ready performance review, and
- at least one completed leadership program at the current employer with a best score of 75+.

Promotion into Principal requires:
- the existing Phase 19 promotion-ready performance review,
- at least two completed leadership programs at the current employer,
- leadership average of 82+, and
- leadership best score of 85+.

Senior-level promotions below Staff continue to use the Phase 19 rules without a leadership-program requirement.

## No farming

- Starting a program gives no promotion credit.
- Written exercises below threshold do not advance the program.
- Architecture and incident stages advance only from their existing scored completion events.
- Repeating program attempts is allowed for deliberate practice, but promotion readiness uses completed evidence, not button presses.
- Leadership evidence is scoped to the current employer.

## UI

The new `🧭 Leadership` tab shows:
- current employer and role
- leadership-program eligibility
- cross-team stakeholders
- ordered leadership stages
- written decision editor and rubric feedback
- Staff and Principal evidence requirements
- promotion-gate status
- employer-specific leadership dossier

Phase 20 remains browser/iOS Scriptable compatible and adds no backend dependency or network analytics.
