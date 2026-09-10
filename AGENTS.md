# AGENTS.md

## Agent skills

### Issue tracker

GitHub issues (via `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role defaults. See `docs/agents/triage-labels.md`.

### Ways of working & GitHub Flow

Standard engineering lifecycle, GitHub Flow, and Subagent Quality Protocol (PR-per-issue required before closing, ADR-0010). See `docs/agents/ways-of-working.md` and `docs/adr/0010-subagent-quality-guardrails-and-two-speed-tdd.md`.

### Domain docs

Multi-context (`CONTEXT-MAP.md` and per-tool `CONTEXT.md` / `docs/adr/`). See `docs/agents/domain.md`.

### Phase 1 Kickoff & Grilling

Orchestrate Phase 1 (grilling, domain docs, vertical slices, and GitHub issues) via `grill-wow`. See `.agents/skills/grill-wow/SKILL.md`.

### Phase 2 Adversarial TDD & Blind Test Generation

Blind seam test generation derived from issue ACs and domain definitions. See `.agents/skills/adversarial-tdd/SKILL.md`.

### Phase 3 Dual-Axis Code & Invariant Review

Dual-axis review for Standards + 5 Repository Invariants and Spec Conformance. See `.agents/skills/code-review/SKILL.md`.

### Phase 4 Acceptance Criteria & Release Verification

Mechanically audit Acceptance Criteria checkboxes and sign-off on release issues. See `.agents/skills/verify-ac/SKILL.md`.
