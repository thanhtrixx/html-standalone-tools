# AGENTS.md

## Agent skills

### Issue tracker

GitHub issues (via `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role defaults. See `docs/agents/triage-labels.md`.

### Ways of working & GitHub Flow

Standard engineering lifecycle, GitHub Flow, Subagent Quality Protocol (PR-per-issue required before closing, ADR-0010), and Optimal Token Strategy (ADR-0012). See `docs/agents/ways-of-working.md`, `docs/adr/0010-subagent-quality-guardrails-and-two-speed-tdd.md`, and `docs/adr/0012-optimal-token-strategy-and-subagent-economics.md`.

### Token Economics & Subagent Strategy

Two-tier delegation threshold, scoped inner-loop test runner gates, and fan-in digest compression (≤ 300–400 words). See `docs/adr/0012-optimal-token-strategy-and-subagent-economics.md`.

### Dual-Phase Tool Lifecycle & Scoped Quality

Active Feature Development (velocity) vs Hardened Stable (quality, zero regression), tool-scoped test suites (`npm run test:<tool>`), and graduation DoD. See `docs/adr/0013-dual-phase-tool-lifecycle-and-scoped-quality-governance.md`.

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
