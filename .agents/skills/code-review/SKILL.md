---
name: code-review
description: "Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards & Invariants (does the code follow this repo's documented coding standards and 5 Core Invariants?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to 'review since X'."
---

# Phase 3: Dual-Axis Code & Invariant Review

Two-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards & Invariants**: does the code conform to this repo's documented standards, 5 Core Invariants, and code quality baselines?
- **Spec Conformance**: does the code faithfully implement the originating issue / spec without scope creep?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.

The issue tracker should have been provided to you. If `docs/agents/issue-tracker.md` is missing, check `docs/agents/issue-tracker.md`.

---

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point (a commit SHA, branch name, tag, `main`, `HEAD~5`, etc.). If they didn't specify one, default to `main` (or the merge-base with `main`).

Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here, not inside two parallel sub-agents.

---

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, etc.), fetched via the workflow in `docs/agents/issue-tracker.md` (`gh issue view <n>`).
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `<tool-name>/ITEMS_TO_IMPLEMENT.md` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

---

### 3. Identify the standards sources & 5 Core Invariants

Review documented repository standards in `docs/agents/ways-of-working.md`, `docs/agents/domain.md`, `<tool-name>/CONTEXT.md`, and recent ADRs in `docs/adr/`.

#### 🛡️ The 5 Repository Invariants (Hard Non-Negotiables)
Every diff MUST comply with the following 5 invariants:

1. **Zero Runtime Dependencies**: Source and deliverable single-file HTML have zero external unbundled npm runtime imports.
2. **Silent Data Migration**: Browser storage changes (`localStorage` / IndexedDB) include backwards-compatible silent auto-migration with dedicated test coverage (`tests/*storage*.test.js`).
3. **Bilingual Parity**: 100% dictionary key parity between Vietnamese (`vi`) and English (`en`) strings (`npm run test:i18n` or `npm run test:<tool>:i18n`).
4. **Dynamic SemVer & Zero-Drift Suites**: Never create version-named test files (e.g. `tests/*-vX-Y.test.js`). Append tests to permanent domain suites. Never hardcode SemVer strings in tests; assert version synchronization dynamically against `manifest.webmanifest`.
5. **Zero Regression**: 100% test suites passing green (`bun run verify` / `npm run verify`).

#### 🧼 Fowler Code Smell Baseline (Judgement Calls)
On top of the 5 invariants, the Standards axis carries the Fowler smell baseline (_Refactoring_, ch.3):

- **Mysterious Name**: function/variable/type name does not reveal purpose. → rename.
- **Duplicated Code**: identical logic shape in multiple hunks. → extract shared helper.
- **Feature Envy**: method reaches into another object's data more than its own. → move method.
- **Data Clumps**: same parameters/fields travel together. → bundle into single object.
- **Primitive Obsession**: primitives representing complex domain concepts. → wrap in domain structure.
- **Repeated Switches**: duplicated switch/if cascades across files. → map or polymorphism.
- **Shotgun Surgery**: one logical change forces edits scattered across many unrelated files. → consolidate.
- **Divergent Change**: one module edited for multiple unrelated reasons. → split module.
- **Speculative Generality**: unneeded hooks/parameters not required by spec. → remove/inline.
- **Message Chains**: excessive `a.b().c().d()` coupling. → encapsulate in caller.
- **Middle Man**: function merely delegates onward without value. → call target directly.
- **Refused Bequest**: subclass or component overrides/ignores most inherited behavior. → composition.

---

### 4. Spawn both sub-agents in parallel

**Standards & Invariants sub-agent prompt** should include:

- The full diff command and commit list.
- The list of standards sources, **the 5 Repository Invariants**, and **the Fowler smell baseline**.
- The brief: "Report, per file/hunk where relevant:
  (a) **Hard Invariant Breaches**: check for (1) npm imports in browser source, (2) storage schema changes missing silent migration tests, (3) missing bilingual translations, (4) hardcoded SemVer or version-named test files.
  (b) **Documented Standards Breaches**: cite the standard file and rule.
  (c) **Baseline Code Smells**: name the smell, quote the hunk, and suggest refactor. Distinguish hard invariant violations from judgement calls. Under 400 words."

**Spec Conformance sub-agent prompt** should include:

- The diff command and commit list.
- The path or fetched contents of the spec / GitHub issue ACs.
- The brief: "Report: (a) requirements/ACs the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

---

### 5. Aggregate

Present the two reports under `## Standards & Invariants` and `## Spec Conformance` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings.

End with a one-line summary: total findings per axis, and whether all 5 Invariants and issue ACs are cleared for PR submission.
