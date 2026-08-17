import { spawnSync } from 'node:child_process';

const suites = [
  ['beta readiness smoke', 'tests/beta-smoke.mjs'],
  ['civilization foundation', 'tests/civilization-foundation.mjs'],
  ['city services', 'tests/city-services.mjs'],
  ['building specializations', 'tests/building-specializations.mjs'],
  ['construction queue', 'tests/construction-queue.mjs'],
  ['planning overlays', 'tests/planning-overlays.mjs'],
  ['city editing', 'tests/city-editing.mjs'],
  ['Phase 1 integration', 'tests/phase1-integration.mjs'],
  ['concept resources', 'tests/concept-resources.mjs'],
  ['multi-resource economy', 'tests/multi-resource-economy.mjs'],
  ['coding reward pipeline', 'tests/coding-reward-pipeline.mjs'],
  ['curriculum districts', 'tests/curriculum-districts.mjs'],
  ['resource-gated buildings', 'tests/resource-gated-buildings.mjs'],
  ['concept mastery', 'tests/concept-mastery.mjs'],
  ['age progression', 'tests/age-progression.mjs'],
  ['P4-A age curriculum pools', 'tests/age-curriculum-pools.mjs'],
  ['P4-B Town Center advancement', 'tests/town-center-advancement.mjs'],
  ['P4-C age visual evolution', 'tests/age-visual-evolution.mjs'],
  ['P4-D district age evolution', 'tests/district-age-evolution.mjs'],
  ['P4-E age unlock landmarks', 'tests/age-unlock-landmarks.mjs'],
  ['P4-F age transition reveal', 'tests/age-transition-reveal.mjs'],
  ['P4-G Phase 4 integration and balance', 'tests/p4-integration.mjs'],
  ['P5-A citizens and NPC pathing', 'tests/living-city-citizens.mjs'],
  ['P5-B citizen schedules and building activity', 'tests/citizen-schedules.mjs'],
  ['P5-C ambient city activity and particles', 'tests/ambient-city-activity.mjs'],
  ['P5-D city events and citizen reactions', 'tests/city-event-reactions.mjs'],
  ['P5-E named citizens roles and relationships', 'tests/citizen-identities.mjs'],
  ['P5-F citizen dialogue mentorship', 'tests/citizen-dialogue-mentorship.mjs'],
  ['P5-G Living City integration and balance', 'tests/p5-integration.mjs'],
  ['P6-A existing systems registry and event bridge', 'tests/existing-systems-bridge.mjs'],
  ['P6-B career and interview city consequences', 'tests/career-city-consequences.mjs'],
  ['P6-C company and leadership city consequences', 'tests/company-city-consequences.mjs'],
  ['P6-D social team city consequences', 'tests/social-team-city-consequences.mjs'],
  ['P6-E world story city consequences', 'tests/world-story-city-consequences.mjs'],
  ['P6-F unified civilization status dashboard', 'tests/civilization-status-dashboard.mjs'],
  ['P6-G city visual state projection and integration', 'tests/city-visual-state-projection.mjs'],
  ['P6-H playable settlement bootstrap', 'tests/playable-settlement-bootstrap.mjs'],
  ['P6-I SimCity construction and growth loop', 'tests/simcity-growth-loop.mjs'],
  ['P6-J Stardew-style NPC and world interactions', 'tests/world-interactions.mjs'],
  ['P6-K world-origin missions', 'tests/world-origin-missions.mjs'],
  ['P6-L existing systems become world venues', 'tests/existing-system-world-venues.mjs'],
  ['technology tree', 'tests/technology-tree.mjs'],
  ['adaptive challenge selection', 'tests/adaptive-challenge-selection.mjs'],
  ['learning objectives', 'tests/learning-objectives.mjs'],
  ['problem quality and anti-grind', 'tests/anti-grind.mjs'],
  ['knowledge retention', 'tests/knowledge-retention.mjs'],
  ['transfer and generalization', 'tests/transfer-generalization.mjs'],
  ['interleaved practice', 'tests/interleaved-practice.mjs'],
  ['interview readiness', 'tests/interview-readiness.mjs'],
  ['Phase 2 integration and balance', 'tests/p2-integration.mjs'],
  ['original P2-M Learning Analytics', 'tests/learning-analytics.mjs'],
  ['original P2-N Civilization Specialization', 'tests/civilization-specialization.mjs'],
  ['original P2-O Integration & Balance', 'tests/original-p2-o-integration.mjs'],
  ['P3 Learning City Loop', 'tests/learning-city-loop.mjs'],
  ['P3-D mastery building gates', 'tests/mastery-building-gates.mjs'],
  ['P3-E concept-specific city mission', 'tests/concept-specific-city-missions.mjs'],
  ['P3-F city learning navigator', 'tests/city-learning-navigator.mjs'],
  ['P3-G map learning beacon', 'tests/city-learning-map-beacon.mjs'],
  ['P3-H persistent city goal', 'tests/persistent-city-goals.mjs'],
  ['P3-I goal completion build flow', 'tests/goal-completion-build-flow.mjs'],
];

const started = Date.now();
for (let i = 0; i < suites.length; i += 1) {
  const [name, file] = suites[i];
  process.stdout.write(`\n[${i + 1}/${suites.length}] ${name}\n`);
  const result = spawnSync(process.execPath, [file], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`\nFAILED: ${name} (${file})`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\nAll ${suites.length} regression suites passed in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
