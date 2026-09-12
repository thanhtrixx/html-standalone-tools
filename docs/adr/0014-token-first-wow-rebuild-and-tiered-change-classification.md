# ADR-0014: Token-First WoW Rebuild and Tiered Change Classification

> **Status:** Accepted

## Context

The existing Ways of Working (WoW) document (336 lines) was authored incrementally across ADRs 0010, 0012, and 0013. Over time it accumulated significant redundancy:

1. **Document Bloat**: ~60% of WoW content duplicated information already defined in ADRs 0010/0012/0013. Agents re-ingested ~22k bytes every session, wasting ~5k-8k tokens before any productive work.
2. **Uniform Ceremony for All Changes**: Every change—including docs-only edits—followed the same 4-phase ceremony (grill → blind tests → dual-axis review → AC verification subagent), consuming ~50k+ tokens even for a markdown typo fix.
3. **No Phase-Aware Token Budgeting**: Although ADR-0013 defined dual-phase lifecycle (Active Feature Development vs Hardened Stable), the WoW applied identical quality gating regardless of tool phase.
4. **E2E Log Verbosity**: Playwright multi-device E2E output consumed 30-50k tokens per run with no aggregation mechanism for agents.
5. **Visual Diagrams for Machines**: 64 lines of Mermaid + ASCII diagrams served no machine-readable purpose.

## Decision Drivers

- **Maximize AI agent code generation throughput** by minimizing ceremonial token overhead.
- **Preserve quality rigor** for high-risk changes while eliminating waste on low-risk changes.
- **Single source of truth** — ADRs own policy details; WoW orchestrates workflow only.

## Decision

We **rebuild the WoW document from scratch** with the following architectural changes:

### 1. Lean Reference Architecture (~80-120 lines)

The new WoW document defines ONLY the workflow skeleton and decision points. All policy details (token rules, lifecycle phases, test strategies, invariant definitions) reside exclusively in their respective ADRs. WoW links to ADRs with one-line summaries.

### 2. Three-Tier Change Classification

Every change is automatically classified into one of three tiers based on file paths and commit prefix:

| Tier | Scope | Ceremony | Token Budget |
|------|-------|----------|-------------|
| **Tier 0 — Zero-Ceremony** | Docs-only (`*.md`, `docs/**`, `AGENTS.md`, `.agents/**`) | Branch → Commit → PR → CI → Merge | ~2k tokens |
| **Tier 1 — Scoped Lightweight** | Single-tool `fix:`, `refactor:`, `perf:`, `test:`, `style:` | Branch → Scoped Tests → PR → CI Gate → Merge | ~15-25k tokens |
| **Tier 2 — Full Ceremony** | Multi-tool features, `feat:` on stable tools, shared infra, CI workflows | Branch → Blind Tests → Dual Review → PR → CI Gate → Merge → AC Verify | ~50-80k tokens |

Classification is automatic (path-based rules). Agents may escalate tier but never downgrade.

### 3. Phase-Aware Tier Escalation & Verification Depth

The tool's lifecycle phase ([ADR-0013](./0013-dual-phase-tool-lifecycle-and-scoped-quality-governance.md)) modulates both default tier and verification depth:

- **`Active Feature Development`**: `feat:` commits default to Tier 1. E2E verification optional (inner-loop scoped tests suffice).
- **`Hardened Stable`**: `feat:` commits require Tier 2. `fix:/refactor:` use Tier 1 with mandatory tool-scoped E2E.

### 4. E2E Error Aggregation Script

A standalone `scripts/e2e-summary.js` script wraps Playwright execution:
- Runs Playwright with JSON reporter
- Outputs compact 1-line summary: `✅ 144/144 passed` or `❌ 3 failed: [details]`
- Agents read ~100 tokens instead of ~30-50k tokens of raw Playwright output
- Detailed failure traces retrieved lazily only when failures occur

### 5. DoD Merged Into Tier Rules

The standalone 11-point Definition of Done is eliminated. Each tier definition states its own required verifications inline, removing redundancy with Phase 3 invariant checks.

### 6. Standalone E2E Testing Skill

E2E testing guidance moves to `.agents/skills/e2e-token-efficient/SKILL.md`, keeping WoW lean. Agents load this skill only when performing E2E work.

## Consequences

### Positive

- **~60-70% token reduction** on docs-only and single-tool fixes (Tier 0/1).
- **~40% smaller WoW document** (336 → ~100 lines), reducing per-session ingestion.
- **Phase-aware quality gating** aligns token spend with risk level.
- **E2E error aggregation** saves ~30-50k tokens per E2E run.
- **Zero redundancy** between WoW and ADRs.

### Negative / Trade-offs

- **ADR lookup required**: Agents must read specific ADRs when encountering edge cases. Mitigated by clear one-line summaries and links in WoW.
- **Migration effort**: Existing skills referencing the old WoW structure need updating.

### Supersedes

- Partially supersedes workflow sections of [ADR-0010](./0010-subagent-quality-guardrails-and-two-speed-tdd.md), [ADR-0012](./0012-optimal-token-strategy-and-subagent-economics.md), and [ADR-0013](./0013-dual-phase-tool-lifecycle-and-scoped-quality-governance.md) for WoW workflow structure (those ADRs remain the source of truth for their respective policy domains).
