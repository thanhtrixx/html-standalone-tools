# Ways of Working (WoW) & GitHub Flow

This document defines the standard engineering workflow and delivery lifecycle for both human engineers and autonomous coding agents working on this repository.

---

## 🔁 The Three-Phase Delivery Lifecycle

```mermaid
flowchart TD
    subgraph P1["1. Spec &amp; Decomposition"]
        QA["Q&amp;A / Grill"] --> ADR["ADR / CONTEXT.md"]
        ADR --> Issues["GitHub Issues<br/>(Epic + Vertical Slices)"]
    end

    subgraph P2["2. GitHub Flow &amp; TDD"]
        Branch["Branch per Issue<br/>(feat/issue-&lt;n&gt;-...)"] --> TDD["Write Tests (TDD)"]
        TDD --> Impl["Implementation"]
        Impl --> LocalVerify["Local Verify<br/>(npm run lint:check &amp;&amp; npm test)"]
    end

    subgraph P3["3. PR, CI Gate &amp; Merge"]
        PR["Create PR<br/>(gh pr create --body &quot;Closes #&lt;n&gt;&quot;)"] --> CIGate["Automated CI Quality Gate<br/>(pr-verify.yml: Lint, Build, Tests)"]
        CIGate --> Review["Code &amp; Spec Review"]
        Review --> Merge["Merge PR to main"]
    end

    subgraph P4["4. Automated Release &amp; Closure"]
        Merge --> CDRelease["Automated CD Pipeline<br/>(release.yml: SemVer Tag &amp; GitHub Release)"]
        CDRelease --> VerifyAC["Verify ACs [x]"]
        VerifyAC --> Close["Close Issue<br/>(gh issue close)"]
    end

    Issues --> Branch
    LocalVerify --> PR
```

<details>
<summary>ASCII Diagram (Backout Plan / Text Fallback)</summary>

```text
[1. Spec & Decomposition]
       │
       ▼
  Q&A / Grill ──► ADR / CONTEXT.md ──► GitHub Issues (Epic + Vertical Slices)
                                              │
                                              ▼
[2. GitHub Flow & TDD]                 Branch per Issue (`feat/issue-<n>-...`)
       │                                      │
       ▼                                      ▼
  Write Tests (TDD) ──► Implementation ──► Local Verify (`npm run lint:check && npm test`)
                                              │
                                              ▼
[3. PR, CI Gate & Merge]               Create PR (`gh pr create --body "Closes #<n>"`)
       │                                      │
       ▼                                      ▼
  Automated CI Gate (pr-verify.yml) ──► Code & Spec Review ──► Merge PR to main
                                                                  │
                                                                  ▼
[4. Release & Closure]                 Automated CD Release (`release.yml`)
       │                                      │
       ▼                                      ▼
  GitHub Release & Assets Uploaded ──► Verify ACs `[x]` ──► Close Issue (`gh issue close`)
```

</details>

---

## Phase 1: Discovery, Architecture & Ticket Decomposition

1. **Clarify Requirements & Stress-Test Intent**:
   - Resolve underspecified behaviors and edge cases upfront through interactive Q&A or grilling.
   - Eliminate hidden assumptions before touching code.
2. **Domain Modeling & Architectural Decisions**:
   - Update `<tool-name>/CONTEXT.md` with ubiquitous vocabulary and explicitly avoided synonyms.
   - Record architectural trade-offs and structural changes in `docs/adr/` or `<tool-name>/docs/adr/`.
3. **Vertical Slice Decomposition**:
   - Break large initiatives into small, independent, testable tickets (vertical slices).
   - Each ticket must have:
     - Clear problem statement and technical scope.
     - Checkable Acceptance Criteria checklist (`- [ ]`).
     - Explicit dependency graph (`Blocked by: #<n>`).
4. **Publish to GitHub Issue Tracker**:
   - Create parent tracking epic and child issues using `gh issue create`.

---

## Phase 2: GitHub Flow & Test-Driven Implementation

Every issue must follow **GitHub Flow** with an isolated branch and Pull Request:

1. **Claim the Issue**:
   ```bash
   gh issue edit <issue-number> --add-assignee @me
   ```
2. **Create a Dedicated Branch from `main`**:
   ```bash
   git checkout -b <type>/issue-<number>-<short-slug>
   # Examples:
   # git checkout -b feat/issue-2-emergency-buffer
   # git checkout -b fix/issue-3-scenario-b-workbench
   ```
