# Phase 44 P2-N — Civilization Specialization

P2-N implements the original Civilization Specialization roadmap slice using the modern Phase 44 learning evidence systems.

## Design goal

The civilization's identity is earned from demonstrated learning rather than selected from a class screen. Specialization is therefore a reflection of what the player can actually do.

## Specialization families

- Algorithmic Research
- Backend Systems
- Systems Engineering
- Reliability Engineering
- Security Engineering
- AI / ML Engineering

Each solve is mapped to one specialization using concept and curriculum-district evidence. Eligible evidence is weighted by difficulty, solve quality, retention strength, and transfer/generalization breadth. Incorrect or anti-grind-blocked solves grant no specialization evidence.

## Progression

Specialization evidence advances through four thresholds:

- Emerging
- Established
- Advanced
- Elite

The strongest specialization becomes the civilization's primary identity and the second strongest becomes its secondary identity. Balanced pairs can unlock hybrid identities such as Performance Engineering, Infrastructure Engineering, Platform Security, and ML Engineering.

## Gameplay effects

Established specialization provides a deliberately small resource-efficiency bonus. The multiplier is capped at 1.10 so specialization changes strategic flavor without becoming a progression exploit.

## Visible city identity

A Civilization Identity panel is attached to the city surface. It shows the current identity, specialization shares, primary/secondary paths, level, bounded gameplay perk, and unlocked hybrid identity.

This is intentionally a bridge into the original P3–P5 roadmap: P2-N establishes identity and evidence, while later phases can make that identity alter buildings, districts, architecture, citizens, and ambient city behavior.

## Compatibility

This implementation preserves the older Phase 32 design boundary: city specialization may affect identity and bounded gameplay flavor, but it does not change coding correctness, interview rubrics, or authoritative learning scores.

## Validation

`tests/civilization-specialization.mjs` verifies concept mapping, evidence accumulation, anti-grind protection, bounded bonuses, hybrid identity, and save persistence. The suite runs in `Validate Codeopolis`.
