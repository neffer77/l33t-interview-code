# Phase 44 P4-F — Age Transition Unlock Reveal & Milestone Rewards

P4-F makes civilization advancement explain itself at the moment the player reaches a new age.

## What changes on age-up

The Town Center ceremony now reveals:

- the newly active age curriculum pool and difficulty band,
- ordinary buildings whose `requiresEra` gate is now satisfied,
- landmarks associated with the new age and whether their district-maturity requirement is already satisfied,
- a small one-time milestone resource bundle.

Milestone rewards are deliberately bounded and claimable only once per age. They are meant to make an age transition feel consequential without replacing learning as the primary source of resources.

## Design rule

Age advancement should answer, immediately: **What changed in my civilization because I advanced?**

The reveal layer consumes the existing canonical age, curriculum, building, landmark, and concept-resource systems rather than introducing parallel progression state.