3. **Test-First Implementation (TDD)**:
   - Add/update unit test cases in `tests/*.test.js` asserting observable behaviors and acceptance criteria.
   - Implement the feature/fix cleanly adhering to repository constraints (zero-runtime build dependencies, isolated tool directory).
4. **100% Local Automated Verification**:
   - Execute the local verification suite:
     ```bash
     npm run lint:check && npm run build && npm test
     ```
   - Formatting checks, build checks, pure simulation unit tests, helper tests, UI/UX requirement tests, and i18n parity tests must pass with zero failures.

---

## Phase 3: Pull Request, CI Quality Gate & Review

1. **Commit & Push**:
   - Commit with conventional commit messages (`feat(...)`, `fix(...)`, `test(...)`, `docs(...)`).
   ```bash
   git add .
   git commit -m "feat(predictor): implement emergency buffer reserve (#2)"
   git push -u origin <branch-name>
   ```
2. **Create Pull Request Linked to Issue**:
   - Open a PR that explicitly links to the originating issue using GitHub closing keywords:
   ```bash
   gh pr create --title "feat(predictor): <Description> (#<issue-number>)" --body "Closes #<issue-number>

   ## Summary of Changes
   - <Key changes implemented>

   ## Acceptance Criteria Verified
   - [x] <AC 1>
   - [x] <AC 2>

   ## Test Verification
   - Verified with automated test suites (\`npm test\`)."
   ```
3. **Automated CI Quality Gate (`pr-verify.yml`)**:
   - The PR automatically triggers the GitHub Actions CI pipeline:
     - Prettier code style validation (`npm run lint:check`).
     - Standalone compaction build (`npm run build`).
     - Complete automated test suite (`npm test`).
   - PR runs feature auto-cancellation (`cancel-in-progress: true`) on subsequent pushes to conserve runner time.
   - **All checks must be 100% green before approval.**
4. **Review & Merge Gate**:
   - Conduct peer review or automated agent review (standards + spec conformance).
   - **MANDATORY**: Merge the PR into `main` before closing the issue:
   ```bash
   gh pr merge <pr-number> --merge --delete-branch
   # Or squash: gh pr merge <pr-number> --squash --delete-branch
   ```

---

## Phase 4: Automated Build & Release, Verification & Closure

1. **Automated CD Pipeline (`release.yml`)**:
   - Merging to `main` automatically triggers the release workflow:
     - Full build and test validation suite runs.
     - Next Semantic Version tag (`v*.*.*`) is computed from Conventional Commits.
     - Release assets are packaged (named standalone `.html` files + unified `.zip` bundle).
     - Annotated GitHub Release is published with generated changelog notes.
2. **Verify Acceptance Criteria & Close Issue**:
   - Switch back to `main` and pull latest changes (`git checkout main && git pull`).
   - Double-check all Acceptance Criteria against the merged code and test suite.
   - Update all issue checkboxes to completed (`[x]`).
   - Close the issue with a verification summary comment:
   ```bash
   gh issue close <issue-number> --comment "Implemented and verified via PR #<pr-number>. All acceptance criteria checked and 100% tests passing."
   ```

---

## 🛡️ Non-Negotiable Quality Guardrails

- **No Issue Closed Without Merged PR**: Every issue must have a corresponding PR merged into `main` prior to issue closure.
- **CI Gate Must Be 100% Green**: No PR may be merged if the `pr-verify.yml` status check is failing or pending.
- **Automated Release on Merge**: Releases and standalone download assets are published automatically on `main` via `release.yml`.
- **Observable Behavior Over Implementation Details**: Tests must assert observable outputs (simulation logs, calculations, DOM state, URL payloads), not private variables.
- **Zero-Regression Standard**: All existing tests must pass on every commit and PR.
- **Documentation Integrity**: ADRs, `CONTEXT.md`, and translation key parity (`TRANSLATIONS.en` vs `TRANSLATIONS.vi`) must be maintained in sync with code changes.
- **Diagram Standard**: Use Mermaid as the default format for rendering diagrams in documentation. Maintain an ASCII diagram inside a collapsible backout block (`<details>`) as a fallback for plain-text viewing and rendering recovery.
