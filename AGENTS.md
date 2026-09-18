# AGENTS.md

## 🚨 MANDATORY: Pre-Flight Change Classification Gate (BEFORE RUNNING ANY TEST/VERIFY COMMAND)

Every agent MUST classify changes using `git status` before executing ANY test command:

| Tier                            | File Scope                                                                 | Permitted Local Verification                            | Strictly Prohibited Actions                                                           | Flow                                                     |
| :------------------------------ | :------------------------------------------------------------------------- | :------------------------------------------------------ | :------------------------------------------------------------------------------------ | :------------------------------------------------------- |
| **Tier 0 — Zero Ceremony**      | All files match `*.md`, `docs/**`, `AGENTS.md`, `.agents/**`               | `npm run format:check` or `npm run format` only         | ❌ **STRICTLY PROHIBITED**: Running `npm run verify`, unit test suites, or E2E tests. | Format $\to$ Branch $\to$ Commit $\to$ PR $\to$ CI Gate. |
| **Tier 1 — Scoped Lightweight** | Changes isolated to single `<tool>/`                                       | `npm run test:<tool>` only (e.g. `npm run test:habit`)  | ❌ **PROHIBITED**: Running full `npm run verify` in inner loops.                      | Scoped Tests $\to$ PR $\to$ CI Gate.                     |
| **Tier 2 — Full Ceremony**      | Cross-cutting features, `scripts/`, CI workflows, final production release | Scoped inner loop + `npm run verify` at PR/release gate | ❌ **PROHIBITED**: Skipping dual review or AC matrix.                                 | Full WoW ceremony.                                       |

---

## Agent skills

### Issue tracker

GitHub issues (via `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role defaults. See `docs/agents/triage-labels.md`.

### Ways of working & GitHub Flow

Token-first three-tier change classification (Tier 0 Zero-Ceremony / Tier 1 Scoped Lightweight / Tier 2 Full Ceremony), phase-aware quality gating, and Subagent Quality Protocol. See `docs/agents/ways-of-working.md` and `docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md`.

### Token Economics & Subagent Strategy

Two-tier delegation threshold, scoped inner-loop test runner gates (`npm run test:<tool>`), surgical file edits (`replace_file_content`), targeted line-slice inspection (`grep_search` / `StartLine`), compact E2E digests (`scripts/e2e-summary.js`), living backlog archiving (`docs/deprecated/`), and fan-in digest compression (≤ 300–400 words). See `docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md` and `docs/agents/ways-of-working.md`.

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
