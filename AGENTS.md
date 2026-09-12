# AGENTS.md

## Agent skills

### Issue tracker

GitHub issues (via `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role defaults. See `docs/agents/triage-labels.md`.

### Ways of working & GitHub Flow

Token-first three-tier change classification (Tier 0 Zero-Ceremony / Tier 1 Scoped Lightweight / Tier 2 Full Ceremony), phase-aware quality gating, and Subagent Quality Protocol. See `docs/agents/ways-of-working.md` and `docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md`.

### Token Economics & Subagent Strategy

Two-tier delegation threshold, scoped inner-loop test runner gates, and fan-in digest compression (≤ 300–400 words). See `docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md`.

### Dual-Phase Tool Lifecycle & Scoped Quality

Active Feature Development (velocity) vs Hardened Stable (quality, zero regression), tool-scoped test suites (`npm run test:<tool>`), and graduation DoD. See `docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md`.

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

### Token-Efficient E2E Testing

Compact E2E test execution with summary aggregation, tool-scoped execution, and lazy log retrieval. See `.agents/skills/e2e-token-efficient/SKILL.md`.
