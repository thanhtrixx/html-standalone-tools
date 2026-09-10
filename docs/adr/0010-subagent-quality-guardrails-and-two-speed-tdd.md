# ADR-0010: Subagent Quality Guardrails and Two-Speed TDD Protocol

> **Status:** Accepted

## Context

As the repository expands with multiple standalone web applications, maintaining exceptional quality, zero runtime regressions, and complete specification compliance requires rigorous verification. In single-agent or human-only workflows, engineering quality faces several classic failure modes:

1. **Author Bias & Implementation-Coupled Tests**: When the same author writes both the code and the tests simultaneously, tests often verify _imagined internal structure_ or share the author's blind spots rather than asserting true user-observable behaviors at public seams.
2. **Acceptance Criteria (AC) Drift**: Issue acceptance criteria (`- [ ]`) risk being checked off qualitatively without an explicit 1:1 binding to an automated test assertion.
3. **Repository Invariant Erosion**: The repository's 5 core quality invariants (Zero Runtime Dependencies, Silent Data Migration, Bilingual Parity, Dynamic SemVer, Zero Regression) require systematic multi-perspective auditing prior to Pull Request submission.

## Decision

We establish a formalized **Subagent Quality Protocol** integrated directly into the 4-Phase Delivery Lifecycle of our Ways of Working (WoW):

### 1. Phase-Integrated Subagent Roles

- **Phase 1 (Spec & Decomposition)**:
  - **Spec & AC Auditor Subagent**: Audits proposed vertical slice issues to verify that Acceptance Criteria are testable, independent, and strictly adhere to the domain vocabulary defined in `<tool-name>/CONTEXT.md`.
- **Phase 2 (Branch & Two-Speed TDD)**:
  - **Adversarial Test Hunter Subagent**: Generates blind, independent test suites derived strictly from issue ACs and domain rules _before or in parallel with_ implementation.
  - **Public Seam Contract**: Blind test generation operates strictly against pre-agreed public boundaries:
    1. Pure state/calculation engines registered in domain suites (`tests/<tool>.*.test.js`).
    2. Accessible semantic DOM elements (standard tags, ARIA roles, semantic data attributes, or dictionary-backed text).
- **Phase 3 (PR, Invariants & Review)**:
  - **Dual-Axis Review Subagents**: Spawns two parallel subagents before PR creation:
    1. _Standards & Invariants Subagent_: Audits code against Fowler code smells AND explicitly enforces the 5 repository invariants (Zero Runtime Dependencies, Silent Data Migration, Bilingual Parity, Dynamic SemVer, Zero Regression).
    2. _Spec Conformance Subagent_: Verifies that the implementation satisfies all issue requirements without scope creep.
  - **PR Traceability Matrix Standard**: Every PR body must declare a structured checklist mapping each issue AC directly to its verifying test:
    ```markdown
    ## Acceptance Criteria Verified

    - [x] **AC-1 (<Description>)**: Verified by `tests/<tool>.<domain>.test.js: '<Test Name>'`
    - [x] **AC-2 (<Description>)**: Verified by `tests/<tool>.<domain>.test.js: '<Test Name>'`
    ```
- **Phase 4 (Release & Closure)**:
  - **AC Verification Subagent**: Inspects live release artifacts and test output, verifying that all issue criteria are satisfied before executing `gh issue close`.

### 2. Subagent Execution Modes

- **Standard In-Tree Mode (`Workspace: 'inherit'`)**: Primary agent orchestrates file edits, while subagents perform read-only analysis, diff reviews, and test generation to avoid workspace branching overhead.
- **Isolated Branch Mode (`Workspace: 'branch'`)**: Used for long-running, parallel exploratory tests or destructive fuzzing to avoid local filesystem lock contention.

## Consequences

### Positive

- **Eliminates Author Bias**: Blind test generation ensures tests verify requirements independently of how the implementation is coded.
- **Guaranteed Traceability**: Every checkbox on an issue is mechanically verified and linked to concrete test assertions in the PR.
- **Robust Invariant Protection**: Automated subagent auditing prevents regressions in data migration, translation parity, and runtime bundling.

### Negative / Trade-offs

- **Slight Coordination Latency**: Spawning subagents for blind test generation and multi-axis review introduces a small delay, which is mitigated by running scoped inner-loop test suites (`bun run test:<tool>`) and parallel subagent execution.
