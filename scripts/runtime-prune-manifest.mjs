// Production-only dead-runtime manifest.
//
// These historical surfaces are preserved in Git for now, but they are not part
// of the canonical Challenge/Learn/Mock/City/Build/Research/Events/Progress game
// and must not ship or execute in the Pages runtime. P2 keeps this list explicit
// so every retirement is reviewable and acceptance-tested.
export const PRUNED_RUNTIME_SCRIPTS = Object.freeze([
  'src/repository-sim/repository-sim.js',
  'src/projects/real-projects.js',
  'src/projects/phase23-integration.js',
  'src/ai/phase24-ui.js',
]);

export const PRUNED_RUNTIME_STYLES = Object.freeze([
  'phase22.css',
  'phase23.css',
  'phase24.css',
]);

export const PRUNED_RUNTIME_DOM_IDS = Object.freeze([
  'repositorySim',
  'realProjects',
  'aiStudio',
]);
