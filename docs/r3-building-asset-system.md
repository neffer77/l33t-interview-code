# R3 — Building Asset System

R3 replaces the R2 district-colored building placeholders with a reusable building-art contract for the City Game Reconstruction.

## Player-facing contract

The city must no longer render every structure as the same generic block with a different palette. Core structures receive distinct pixel-art silhouettes and details: Founder Camp, Housing Block, Hash Market, Array Foundry, Search Observatory, Graph Transit Hub, DP Research Lab, Recovery Park, Solar Array, Algorithm Tower, and Interview Academy.

Building artwork is generated on the R2 isometric projection and remains compatible with the existing placement/world model.

## Asset contract

`Codeopolis.BuildingAssetSystem` owns:

- per-building visual recipes;
- district color families;
- footprint-aware texture dimensions;
- three visible building tiers;
- four construction states: foundation, frame, shell, complete;
- deterministic texture keys suitable for caching and future sprite-atlas replacement.

The renderer uses the building footprint center rather than the anchor tile so 2x2 structures visually occupy the correct land area.

## Construction

A newly placed structure visibly progresses through foundation -> frame -> shell -> completed architecture. This is tied to the existing construction progress value; R3 does not create a second construction simulation.

## Upgrade tiers

Building level is now part of the actual asset key and architecture. Tier II and III structures receive visible additions rather than relying on a floating text badge as the primary signal.

## R4 boundary

R3 establishes recognizable structures and construction states. R4 is responsible for the complete manual city-building loop: empty-land onboarding, build palette, resource-driven acquisition, placement workflow, construction decisions, relocation/demolition, and player-authored growth.

## Visual acceptance

With labels hidden, a player should be able to distinguish at least the major starter/interview buildings by silhouette and decoration. A 2x2 facility must look physically larger than a 1x1 home, an under-construction structure must not look complete, and upgraded buildings must visibly differ from Tier I.