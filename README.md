# HTML Standalone Tools

A curated collection of self-contained, client-side web tools compiled into compacted single-file HTML applications for optimal web delivery and instant execution in any browser.

---

## 🏛️ Architecture & Repository Design

This repository is structured as a **multi-tool workspace**, where each tool lives in its own isolated directory as a complete, self-contained unit. Authors maintain readable, well-structured source files while an automated compaction pipeline produces production-ready, minified standalone deliverables.

```
/
├── .github/
│   └── workflows/
│       ├── pr-verify.yml                       # CI quality gate on Pull Requests
│       └── release.yml                         # Automated SemVer release on merge
├── AGENTS.md                                   # Agent skills configuration
├── CONTEXT-MAP.md                              # Multi-context registry of all tools
├── README.md                                   # Repository overview and guidelines
├── package.json                                # Build, lint, and test scripts
├── scripts/
│   ├── build.js                                # HTML/CSS/JS compaction engine
│   └── pack-release.js                         # Production release asset packager
├── tests/
│   └── build.test.js                           # Automated build pipeline tests
├── docs/
│   ├── adr/                                    # System-wide Architecture Decision Records
│   │   ├── 0001-multi-tool-repository-structure.md
│   │   ├── 0002-zero-build-standalone-single-file-html-constraint.md (superseded)
│   │   ├── 0003-compacted-standalone-html-build-pipeline.md
│   │   └── 0004-ci-pr-verification-and-automated-release-pipeline.md
│   └── agents/                                 # Issue tracker & skill specifications
└── personal-finance-savings-predictor/         # Standalone Tool Directory
    ├── index.html                              # Source application (HTML/CSS/JS)
    ├── dist/                                   # Compacted standalone production output
    │   └── index.html
    ├── CONTEXT.md                              # Tool-specific domain glossary
    ├── docs/
    │   └── adr/                                # Tool-specific architecture decisions
    │       ├── 0001-flexible-pool-deficit-handling.md
    │       ├── 0002-anniversary-based-salary-escalation.md
    │       ├── 0003-locale-aware-number-and-date-formatting.md
    │       ├── 0004-pure-simulation-engine-separation.md
    │       └── 0005-unified-threshold-auto-term-allocation.md
    ├── ACTION_PLAN.md                          # Implementation roadmap & checklist
    ├── ITEMS_TO_IMPLEMENT.md                   # Feature requirements & engine specs
    └── TEST_PLAN.md                            # Automated console & manual test suite
```

### Core Architecture Principles

1. **Compacted Standalone Single-File Applications**: Source files are authored with readability, maintainability, and comments. The build engine inlines local resources and minifies HTML, inline CSS, and JavaScript into a single, compact `dist/index.html` file per tool for optimal web delivery payloads.
2. **Zero Backend & Instant Portability**: Every tool runs completely client-side without servers or databases. Both source and compacted HTML files can be opened directly via `file://` or hosted on any static web host.
3. **Strict Directory Isolation**: Tools are completely decoupled. They never share runtime state, global dependencies, or storage keys across directories.
4. **Automated CI/CD Quality Gates & Release Delivery**: All Pull Requests must pass automated Prettier formatting, compaction build, and 100% of test suites (`pr-verify.yml`). Merging to `main` automatically computes Semantic Version tags and publishes GitHub Releases with standalone `.html` and unified `.zip` downloads (`release.yml`).
5. **Dedicated Domain Modeling**: Each tool maintains its own `CONTEXT.md` glossary and `docs/adr/` decision records to keep requirements explicit and avoid semantic drift.

---

## 🚀 Build, Lint & Test Commands

```bash
# Build all standalone tools to compacted dist/ outputs
npm run build

# Build a specific standalone tool
npm run build:predictor
# or: node scripts/build.js --tool <tool-name>

# Run automated tests verifying build pipeline and script integrity
npm test

# Verify code formatting with Prettier (CI Gate)
npm run lint:check

# Format source files with Prettier
npm run format

# Package release assets (standalone HTMLs + unified zip)
npm run pack:release
```

---

## 🛠️ Available Tools

### 💰 [Personal Finance Savings Predictor](./personal-finance-savings-predictor/)

A client-side wealth forecasting and multi-tier savings simulation tool supporting compound salary escalation, inflation purchasing power discounting, scheduled withdrawals, automatic 6-month term reinvestment, and bilingual Vietnamese/English localization.

- **Source Entry:** [`personal-finance-savings-predictor/index.html`](./personal-finance-savings-predictor/index.html)
- **Compacted Web Output:** [`personal-finance-savings-predictor/dist/index.html`](./personal-finance-savings-predictor/dist/index.html)
- **Domain Model:** [`personal-finance-savings-predictor/CONTEXT.md`](./personal-finance-savings-predictor/CONTEXT.md)
- **Requirements & Specs:** [`personal-finance-savings-predictor/ITEMS_TO_IMPLEMENT.md`](./personal-finance-savings-predictor/ITEMS_TO_IMPLEMENT.md)

---

## ➕ Adding a New Standalone Tool

To create and integrate a new tool into this repository:

1. **Create a Dedicated Directory**: `mkdir <tool-name>`
2. **Add Source Application**: Create `<tool-name>/index.html` containing markup, styles, and scripts (or modular local CSS/JS).
3. **Define Tool Domain Model**: Create `<tool-name>/CONTEXT.md` defining key terms, entities, and avoided synonyms.
4. **Register in Context Map**: Add the tool's entry and summary to [`CONTEXT-MAP.md`](./CONTEXT-MAP.md).
5. **Document Architecture Decisions**: Add tool-specific decisions under `<tool-name>/docs/adr/`.
6. **Include Test & Requirement Plans**: Provide `<tool-name>/ITEMS_TO_IMPLEMENT.md` and `<tool-name>/TEST_PLAN.md`.
7. **Compile Deliverable**: Run `npm run build` to generate `<tool-name>/dist/index.html`.

---

## 🔄 Ways of Working (WoW) & GitHub Flow

This repository follows a strict **GitHub Flow** and **Test-Driven Delivery** process for both human contributors and autonomous AI agents:

1. **Spec & Issue Decomposition**: Requirements are decomposed into small vertical slices with checkable Acceptance Criteria (`- [ ]`) and tracked via GitHub Issues.
2. **Branch per Issue**: Every feature or fix is developed in an isolated branch branched from `main` (`feat/issue-<n>-<slug>` or `fix/issue-<n>-<slug>`).
3. **Test-Driven Development (TDD)**: Automated test suites in `tests/` must be authored/updated and passing (`100%`) before PR creation.
4. **Automated CI Quality Gate**: Opening a PR triggers `.github/workflows/pr-verify.yml` running format checks, compaction build, and tests.
5. **Pull Request & Merge Required Before Closure**:
   - Open a PR linking the issue (`gh pr create --body "Closes #<n>"`).
   - Review and merge the PR into `main` (`gh pr merge`).
   - Merging to `main` triggers `.github/workflows/release.yml` for automated SemVer tagging and GitHub Release asset packaging.
   - Verify all Acceptance Criteria against the merged build.
   - Close the issue only after successful merge and verification.

For full architectural lifecycle and guidelines, see [`docs/agents/ways-of-working.md`](./docs/agents/ways-of-working.md).

---

## 🔒 Code Quality & Pre-Commit

Pre-commit hooks are configured with **Husky** and **lint-staged** running **Prettier** across all staged source files on commit:

```bash
# Verify formatting across staged files
npx lint-staged
```
