# Phase 26 — Curriculum Expansion & Skill Graph

Phase 26 expands Codeopolis from a small challenge sequence into a scalable interview curriculum.

## Executable challenge expansion

The judged Python bank grows from 8 to 20 challenges. The new problems cover hash sets and frequency maps, sliding-window variants, binary-search boundaries, top-k heaps, intervals, topological sort, multi-source BFS, linear/grid dynamic programming, and monotonic stacks. Each challenge includes starter code, hints, lessons, complexity guidance, public examples, and hidden tests.

## Skill graph

Challenges map into fine-grained skills rather than only broad districts. The initial graph includes array invariants, windowing, sorting and intervals; set/frequency-map skills; binary-search boundaries; stack/monotonic-stack and heap skills; DFS/BFS/multi-source traversal, cycle detection and topological sorting; DP recurrence/grid/space optimization; Python Counter, deque, heapq and hashability; and foundation skills such as complexity and edge-case reasoning.

Prerequisites are explicit, so future Coach planning can distinguish a root weakness from a downstream symptom.

## Evidence states

Skills progress through:

- Unseen
- Seen
- Solved
- Mastered
- Retained

Repeated or cross-challenge evidence produces mastery. Retention requires repeated/variant evidence separated over time; there is no punishment, currency loss, or destructive decay when evidence is old.

## Challenge families

Related problems carry family metadata such as `top-k`, `sliding-window`, `binary-search-boundary`, `directed-graphs`, and `linear-dp`. This creates the foundation for deterministic variants and for measuring transfer across related prompts instead of counting repeated memorization of one exact problem.

## UI

The new Skills tab shows state counts, weakest evidence gaps, prerequisites, and grouped skill status. The graph listens to authoritative mastery events; it does not create progress from opening content or clicking through explanations.

## Future content contract

New challenge packs should provide `family` and `skillIds` metadata and continue using the existing hidden-test judge. This allows the bank to grow substantially without changing the progression authority.