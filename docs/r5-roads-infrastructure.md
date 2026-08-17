# R5 — Roads & Infrastructure

R5 makes roads and power a connected simulation rather than independent counters.

## Player-facing contract

- Roads form connected components. A building only has road service when its footprint touches a real connected road component.
- Power-producing buildings energize the road component they are attached to.
- Power-consuming buildings must touch a powered component; an isolated building is visibly and mechanically under-served.
- Grid capacity is shared across powered buildings and constrains building efficiency when demand exceeds supply.
- The Phaser world renders powered road components with a visible energized overlay and shows service warnings over disconnected/unpowered structures.
- Existing worker and housing constraints continue to compose with infrastructure efficiency.

## Simulation contract

`world.infrastructureNetwork()` returns road components, attached buildings, powered components, aggregate supply/demand, and connection counts. `world.infrastructureStatus(x,y)` gives the physical network state for one building. `world.infrastructureAudit()` supplies a compact QA snapshot.

The existing `buildingServiceStatus()` remains authoritative for downstream production effects, but R5 replaces its abstract city-wide road/power assumptions with physical network connectivity.

## Visual acceptance

A player should be able to disconnect a building by removing its road link, see its service efficiency fall, reconnect it, connect a power source to the same road network, and visibly see that network become powered. Infrastructure state must be understandable from the map without opening a statistics dashboard.

## Next

R6 is Population Simulation Embodiment: housing capacity, jobs, migration, services, happiness, visible commuters/citizens, demand, and population growth tied to the physical city.
