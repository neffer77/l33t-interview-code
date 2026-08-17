# R1 — Production / Runtime Audit

## Purpose

R1 exists because Codeopolis reached green P2–P6 integration tests while the deployed mobile City still looked like the old sparse prototype. The audit therefore distinguishes **source exists** from **loads in production**, **works in state**, **is visible**, and **meets the player-facing product constitution**.

## Executive finding

The P2–P6 work is largely real and reusable, but the player-facing runtime has two critical architectural problems:

1. **Two city renderers coexist.** `src/game/renderer.js` is the legacy Canvas2D/isometric-ish renderer. The Phase 44 path hides it and starts a separate Phaser renderer. If Phaser fails, `phaser-bootstrap.js` deliberately restores the legacy canvas. P4–P6 visual systems are predominantly Phaser-only, so fallback makes large amounts of merged work appear to have done nothing.
2. **Phaser boot is vulnerable to false fallback on mobile.** Before R1, the whole Phase 44 runtime load was capped at 9 seconds even though it sequentially loads dozens of local scripts plus Phaser from jsDelivr. A slow first load can therefore hit the timeout and permanently fall back for that session even when all files are valid. R1 raises this safety window to 30 seconds and emits per-script load telemetry so the actual failing stage can be identified.

The mobile screenshot that triggered R1 visually matches the legacy dark diamond-grid renderer much more closely than the green pixel-terrain Phaser scene. This is a strong indication—not yet device-side proof—that the affected session was in fallback mode.

## Renderer reality

### Legacy Canvas2D renderer

- `src/game/renderer.js` draws an isometric-style city using Canvas2D geometry.
- The older `app.js::renderCityCanvas()` also draws the original dark-blue 3×6 diamond board and emoji structures.
- This path remains as a fallback and is intentionally restored by `PhaserCivilizationBootstrap.fallback()`.
- It cannot host the later Phaser-only Living City, world venue, projection, and interaction layers.

### Phaser renderer

- `src/civilization/phaser/city-scene.js` is currently a **top-down 32×32 orthogonal tile renderer**, not an isometric Stardew/SimCity renderer.
- `city-assets.js` contains only palettes and numeric colors. There is no cohesive building/terrain sprite asset pack.
- `generatePixelTextures()` creates terrain, trees, roads, and buildings procedurally from Phaser rectangles/pixels.
- All curriculum-district buildings currently share one generic procedural building silhouette per district color.
- Therefore even a perfectly functioning Phaser session still cannot meet the new visual constitution without R2/R3 reconstruction.

## State / save findings

- `fresh()` currently begins with `buildings:['camp']`, population 12, energy 5, and happiness 78.
- `WorldSystem.migrateLegacy()` automatically materializes owned buildings and a starter road across the world on first migration.
- P6-H then attempts to bootstrap Founder Camp, two Housing Blocks, Recovery Park, and starter roads when the world has fewer than three placed buildings.
- This directly conflicts with the newly locked product decision that a fresh player should begin on **empty land** and earn/place the first structure through coding.
- P6-H also mutates owned inventory/world state but does not itself force the legacy UI summary to rerender or persist immediately. `renderCitySummary()` reads `state.buildings.length`, while the actual map reads `world.placedBuildings()`, so player-visible counts can temporarily disagree with physical world state.

## P2–P6 production disposition matrix

