# Phase 31 — Spaced Retention Lab

Phase 31 adds durable recall scheduling on top of the Phase 26 Skill Graph.

## Goal

A pattern is not useful in an interview if it was only available immediately after practice. Phase 31 converts successful skill evidence into short, scheduled recall checks so the game measures whether knowledge remains accessible over time.

## Schedule

Successful recall expands through approximate intervals of 1, 3, 7, 14, and 30 days. The schedule is local and deterministic.

## Variant preference

When a skill is due, the scheduler prefers another unlocked judged challenge that exercises the same fine-grained skill instead of repeating the exact most-recent problem. This encourages transfer instead of answer memorization.

If no related variant exists yet, the best available related challenge is used.

## Authority boundary

Only existing judged `learning:mastered` evidence advances a retention card. Opening the Retention Lab, launching a challenge, or snoozing an item does not count as recall.

## No streak coercion

Due items have no failure timer and no penalty for being late. The player can choose **Tomorrow** to move a review one day forward without losing currency, readiness, mastery, streaks, or progress.

## Feedback

Longer successful intervals produce positive knowledge-retention feedback and local telemetry. The system does not grant career outcomes or bypass any existing interview/curriculum scoring authority.