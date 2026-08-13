# Phase 24 — Optional AI Characters & Scenario Director

Phase 24 adds optional generative variety without moving progression authority into an LLM.

## Capabilities

- Mentor, coworker, interviewer, and executive dialogue.
- Player-selectable adaptive/supportive/direct/principal character tone.
- Context-aware engineering practice scenario generation.
- Deterministic local fallback when AI is disabled, unavailable, slow, or errors.
- Local endpoint/config persistence for browser and Scriptable compatibility.

## Authority boundary

AI output may:

- explain concepts;
- ask follow-up questions;
- roleplay fictional coworkers and leaders;
- generate fictional engineering context;
- suggest areas to inspect.

AI output may **not**:

- grant mastery;
- mark hidden tests as passed;
- change Project CI or Repository Lab scores;
- award currency/research;
- complete incidents/design exercises;
- decide hiring outcomes;
- satisfy performance or leadership gates;
- promote the player.

Existing deterministic systems remain authoritative. This keeps generated dialogue useful and varied without letting prompt wording become a progression exploit.

## Privacy / networking

The feature is opt-in. With no endpoint configured it makes no AI network requests. When enabled, the configured proxy receives the bounded context required for the requested dialogue/scenario. The endpoint itself is stored locally. The app continues to function using local fallback content if the endpoint fails.

## Future integration

The director exposes `speak()` and `scenario()` so existing mentor, company, hiring, campaign, and leadership surfaces can progressively adopt generative dialogue while retaining their current scoring and state machines.