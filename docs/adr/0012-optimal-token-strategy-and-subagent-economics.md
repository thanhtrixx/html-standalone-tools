# ADR-0012: Optimal Token Strategy and Subagent Economics

> **Status:** Accepted

## Context

With the establishment of the Subagent Quality Protocol ([ADR-0010](./0010-subagent-quality-guardrails-and-two-speed-tdd.md)), autonomous coding agents routinely spawn specialized subagents for Phase 1 specification audits, Phase 2 blind seam testing, and Phase 3 dual-axis reviews.

However, in multi-agent autonomous environments, token consumption and context window management directly govern both operational cost and reasoning fidelity:

1. **Quadratic History Accumulation ($O(N^2)$)**: In monolithic long-running sessions, every tool call re-ingests the entire accumulated transcript. As turns exceed 40–50 steps, context degradation ("needle-in-a-haystack" loss) causes agents to miss Acceptance Criteria, drop repository invariants, or re-read files redundantly.
2. **Token-Negative Micro-Spawning**: Spawning a subagent incurs a fixed bootstrap overhead (~10k–20k tokens for tool definitions, system prompts, and context). Spawning subagents for trivial 1-line typo fixes or cosmetic class adjustments is economically token-negative.
3. **Information Density & Log Dumping**: Unfiltered stdout/stderr from test runners or large diffs dumped into subagent response messages quickly pollutes the parent orchestrator's context window.
4. **Local Resource & Port Contention**: When multiple subagents run full Playwright multi-browser test suites concurrently, local preview server port collisions (e.g. `localhost:4173`) cause flaky `ERR_CONNECTION_REFUSED` failures and wasted debugging tokens.

## Decision

We codify an **Optimal Token Strategy and Subagent Economics Framework** across our Ways of Working (WoW):

### 1. Two-Tier Delegation Threshold Rule

Agents must determine execution mode based on task complexity and token ROI:

- **Tier 1 — Inline Orchestrator Execution (Micro-Fixes)**:
  - _Criteria_: Single-file cosmetic fixes, documentation typo corrections, simple string adjustments, or trivial bug fixes touching `< 5` lines of code.
  - _Action_: Orchestrator performs the edit directly and runs scoped unit checks (`npm test` / `npm run test:<tool>`) without spawning subagents.
- **Tier 2 — Mandatory Subagent Delegation (Features, Logic & Reviews)**:
  - _Criteria_: Non-trivial features, state/calculation engines, UI gesture/interaction logic, Phase 2 blind seam test generation, and Phase 3 dual-axis reviews.
  - _Action_: Spawn dedicated subagents (`Adversarial Test Hunter`, `Standards & Invariants Reviewer`, `Spec Conformance Reviewer`). The ~15k token bootstrap cost is heavily offset by preventing 60k–150k tokens of circular debugging loops.

### 2. Fan-Out / Fan-In Context Decoupling

- **Fan-Out (Pruned Input Context)**: Subagents must receive tightly bounded inputs (specific issue ACs, target domain files like `CONTEXT.md`, or specific git diffs), rather than whole-repo context dumps.
- **Fan-In (High-Density Structured Digests ≤ 300–400 Words)**: Subagents must compress their findings into dense, structured summaries citing exact files, line numbers, and boolean outcomes. Raw terminal logs and large diff outputs are explicitly forbidden from the return payload.

### 3. Scoped Inner-Loop Test Runner Gate

- **Inner-Loop Subagent Scope**: Subagents running in Phase 2 or Phase 3 are restricted to fast scoped domain and unit suites (`npm test` / `npm run test:<tool>`) using compact single-line reporters.
- **Outer Gate Orchestrator Scope**: Full multi-browser Playwright E2E suites (`npm run verify`) are executed centrally by the primary orchestrator in Phase 4 prior to PR merge and release sign-off. This completely eliminates port contention and saves ~30k–50k tokens of browser test output per subagent turn.

### 4. Mathematical Token ROI Heuristic

We evaluate agent efficiency via the verified deliverable ratio:

$$\text{Token Effectiveness} = \frac{\text{Verified Deliverable Features} \times \text{Zero Regressions}}{\text{Total Ingested Tokens (Prompt + Completion)}}$$

## Consequences

### Positive

- **Prevents Context Rot**: The main orchestrator's context window remains lean (~15k–25k tokens), preserving high attention fidelity over long sessions.
- **Eliminates Port Conflicts**: Isolating Playwright multi-device sweeps to Phase 4 prevents server collisions on `localhost:4173`.
- **Maximizes Economic ROI**: Token spend directly correlates with verified deliverable progress and zero rework cycles.

### Negative / Trade-offs

- **Requires Engineering Discipline**: Agents and contributors must conscientiously categorize tasks into Tier 1 vs. Tier 2 and enforce word limits on subagent summaries.
