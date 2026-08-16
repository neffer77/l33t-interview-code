# Phase 44 P4-B — Town Center Age Advancement

P4-B turns age advancement into a visible city action rather than a background progression toggle.

## Player flow

1. Open the City view.
2. Open the Town Center advancement panel.
3. Review exact mastery and district requirements for the next age.
4. When all requirements are satisfied, advance the Town Center.
5. A full-screen age ceremony announces the new civilization age.
6. Existing age progression events refresh city systems and the new P4-A curriculum pool becomes active.

The Town Center controller persists ceremony/history state, refuses advancement while readiness requirements are incomplete, delegates the actual age mutation to the canonical `AgeProgression` system, and emits `town-center:advanced` and `town-center:ceremony` for later visual/gameplay systems.
