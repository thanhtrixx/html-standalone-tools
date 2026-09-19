# AGENTS.md

## ⚡ Runtime Preference: Bun for Maximum Speed

Agents MUST prefer **`bun`** (`bun run <script>`, `bun test`) for all local command execution, inner loops, format checks, builds, and test suites for sub-second execution speeds. Use `npm` / `node` only as a secondary fallback if `bun` is unavailable in the environment.

## 🚨 MANDATORY: Pre-Flight Change Classification Gate (BEFORE RUNNING ANY TEST/VERIFY COMMAND)

Every agent MUST classify changes using `git status` before executing ANY test command:

| Tier                            | File Scope                                                                 | Permitted Local Verification                            | Strictly Prohibited Actions                                                           | Flow                                                     |
| :------------------------------ | :------------------------------------------------------------------------- | :------------------------------------------------------ | :------------------------------------------------------------------------------------ | :------------------------------------------------------- |
| **Tier 0 — Zero Ceremony**      | All files match `*.md`, `docs/**`, `AGENTS.md`, `.agents/**`               | `bun run format:check` (or `npm run format:check`)      | ❌ **STRICTLY PROHIBITED**: Running `bun run verify`, unit test suites, or E2E tests. | Format $\to$ Branch $\to$ Commit $\to$ PR $\to$ CI Gate. |
| **Tier 1 — Scoped Lightweight** | Changes isolated to single `<tool>/`                                       | `bun run test:<tool>` only (e.g. `bun run test:habit`)  | ❌ **PROHIBITED**: Running full `bun run verify` in inner loops.                      | Scoped Tests $\to$ PR $\to$ CI Gate.                     |
| **Tier 2 — Full Ceremony**      | Cross-cutting features, `scripts/`, CI workflows, final production release | Scoped inner loop + `bun run verify` at PR/release gate | ❌ **PROHIBITED**: Skipping dual review or AC matrix.                                 | Full WoW ceremony.                                       |

---

## Agent skills

### Issue tracker

GitHub issues (via `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role defaults. See `docs/agents/triage-labels.md`.

### Ways of working & GitHub Flow

Token-first three-tier change classification (Tier 0 Zero-Ceremony / Tier 1 Scoped Lightweight / Tier 2 Full Ceremony), phase-aware quality gating, and Subagent Quality Protocol. See `docs/agents/ways-of-working.md` and `docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md`.

### Token Economics & Subagent Strategy

Two-tier delegation threshold, scoped inner-loop test runner gates (`bun run test:<tool>`), surgical file edits (`replace_file_content`), targeted line-slice inspection (`grep_search` / `StartLine`), compact E2E digests (`scripts/e2e-summary.js`), living backlog archiving (`docs/deprecated/`), and fan-in digest compression (≤ 300–400 words). See `docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md` and `docs/agents/ways-of-working.md`.

### Dual-Phase Tool Lifecycle & Scoped Quality

Active Feature Development (velocity) vs Hardened Stable (quality, zero regression), tool-scoped test suites (`bun run test:<tool>`), and graduation DoD. See `docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md`.

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

### Inner-Loop Verification & Token Economics

Sub-second, tool-scoped inner loop verification, grep-first file navigation, and scoped format checks. Strictly prohibits running full `bun run verify` during active code edits. Prefer `bun run test:<tool>` for sub-second feedback. See `.agents/skills/inner-loop-verification/SKILL.md`.

### Token-Efficient E2E Testing

Compact E2E test execution with summary aggregation (`bun run test:e2e:summary` or `bun run test:e2e:<tool>`), tool-scoped execution, and lazy log retrieval. Prohibits un-aggregated `playwright test` CLI runs. See `.agents/skills/e2e-token-efficient/SKILL.md`.

### Grep-First Navigation & Silent Bulk Operations

On files $> 500$ lines, agents MUST use `grep -n` or targeted search before reading slices. Bulk CLI commands MUST redirect repetitive stdout to summary or `/dev/null` (`> /dev/null 2>&1`). See `docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md`.
