# Ways of Working (WoW) & GitHub Flow

Standard engineering workflow for human engineers and autonomous coding agents. Optimized for **maximum AI agent code generation throughput** with minimum ceremonial token overhead ([ADR-0014](../adr/0014-token-first-wow-rebuild-and-tiered-change-classification.md)).

---

## Three-Tier Change Classification

Every change is automatically classified by file paths and commit prefix. Agents may **escalate** tier but never downgrade.

### Tier 0 — Zero-Ceremony (Docs-Only)

**Scope**: All changed files match `*.md`, `docs/**`, `AGENTS.md`, `.agents/**`, `CONTEXT-MAP.md`, `*.yml` (non-CI).

**Flow**: `Branch → Commit → PR → CI Gate → Squash Merge`

**Rules**: No tests required. No review subagents. No blind test generation. Direct PR with conventional commit (`docs(scope): ...`).

### Tier 1 — Scoped Lightweight (Single-Tool Fix/Refactor)

**Scope**: Changes within a single `<tool>/` directory. Commit prefix: `fix:`, `refactor:`, `perf:`, `style:`, `test:`. Also: `feat:` on `Active Feature Development` tools.

**Flow**: `Branch → Scoped Tests → PR → CI Gate → Squash Merge`

**Rules**:

- Orchestrator edits inline (no subagents for implementation)
- Run scoped verification: `npm run test:<tool>` (inner loop)
- Phase-aware E2E: Required for `Hardened Stable` tools (`npm run test:e2e:<tool>`), optional for `Active Feature Development` tools
- PR body: Summary + `Closes #<n>` + brief AC checklist
- Skip blind test generation and dual-axis review subagents

### Tier 2 — Full Ceremony (Features & Cross-Cutting)

**Scope**: Multi-tool features, `feat:` on `Hardened Stable` tools, shared scripts (`scripts/`), CI workflows (`.github/`), portal changes.

**Flow**: `Branch → Blind Tests → Implementation → Scoped Tests → Dual Review → PR → CI Gate → Squash Merge → AC Verify`

**Rules**:

- **Phase 1**: Grill requirements ([`grill-wow` skill](../../.agents/skills/grill-wow/SKILL.md)), update domain docs (`CONTEXT.md`, ADRs), decompose into vertical slices, publish GitHub Issues
- **Phase 2**: Spawn Adversarial Test Hunter subagent ([ADR-0010](../adr/0010-subagent-quality-guardrails-and-two-speed-tdd.md)) for blind seam tests. Inner loop: `npm run test:<tool>`. Outer gate: `npm run verify`
- **Phase 3**: Spawn dual-axis review subagents (Standards & 5 Invariants + Spec Conformance). PR body includes AC-to-Test Traceability Matrix
- **Phase 4**: AC Verification subagent sign-off. Close issue with `gh issue close`

---

## Phase-Aware Quality Gating ([ADR-0013](../adr/0013-dual-phase-tool-lifecycle-and-scoped-quality-governance.md))

Tool lifecycle phase modulates default tier and verification depth:

| Tool Phase                   | `feat:` Default Tier   | `fix:/refactor:` Default Tier | E2E Requirement         |
| ---------------------------- | ---------------------- | ----------------------------- | ----------------------- |
| `Active Feature Development` | Tier 1 (scoped)        | Tier 1                        | Optional                |
| `Hardened Stable`            | Tier 2 (full ceremony) | Tier 1                        | Mandatory (tool-scoped) |

Phase transitions follow the Graduation DoD in [ADR-0013](../adr/0013-dual-phase-tool-lifecycle-and-scoped-quality-governance.md). Transition PRs are classified as Tier 1.

Current tool phases: See [`CONTEXT-MAP.md`](../../CONTEXT-MAP.md).

---

## Token Economics ([ADR-0012](../adr/0012-optimal-token-strategy-and-subagent-economics.md))

- **Two-Tier Delegation**: Micro-fixes (< 5 lines) → orchestrator inline. Features/reviews → dedicated subagents.
- **Fan-In Digests**: Subagent returns ≤ 300-400 word structured summaries. Raw logs forbidden.
- **Scoped Test Runners**: Subagents use `npm run test:<tool>` only. Full `npm run verify` reserved for orchestrator at PR/release gates.
- **E2E Aggregation**: Use `scripts/e2e-summary.js` for compact pass/fail output (~100 tokens). Fetch failure traces only on errors.

---

## Core Invariants & Quality Guardrails

The 5 repository invariants are defined in [ADR-0010](../adr/0010-subagent-quality-guardrails-and-two-speed-tdd.md) and enforced during Tier 2 reviews:

1. **Zero Runtime Dependencies** — No unbundled npm runtime imports in browser source/dist
2. **Silent Data Migration** — Storage changes include backwards-compatible auto-migration
3. **Bilingual Parity** — 100% VI/EN dictionary key parity
4. **Dynamic SemVer** — Version asserted dynamically from manifest
5. **Zero Regression** — Clean pass across all test suites

**Non-negotiable process rules**:

- PR-per-issue required before closure
- Squash & Merge only: `gh pr merge --squash --delete-branch`
- CI gate (`pr-verify.yml`) must be 100% green before merge
- Observable behavior over implementation details in tests

---

## Quick Reference Commands

```bash
# Branching
git checkout -b <type>/issue-<n>-<slug>

# Inner loop (tool-scoped, sub-second)
npm run test:<tool>          # e.g. npm run test:tracker

# E2E (tool-scoped, compact output)
npm run test:e2e:<tool>      # e.g. npm run test:e2e:habit
node scripts/e2e-summary.js  # Compact pass/fail summary

# Outer gate (full verification)
npm run verify

# PR & merge
gh pr create --title "<type>(tool): Description (#<n>)" --body "Closes #<n> ..."
gh pr merge <pr> --squash --delete-branch

# Issue closure
gh issue close <n>
```
