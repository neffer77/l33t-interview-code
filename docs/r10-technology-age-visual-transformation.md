# R10 — Technology & Age Visual Transformation

R10 replaces the old P4 presentation model of background color + building tint + scale with a physical civilization transformation.

## Player-visible transformation

Each civilization Age now changes actual generated city assets:

1. **Age I · Foundations** — timber workshops, braces, settlement tracks, sparse wooden infrastructure.
2. **Age II · Data Structures** — brick/masonry civic blocks, awnings, cobbled streets, street lamps.
3. **Age III · Algorithms** — stone institutes, columns and spires, academic streets, established campus details.
4. **Age IV · Systems** — pipes, stacks, rooftop utilities, industrial roads, utility poles and systems hardware.
5. **Age V · Advanced Engineering** — glass technical cores, antennas, smart-road nodes, denser high-tech details.
6. **Age VI · Frontier Engineer** — arcology rings, energy beacons, luminous transit infrastructure and frontier research hardware.

Building textures include Age in their cache key, so an Age transition produces a new architectural asset instead of tinting the old sprite.

## Technology becomes physical

Unlocked technologies add relevant infrastructure to the map, including:

- Foundational Engineering cranes
- Indexed Data boards
- Tree Structure branch arrays
- Graph Traversal network nodes
- Optimization compute cores
- Systems Architecture utility pylons
- Distributed Systems relays
- Reliability/Resilience status and shield nodes
- Frontier Computation cores
- Frontier Engineering arcology beacons

These props appear next to buildings that use the technology rather than as dashboard-only unlock text.

## City capability

Age and relevant researched technologies provide bounded capability multipliers to real building effects and service capacity. These bonuses compose after roads/power, population, maintenance, zoning, and supply-chain systems. They never alter solved-problem history, mastery, retention, or interview readiness.

## District evolution

P4 district maturity overlays are moved onto the R2 isometric projection. District maturity now adds physical neighborhood details such as planters, lamps, institute masts and mastery beacons without scaling the building sprite or breaking R3 architecture.

## Runtime contracts

- `Codeopolis.AgeCityTransformation`
- `Codeopolis.BuildingAssetSystem.AGE_STYLE`
- `world.buildingAgeCapability(x, y)`
- world snapshot `age`
- world snapshot `technologies`
- per-building `ageLevel`
- per-building `ageCapability`
- `age-city:transformed`
- `r10:age-city-ready`

## Acceptance

An Age transition must be recognizable with labels and dashboards hidden: buildings, road infrastructure, street furniture and relevant technology hardware visibly change in the world. A researched technology must have a physical city manifestation where applicable. Existing learning progress is never destroyed by Age or technology simulation effects.
