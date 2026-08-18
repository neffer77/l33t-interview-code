# R14 — Visual / Mobile QA & Deployment Acceptance

R14 is the final City Game Reconstruction gate. It does not treat green unit tests as proof that Codeopolis is player-ready.

## Canonical player viewports

- Phone portrait — 390×844
- Phone landscape — 844×390
- Tablet — 834×1112
- Desktop — 1440×1000
- Wide desktop — 1920×1080

## Browser acceptance path

`scripts/r14-browser-acceptance.py` launches Chromium against the production-built site and exercises every viewport from a clean browser context.

For each viewport it verifies:

1. Phaser owns the city and the legacy Canvas2D fallback is not visible.
2. The document has no material horizontal overflow.
3. A fresh save starts from empty land with zero placed buildings and roads.
4. The empty-land onboarding is the primary visible action instead of competing HUD controls.
5. **Earn starter resources** actually enters the coding stage.
6. A learning-resource reward returns the first-run state to Build.
7. A representative manually authored city can be rendered with buildings and roads.
8. The reconstructed world remains usable with Interview Campaign and Customize controls.
9. Campaign and customization panels behave exclusively instead of stacking over each other.
10. R12 map expansion changes the isometric world extent and the Phaser camera bounds follow the new layout.
11. Key controls meet a 38px minimum interaction target and remain inside the city host.
12. Runtime page errors / serious JavaScript errors fail acceptance.

The run captures six screenshots per viewport:

- `01-empty-land.png`
- `02-coding-mission.png`
- `03-operating-city.png`
- `04-interview-campaign.png`
- `05-customization.png`
- `06-expanded-city.png`

That produces 30 player-visible screenshots per acceptance run rather than relying on module tests alone.

## CI acceptance

`.github/workflows/validate.yml` contains **R14 cross-device player acceptance**. It builds the exact deployable `_site`, starts a local production server, installs Chromium/Playwright, runs all five viewports, and uploads `r14-local-player-evidence` even when the browser job fails.

This is the PR gate.

## Deployed acceptance

`.github/workflows/pages.yml` now has a post-deploy **R14 deployed mobile/desktop acceptance** job. After GitHub Pages publishes, the same browser flow runs against the actual Pages URL with a fresh browser context and fetches `build-info.json`. Evidence is uploaded as `r14-deployed-player-evidence` for 30 days.

This is the production gate. R14 is not considered fully accepted until that deployed job is green and its screenshots have been visually reviewed.

## Runtime fixes found during R14

### Isometric mobile camera

The mobile camera controller was still converting tile coordinates as `x * tile`, `y * tile`, which belonged to the old orthogonal renderer. Focus, reset, and double-tap now use the R2 isometric projection (`toWorld` / `fromWorld`) and the actual `layout.worldWidth` / `layout.worldHeight`.

### Expansion camera bounds

R12 can increase the map from 12×8 to 36×26. The old scene refresh recalculated the isometric layout but Phaser could retain the previous bounds. `R14PlayerAcceptance` patches refresh to synchronize camera bounds with every new layout and also responds to `world:expanded`.

### First-five-minutes hierarchy

During the empty-land onboarding, secondary Build, Customize, Campaign, Population, and camera controls are hidden. The player sees the intended first action: solve an interview problem to earn starter resources. Normal city controls appear once the first building is placed.

### Mobile panel collision

Interview Campaign and Customize are coordinated as mutually exclusive world panels so two large bottom sheets cannot cover each other on a phone.

### Landscape usability

Short landscape screens get a smaller minimum city height, compact population presentation, and taller scrollable panels while preserving minimum touch-target sizes.

## Acceptance boundary

R1–R13 are reconstruction implementation slices. R14 is the acceptance layer across the whole product. A green PR proves the local production build passes deterministic browser QA. A green Pages post-deploy run proves the published build passes the same flow. Human inspection of those screenshots remains the final visual-quality check under the Product Constitution.
