# Phase 44 P6-A — Existing Systems Registry & Event Bridge

P6 begins the integration pass that reconnects the long-lived Codeopolis systems to the newer civilization runtime.

## Purpose

Older learning, career, company, social/NPC, and civilization systems should not require one-off wiring every time the city needs to react to them. P6-A introduces a canonical registry and event bridge.

## What it does

- Groups existing Codeopolis systems into learning, career, company, social, and world domains.
- Reports which legacy systems are currently available at runtime.
- Normalizes important legacy events into a common `existing-system:activity` payload.
- Emits domain-specific events such as `existing-system:career` and `existing-system:social`.
- Installs through the Phase 44 runtime so later P6 slices can consume one stable integration surface.
- Avoids changing ownership of the underlying systems; the bridge adapts them rather than replacing them.

## Validation

`tests/existing-systems-bridge.mjs` verifies registry discovery, event normalization, event subscription, and domain re-emission. The test is part of the consolidated regression runner.

## Next

Future P6 slices can use this bridge to make career progress, company/team systems, interview readiness, NPC/team missions, crises, and story systems produce visible city consequences without duplicating integration logic.
