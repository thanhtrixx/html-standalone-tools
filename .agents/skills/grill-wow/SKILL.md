---
name: grill-wow
description: Conduct relentless grilling interview, update domain docs (CONTEXT.md glossary, ADRs, spec), decompose into vertical-slice tickets, and publish to GitHub Issues per Ways of Working (WoW) Phase 1. Trigger when user asks to "grill me with docs, follow WoW", "follow WoW", "grill me and follow WoW", "grill with docs", or "kickoff feature".
---

# Grill WoW (Phase 1 Discovery & Decomposition)

Orchestrate **Phase 1: Spec & Decomposition** of the repository's [Ways of Working (WoW)](../../docs/agents/ways-of-working.md).

This skill guides an initiative from raw idea to published GitHub vertical-slice issues ready for Phase 2 implementation. It prevents premature coding by eliminating assumptions, capturing architectural decisions, and enforcing Definition of Done (DoD) from day one.

---

## 🔁 The Phase 1 Process Flow

```text
[1. Explore Environment] ──► [2. Grilling Rounds] ──► [3. Update Domain Docs] ──► [4. Vertical Slices] ──► [5. Publish Issues] ──► [6. Phase 2 Handoff]
```

---

## Steps

### 1. Explore Environment (Facts First)

Finding facts is your job, never the user's. Before asking questions:
- Inspect the codebase for existing modules, data models, and dependencies.
- Read [`docs/agents/ways-of-working.md`](../../docs/agents/ways-of-working.md) and [`docs/agents/domain.md`](../../docs/agents/domain.md).
- Check `CONTEXT-MAP.md`, relevant `<tool-name>/CONTEXT.md`, and recent ADRs under `docs/adr/` or `<tool-name>/docs/adr/`.
- Inspect git status, recent commits, and open GitHub issues (`gh issue list`).

Only decisions belong to the user. Never ask the user for information you can look up yourself.

### 2. Grilling Interview in Rounds

Map open decisions as a **design tree**: every foundational decision branches into downstream choices.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are settled:
- Ask the whole frontier in one round.
- Number each question, explain trade-offs, and explicitly provide your recommended answer.
- Wait for the user's answers before advancing to the next round.

Format each round exactly as:

```markdown
❓ **Q1** - **<question title>**: <question body, trade-offs, and selectable options>

➡️ <your recommended answer with rationale>

---

❓ **Q2** - **<question title>**: <question body, trade-offs, and selectable options>

➡️ <your recommended answer with rationale>
```

Continue iterating rounds until the frontier is empty: every branch explored, zero assumptions left silent.

### 3. Update Domain Docs & Architecture Records

Once the design tree is agreed upon, update the authoritative documentation before writing code:

1. **Ubiquitous Language & Glossary**:
   - Update `CONTEXT.md` (or `<tool-name>/CONTEXT.md`) with domain terms, calculation formulas, and explicitly avoided synonyms (per [`docs/agents/domain.md`](../../docs/agents/domain.md)).
2. **Architectural Decision Record (ADR)**:
   - Create or update an ADR under `docs/adr/` (or `<tool-name>/docs/adr/`) in standard format (`0NNN-<slug>.md`):
     - Status: Accepted
     - Context & Problem Statement
     - Decision Drivers
     - Considered Options & Decision Outcome
     - Consequences (Positive & Negative)
3. **Spec & Test Plan**:
   - Record user-facing requirements in `<tool-name>/ITEMS_TO_IMPLEMENT.md`.
   - Record test strategy in `<tool-name>/TEST_PLAN.md` (identifying pure math, DOM/UI, and regression seams).

### 4. Vertical Slice Decomposition (Tracer Bullets)

Decompose the feature into small, independent, verifiable vertical slices:
- **Vertical, not horizontal**: Each slice cuts through data/logic, UI, and automated tests.
- **Single context window**: Sized to be implemented and verified within one session.
- **Explicit dependencies**: Declare blocking tickets (`Blocked by: #<n>` or `None (can start immediately)`).
- **Checkable Acceptance Criteria**: Every slice must contain a `- [ ]` checklist covering observable behavior.

Present the slice plan to the user:
- Slice titles, delivery summary, acceptance criteria, and blockers.
- Confirm granularity with the user before publishing.

### 5. Publish to GitHub Issue Tracker

Using the `gh` CLI per [`docs/agents/issue-tracker.md`](../../docs/agents/issue-tracker.md):
1. If the initiative spans multiple slices, create a parent tracking Epic issue.
2. Publish each child vertical slice issue using `gh issue create`:
   - Title: `feat(<tool>): <Description>` or `fix(<tool>): <Description>`
   - Label: `ready-for-agent`
   - Body: Problem statement, what to build, checkable acceptance criteria (`- [ ]`), and blocking relationships.

### 6. Phase 2 Hand-off

Conclude Phase 1 by printing a clear hand-off summary for Phase 2:
- Link to the created GitHub Issues.
- Provide the exact git checkout command for the first unblocked slice:
  ```bash
  git checkout -b feat/issue-<number>-<short-slug>
  ```
- Remind the engineer or agent of the Two-Speed verification commands:
  - Inner loop: `bun run test:<tool>` (or `npm run test:<tool>`)
  - Outer gate: `bun run verify` (or `npm run verify`)
