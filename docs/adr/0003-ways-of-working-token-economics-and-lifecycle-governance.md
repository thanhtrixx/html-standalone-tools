# ADR-0003: Ways of Working, Token Economics, and Lifecycle Governance

> **Status:** Accepted  
> **Supersedes:** Legacy Global ADRs 0004, 0010, 0012, 0013, 0014

---

## Context

In multi-agent autonomous engineering environments, uncalibrated ceremonies, full-repo context dumping, and uncontrolled subagent spawning cause severe token burn ($O(N^2)$ history accumulation) and context degradation ("needle-in-a-haystack" loss). We require:

1. **Tiered Change Classification**: Right-sized ceremony matching the risk profile of each change.
2. **Subagent Economics & Delegation Threshold**: Clear rules on when to execute inline vs. when to spawn subagents.
3. **Dual-Phase Lifecycle**: Distinct engineering policies for active feature development versus hardened stable tools.
4. **Token ROI Optimization**: High-density digests (≤ 300–400 words) and pruned context fan-out.

---

## Decisions

### 1. Three-Tier Change Classification

| Tier                            | Scope                                                               | Required Workflow                                                           | Typical Token Budget |
| :------------------------------ | :------------------------------------------------------------------ | :-------------------------------------------------------------------------- | :------------------- |
| **Tier 0 — Zero-Ceremony**      | Docs-only (`*.md`, `docs/**`, `AGENTS.md`, `.agents/**`)            | Branch → Commit → PR → CI → Merge                                           | ~2k tokens           |
| **Tier 1 — Scoped Lightweight** | Single-tool `fix:`, `refactor:`, `perf:`, `test:`, `style:`         | Branch → Scoped Unit Tests (`npm run test:<tool>`) → PR → CI Gate → Merge   | ~15k–25k tokens      |
| **Tier 2 — Full Ceremony**      | Multi-tool features, `feat:` on stable tools, shared build/CI infra | Branch → Blind Tests → Dual Review → PR → CI Gate → Merge → AC Verification | ~50k–80k tokens      |

### 2. Two-Tier Delegation Threshold Rule

- **Tier 1 (Inline Execution)**: Micro-fixes, single-file cosmetic adjustments, documentation edits, or changes touching `< 5` lines. Handled directly by the orchestrator without spawning subagents.
- **Tier 2 (Subagent Delegation)**: Complex business logic, algorithmic engines, Phase 2 blind seam tests, and Phase 3 dual-axis reviews. Spawning specialized subagents prevents 60k–150k tokens of circular debugging loops.

### 3. Fan-Out / Fan-In Context Decoupling

- **Pruned Fan-Out**: Subagents receive strictly bounded context (specific issue ACs, target domain files, or scoped diffs). Whole-repository dumps are prohibited.
- **Compressed Fan-In**: Subagent responses must be dense structured digests (≤ 300–400 words) citing file paths, line numbers, and boolean outcomes. Raw terminal logs and large diff dumps are forbidden.

### 4. Dual-Phase Tool Lifecycle Governance

- **`Active Feature Development`** (Velocity): Backlog expansion, rapid domain iteration. `feat:` commits default to Tier 1; scoped unit suites suffice for inner loop.
- **`Hardened Stable`** (Quality & Zero-Regression): Completed backlogs, production releases. `feat:` commits require Tier 2; `fix:/refactor:` require tool-scoped E2E verification.

### 5. Repository 5 Quality Invariants

All code must uphold:

1. **Zero Runtime Dependencies**: No runtime npm packages; CDNs or standalone inlined utilities only.
2. **Silent Data Migration**: Storage schemas (IndexedDB, LocalStorage) migrate transparently with zero data loss.
3. **Bilingual Parity**: 100% key parity across `en` and `vi` translations.
4. **Dynamic SemVer & Single-File Output**: `dist/<tool>/index.html` is 100% self-contained and versioned.
5. **Zero Regression**: 100% passing test suites across all affected tools.

---

## Consequences

- **Positive**: Drastically reduced session token burn (~60–80% savings on routine tasks), zero port collisions during testing, sharp focus on deliverable ROI.
- **Trade-off**: Requires strict categorization discipline and adherence to structured summary limits.
