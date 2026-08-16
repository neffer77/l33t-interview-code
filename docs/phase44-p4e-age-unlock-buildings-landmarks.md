# Phase 44 P4-E — Age Unlock Buildings & Landmarks

P4-E makes civilization advancement unlock distinct structures rather than only changing styling.

## Landmarks
Each age has a canonical landmark tied to both civilization age and curriculum-district maturity:

- Age I — Founders Workshop
- Age II — Data Structures Academy
- Age III — Algorithm Observatory
- Age IV — Systems Exchange
- Age V — Engineering Capitol
- Age VI — Frontier Institute

A landmark is unlocked only when both its age and district maturity requirements are satisfied.

## Building age gates
The existing `requiresEra` field remains the source of truth for ordinary building age requirements. `AgeUnlockLandmarks` exposes that requirement as a first-class building status signal and preserves compatibility with the existing BuildingRegistry lock path.

## Player visibility
A city-side Landmarks panel shows every landmark, its age/district requirement, and whether it is currently unlocked. It refreshes after age advancement, mastery updates, solves, and city construction.

This creates the foundation for later landmark placement and richer age-specific building sets without introducing a second progression state.