# Phase 44 P6-N — World-First UX & Player-Experience Acceptance

P6-N is the exit gate for the Playable Integration Recovery. It changes the City hierarchy from **dashboard with a map** to **game world with optional management**.

## Mobile world-first contract

On the City view:

- the Phaser world owns the majority of the usable viewport;
- the civilization title and era tags wrap instead of clipping;
- the compact resource summary remains visible below the world;
- the previous card-heavy City workspace is hidden by default;
- **Manage City** opens that workspace as a secondary bottom drawer when the player actually needs detailed management;
- closing management immediately returns the world to visual priority.

Desktop keeps the same systems but gives the world a larger share of the primary layout.

## Player-experience acceptance journey

P6 is not considered player-experience complete merely because individual systems exist. `WorldFirstUX.acceptance()` requires the playable chain to be available and physically represented:

1. Enter a functioning city with visible buildings, roads, and population.
2. Interact with a building, citizen, or embodied system venue.
3. Accept a mission that originates from that world interaction.
4. Complete the real coding/learning work.
5. Return to a visible civilization consequence supported by the growth and game-feel layers.

The runtime records those journey milestones so QA can inspect whether an actual play session completed the loop.

## Exit criterion

**If dashboard numbers were hidden, the player should still be able to tell that the civilization exists, that they interacted with it, and that completing technical work changed it.**

This is the acceptance threshold for moving from P6 recovery into P7 polish/balance/release work.
