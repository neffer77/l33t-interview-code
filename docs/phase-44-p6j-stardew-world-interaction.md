# Phase 44 P6-J — Stardew-Style NPC & World Interaction

P6-J makes the city itself a primary interface.

## World interaction loop

- Tap a building to open a contextual place card.
- Buildings explain what they do in the civilization, not just their numeric effects.
- If the building is the current Learning City target, the card shows the city need and offers `Help this place` to launch the matched training contract.
- Tap a named citizen to get a contextual conversation/request shaped by their role, schedule, work district, and the current city learning need.
- Citizens aligned to the current need show a visible request marker and offer `Accept request`.
- Requests route into the canonical Learning City training path rather than inventing a second mission system.
- Interaction history is persisted in a bounded `worldInteraction` state record.

## Acceptance criterion

A player can discover what to do next by interacting with the world rather than needing to navigate to a separate coding dashboard first. The city becomes the source of context; the technical workspace remains the place where the rigorous task is completed.
