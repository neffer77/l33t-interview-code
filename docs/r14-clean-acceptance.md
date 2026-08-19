# R14 Clean — Visual/Mobile QA & Deployment Acceptance

R14 is the final City Game Reconstruction gate. The runtime/mobile corrections landed first in PR #145; PR #146 completes the acceptance harness and deployment verification.

## Canonical viewports

- Phone portrait: 390×844
- Phone landscape: 844×390
- Tablet: 834×1112
- Desktop: 1440×1000
- Wide desktop: 1920×1080

## Deterministic player flow

Every viewport starts in a fresh browser context with service workers blocked so cached files cannot hide a deployment/runtime defect. The browser acceptance then verifies:

1. Phaser is active and the legacy Canvas2D renderer is hidden.
2. The document has no material horizontal overflow.
3. A fresh save starts from empty land with zero buildings and zero roads.
4. First-run onboarding is visually primary rather than competing with city FABs/HUDs.
5. The first city action enters the coding stage.
6. A progression resource event returns the first-run loop to the build-ready stage.
7. The first building is placed through the real placement controller using a player pointer click.
8. A representative road/building city renders and passes the runtime visual audit.
9. Interview Campaign is usable from the city.
10. Customize is usable from the city and is mutually exclusive with the Campaign panel.
11. Expanding the R12 world updates the isometric layout and Phaser camera bounds.
12. Severe page/runtime JavaScript errors fail the run.

## Screenshot evidence

Seven screenshots are captured for every viewport, 35 images per acceptance run:

1. Empty land
2. Coding mission
3. Build ready
4. Operating city
5. Interview Campaign
6. Customization
7. Expanded city

The PR workflow uploads `r14-clean-local-player-evidence` from the exact `_site` production artifact.

After merge, the GitHub Pages workflow reruns the identical flow against the published Pages URL and uploads `r14-clean-deployed-player-evidence`.

## Runtime fixes

The clean R14 runtime fixes replace remaining orthogonal mobile-camera math with the R2 isometric projection, synchronize camera bounds after world expansion, keep touch targets usable on short/mobile layouts, suppress secondary world controls during the empty-land opening, and enforce exclusivity between large city panels.

## Acceptance boundary

A green PR browser run proves the production artifact passes the deterministic cross-device player flow. Full production acceptance additionally requires the post-deploy Pages run to pass and the deployed screenshot evidence to be visually reviewed. This preserves the Product Constitution rule that city-facing milestones are not accepted from unit/module tests alone.

Once those deployed checks and screenshots pass visual review, R1–R14 City Game Reconstruction is complete and post-reconstruction polish/release work can resume.
