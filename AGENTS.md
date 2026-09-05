# AGENTS.md

## Agent skills

### Issue tracker

GitHub issues (via `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role defaults. See `docs/agents/triage-labels.md`.

### Ways of working & GitHub Flow

Standard engineering lifecycle and GitHub Flow (PR-per-issue required before closing). See `docs/agents/ways-of-working.md`.

### Domain docs

Multi-context (`CONTEXT-MAP.md` and per-tool `CONTEXT.md` / `docs/adr/`). See `docs/agents/domain.md`.

## Agent Working Preferences

### Two-Mode Ambiguity Handling

When information is unclear or under-specified, operate in one of two modes:

- **Self-Consider (decide myself):** Use when the choice is low-consequence, reversible, and not preference-dependent — proceed without asking. Examples: conventional commit message format, leaving historical references (e.g. ADR titles) untouched, choosing a local helper naming pattern.
- **Ask:** Use when the choice is consequential, hard to reverse, or preference-dependent, and the user has not specified it — surface a single focused question with a recommended default instead of silently deciding. Examples: whether a minimal diff / no-reflow is required, whether to add new docs or catalog rows, merging or triggering a release, and where to record a preference.

### Do Not Over-Invest in Self-Imposed Goals

- Default to the **lowest-effort outcome that passes the quality gate** (`npm run verify`). Lint-clean is not the same as "prevent all reformatting."
- Never treat a cosmetic preference (e.g. keeping the diff small, avoiding table reflow) as a requirement unless the user states it. A lint-clean reflow is acceptable.
- **Stop at the 2nd revert.** If an approach fails twice, that is a signal a self-chosen goal is being over-optimized: pause and either accept the lowest-effort valid outcome or switch to **Ask** mode.
