# Phase 23 — Real Python Engineering Projects

Phase 23 expands Codeopolis from interview-sized functions and code-review exercises into small repository-scale Python projects.

## Goals

- Practice coordinating behavior across multiple files and abstractions.
- Train API boundaries, state ownership, reliability, security, and testing.
- Preserve the local-first browser / iOS Scriptable runtime.
- Produce reusable project-completion evidence for later Coach, company, and leadership integration.

## Initial project set

### Atlas Cloud — Distributed Rate Limiter
Implement token-bucket policy, storage coordination, and behavioral tests.

### Nova Robotics — Resilient Job Runner
Implement queue semantics, bounded retries, result tracking, failure isolation, and tests.

### Vector Security — Safe Feature Flag Service
Implement deterministic precedence, safe defaults, privacy-conscious audit records, and tests.

## Project loop

1. Start a project from its starter repository.
2. Navigate between multiple Python files.
3. Edit files in a local autosaved workspace.
4. Work through explicit engineering milestones.
5. Run Project CI.
6. Receive requirement-by-requirement results and an overall score.
7. Ship only at 80+.

Project CI currently evaluates structural requirements and test intent locally. It is intentionally transparent and deterministic; later slices can execute full Pyodide unit tests against the virtual project filesystem.

## Events

- `codeopolis:real-project-scored`
- `codeopolis:real-project-complete`

These events allow the Coach, company project board, performance reviews, and leadership systems to consume project evidence without becoming the source of truth for project scoring.

## Progression invariant

Opening files, typing code, or waiting does not grant project completion. A project must satisfy its explicit engineering checks and achieve an 80+ CI score before it can be shipped.