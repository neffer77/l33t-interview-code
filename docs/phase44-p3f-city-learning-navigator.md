# Phase 44 P3-F — City Learning Navigator

P3-F moves the Learning City Loop onto the city surface itself.

The navigator selects the highest-value locked building that has an actionable learning contract, shows the exact missing prerequisite, exposes the concept/resource being trained, and provides a direct mission launch.

## Priority

Mastery-gated city opportunities receive priority over pure resource accumulation so demonstrated learning remains the primary progression signal. District gates are next, followed by resource gates. Adaptive challenge scores still break ties inside those categories.

## Player loop

`Enter city → see recommended building → understand missing evidence → launch exact mission → solve → return to visible city progress`

The navigator does not duplicate curriculum logic. It consumes the same Learning City contract and Adaptive Challenge Selector data used by the building catalog.

## UI

The city HUD displays:

- target building
- exact missing requirement
- why the requirement matters
- matched concept/resource
- recommended challenge
- **Train now** action
- **Open building** action

The navigator rerenders when learning evidence, resources, technology, age, or city construction changes.
