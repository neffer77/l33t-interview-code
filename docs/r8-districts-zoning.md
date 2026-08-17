# R8 — Districts & Zoning

R8 adds player-authored land-use planning to Codeopolis. The player no longer only decides which building to construct; they decide what each part of the city is *for* and shape coherent neighborhoods that change how the simulation performs.

## Zone types

- **🏠 Residential** — homes, neighborhoods, and population capacity.
- **📚 Learning** — interview practice, teaching, and skill-building venues.
- **🔬 Research** — deep technical research and algorithm development.
- **⚡ Compute** — power, systems, infrastructure, and compute capacity.
- **🌳 Civic** — parks, recovery, community, and civic services.
- **🏙️ Mixed** — flexible innovation corridors that accept every building type.

## Player loop

1. Open **Zones** from the City view.
2. Choose a land-use type and tap or drag across tiles to paint it.
3. Watch live demand scores for housing, learning, research, compute, civic, and mixed-use land.
4. Place buildings in districts that match their natural role. Placement is never hard-blocked by zoning, but the preview explains whether the site is a match, mismatch, or unzoned.
5. Grow contiguous zone clusters from parcels into blocks, quarters, and full districts.
6. Put complementary zones beside one another for additional efficiency — for example Residential near Civic/Learning and Research near Learning/Compute.
7. Mature clusters acquire an emergent identity such as **Interview Campus**, **AI Research Park**, **Systems & Compute Grid**, **Civic Commons**, or **Innovation Corridor**.

## Simulation rules

Zoning composes with roads, power, population, building operations, construction, and the existing learning systems.

- Matching zone: modest efficiency benefit.
- Matching contiguous district: additional cluster benefit.
- Complementary neighboring land uses: additional adjacency benefit.
- Mixed-use: small universal fit bonus.
- Mismatched zone: recoverable efficiency penalty, not a construction lock.
- Unzoned land: neutral performance.

The resulting multiplier affects real building output and service capacity, including housing, jobs, power, happiness, money, and research. This makes city layout a strategic choice instead of a cosmetic overlay.

## Demand

Demand is derived from the living city rather than a fixed script. Housing/job pressure, happiness, power coverage, active learning goals, existing zone supply, and unzoned buildings all influence the six demand scores. The zoning panel surfaces the highest current need without forcing the player to obey it.

## Safety

Zoning can reduce city efficiency but **never deletes or rolls back solved problems, mastery, retention, interview readiness, or any earned learning progress**. A poor city layout is a planning problem the player can redesign, not a punishment that erases learning.

## Runtime contracts

- `Codeopolis.DistrictZoning`
- `Codeopolis.DistrictZoningUI`
- `Codeopolis.DistrictZoningVisuals`
- `world.zoneAt(x, y)`
- `world.setZone(x, y, zone)`
- `world.buildingZoningStatus(x, y)`
- `world.cityZoningSummary()`
- `world.cityZoningDemand()`
- `zoning:changed`
- `zoning:demand-changed`

## Acceptance

A player can paint a district, see it visibly appear on the isometric map, inspect live demand, place a building with zoning feedback, grow a contiguous neighborhood into a named specialization, and observe actual city output/capacity change from zone fit and adjacency without losing any earned learning progress.
