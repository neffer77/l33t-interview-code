# Phase 44 P5-B — Citizen Schedules & Building Activity

P5-B turns P5-A citizens from generic road walkers into agents with understandable daily routines.

## Behavior

Citizens now operate in four daily periods: morning, workday, evening, and night. Their schedule selects destinations from completed buildings, prefers a work district during the workday, returns citizens home at night, and exposes an activity such as research, study, craft, market, maintenance, inspection, commuting, socializing, or resting.

The citizen renderer shows a tiny activity glyph above each agent and recomputes a route when the current scheduled destination is reached. Building and road changes still trigger the existing P5-A population refresh.

## Design rule

Schedules derive from the actual city. They do not create fake background NPC behavior detached from constructed buildings or the road graph.

## Validation

`tests/citizen-schedules.mjs` checks time-period classification, district-specific work destinations, evening social activity, and nighttime return-home behavior.