| Phase / system | Source | Runtime path | Player-visible today | Product disposition |
|---|---|---|---|---|
| P2 learning resources / economy | Present | Loaded through Phaser bootstrap + Phase 44 runtime | Mostly HUD/panels | **KEEP**; core economy intelligence |
| P2 mastery / retention / transfer / interleaving / anti-grind | Present | Phase 44 runtime | Mostly panels/recommendations | **KEEP**; core educational brain |
| P2 adaptive challenge selection / interview readiness / analytics | Present | Phase 44 runtime | Mostly panels | **KEEP**; use to choose city-origin coding tasks |
| P3 Learning City contracts | Present | Phase 44 runtime | Building/catalog oriented | **KEEP / REWIRE** to new city action UX |
| P3 map beacons / build-ready flow | Present | Phaser-dependent | Weak if Phaser works; absent in fallback | **KEEP logic / REPLACE presentation** |
| P4 ages / curriculum pools / Town Center progression | Present | Phase 44 runtime | Panels/ceremonies | **KEEP** |
| P4 age visual evolution | Present | Phaser-dependent | Tints/scales/accents | **REPLACE presentation in R2/R3/R10** |
| P4 district evolution / landmarks | Present | Phaser-dependent | Halos/badges/basic overlays | **KEEP progression; REPLACE art** |
| P5 citizen pathfinding / schedules | Present | Phaser-only | Invisible in fallback | **KEEP**; important simulation foundation |
| P5 ambient activity / reactions | Present | Phaser-only | Invisible in fallback | **KEEP**, redraw through reconstructed renderer |
| P5 identities/dialogue | Present | Phaser-only | Optional to product goal | **DE-EMPHASIZE**, retain as flavor |
| P6 A–E integration consequence state | Present | Existing Systems Bridge | Mostly abstract | **KEEP infrastructure**, reduce prominence |
| P6-F status dashboard | Present | Phaser host overlay | Dashboard-heavy | **DE-EMPHASIZE / management UI only** |
| P6-G visual projection | Present | Phaser-only | Subtle tint/aura | **REPLACE presentation** |
| P6-H settlement bootstrap | Present | Phase 44 runtime | Intended physical seed | **RETIRE/REWORK** because product now starts empty |
| P6-I solve→growth | Present | Phase 44/P6-H | Physical build/upgrade | **KEEP concept**, route through manual construction economy |
| P6-J/K world interactions + world missions | Present | Phaser-only + coding UI | Valuable loop | **KEEP**, NPC branch becomes secondary |
| P6-L system venues | Present | Phaser-only primitives | Basic rectangles/text | **KEEP concepts; REPLACE art** |
| P6-M game feel | Present | Phaser-only | Effects only | **KEEP supporting layer** |
| P6-N world-first UX | Present | Mobile shell / Phaser host | Helps hierarchy only when Phaser is active | **KEEP intent, reconstruct UI around R2–R6** |

## Immediate R1 fixes

### 1. Prevent normal slow loads from masquerading as renderer failures

`PHASER_BOOT_TIMEOUT_MS` is raised from 9,000 ms to 30,000 ms. This is still a bounded failure window, but no longer assumes dozens of sequential first-load requests can always finish in nine seconds on mobile.

### 2. Instrument the exact renderer failure path

`phaser-bootstrap.js` now emits `civilization:phaser-load` events for script start / load / error and exposes the configured boot timeout. Existing `civilization:phaser-ready` and `civilization:phaser-fallback` events remain authoritative.

### 3. Add a production audit harness

`Codeopolis.R1ProductionAudit` can report:

- active renderer (`phaser`, `legacy-canvas`, `pending`)
- fallback reason when captured
- state-owned building count vs physically placed building count
- road count / population / world migration state
- P2–P6 module presence and missing modules
- recent Phaser load events
- warnings for major state/runtime contradictions

The harness is intentionally diagnostic and does not become another player dashboard.

## Known gaps that R1 does not pretend to solve

- The Phaser renderer is still orthogonal and procedurally drawn; R2 must replace the visual foundation.
- The building artwork is still generic; R3 must add a real pixel-art asset pipeline.
- Fresh-start semantics still conflict with the new empty-land design; R4 should replace P6-H bootstrap behavior with the first build/earn tutorial loop.
- The legacy Canvas2D renderer remains in the codebase. R2 should decide whether it becomes a minimal emergency compatibility screen or is removed from normal gameplay entirely.
- Current unit tests do not perform screenshot-based visual acceptance. R14 will establish that gate; earlier R2+ milestones should already add practical visual verification.

## R2 entry criteria

R2 can begin once R1 CI is green and the audit branch is merged. R2 should assume the following constitution:

- City is the primary experience.
- Stardew-like cohesive pixel art.
- Deep SimCity-style building/planning simulation.
- Real interview coding is the primary resource/repair action.
- Normal city view is world-first; coding takes over contextually and returns to the same place.
- No city-facing milestone passes on module-presence tests alone.
