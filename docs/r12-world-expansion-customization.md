# R12 — World Expansion & Customization

R12 gives the player direct authorship over the shape and identity of Codeopolis instead of treating the city map as a fixed board.

## Territory expansion

The original 12×8 starter plot can grow through six permanent land purchases:

1. 16×11 — Neighborhood Tract
2. 20×14 — Township Annex
3. 24×17 — Metro Expansion
4. 28×20 — Regional Grid
5. 32×23 — Capital Territory
6. 36×26 — Megacity Reach

Expansion preserves every existing building, road, zone, district, mission origin, and customization coordinate. Newly unlocked land uses the same deterministic R2 terrain generator, so expanding feels like revealing more of the same world rather than loading a separate level.

Expansion uses city money plus Infrastructure resources. It never consumes or deletes mastery, solved problems, retention, interview readiness, or other learning progress.

## Landscaping

The Customize tool can paint empty tiles as:

- Grass
- Earth
- Woodland
- Water
- Natural/procedural terrain restoration

Custom terrain is persistent save state and is read by the world adapter before procedural terrain. Roads and buildings still take precedence so landscaping cannot visually overwrite functioning infrastructure.

## Decorations and beautification

Players can place and remove:

- Trees
- Flower beds
- Benches
- Street lamps
- Fountains
- Sculptures
- Community gardens
- Plazas

Decorations are rendered as physical pixel-world objects with isometric depth. They occupy their tile for construction purposes until removed, preventing buildings or roads from silently appearing through them.

Beautification contributes a bounded happiness/desirability bonus to the R6 population simulation, making visual city design mechanically useful without becoming mandatory.

## Building visual variants

Individual buildings can be restyled without changing their gameplay identity:

- Standard
- Heritage
- Green
- Campus
- Industrial
- Glass
- Neon
- Frontier

Later styles unlock with later civilization Ages. The variants are physical architectural details layered onto the R3/R10 building presentation rather than a global color filter.

## Camera and expansion safety

After territory expansion the R2 isometric layout and Phaser camera bounds are recalculated so all newly purchased land is reachable. Existing coordinates are never shifted.

Customization transactions are deliberately isolated from the older city-edit undo snapshot because that snapshot does not contain learning-resource balances. This avoids an unsafe state where an old undo could roll back visual state inconsistently or accidentally interact with later-earned learning resources. Every landscape/decor/style operation has an explicit reverse action instead.

## Runtime contracts

- `Codeopolis.WorldCustomization`
- `Codeopolis.WorldCustomizationUI`
- `Codeopolis.WorldCustomizationVisuals`
- `world.expandCity()`
- `world.customTerrainAt(x, y)`
- `world.setCustomTerrain(x, y, terrain)`
- `world.placeDecoration(x, y, id)`
- `world.removeDecoration(x, y)`
- `world.buildingVisualStyle(x, y)`
- `world.setBuildingVisualStyle(x, y, style)`
- `world.customizationSummary()`
- `world:expanded`
- `customization:terrain`
- `customization:decoration`
- `customization:building-style`

## Acceptance

A player can buy additional territory, pan into the newly unlocked map, reshape empty land, build parks and decorative streetscapes, visually restyle individual buildings, and see beautification affect the living-city simulation while all existing city and learning progress remains intact.

R12 is code-complete when those mechanics are wired and regression-safe. Final visual acceptance still requires viewing the deployed game on mobile and desktop under the project’s reconstruction acceptance rule.

## Next

R13 — Interview Campaign Integration turns the reconstructed city into the main interview-preparation campaign surface: city needs select adaptive problems, solves return to exact world origins, readiness drives campaign milestones, and the campaign remains finite while the city can continue indefinitely.
