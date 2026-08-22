# HTML Standalone Tools

A curated collection of self-contained, client-side, zero-build web tools. Each tool is designed to run instantly in any browser without build pipelines, bundlers, or backend dependencies.

---

## 🏛️ Architecture & Repository Design

This repository is structured as a **multi-tool workspace**, where each tool lives in its own isolated directory as a complete, self-contained unit.

```
/
├── AGENTS.md                                   # Agent skills configuration
├── CONTEXT-MAP.md                              # Multi-context registry of all tools
├── README.md                                   # Repository overview and guidelines
├── docs/
│   ├── adr/                                    # System-wide Architecture Decision Records
│   │   ├── 0001-multi-tool-repository-structure.md
│   │   └── 0002-zero-build-standalone-single-file-html-constraint.md
│   └── agents/                                 # Issue tracker & skill specifications
└── personal-finance-savings-predictor/         # Standalone Tool Directory
    ├── index.html                              # Self-contained application (HTML/CSS/JS)
    ├── CONTEXT.md                              # Tool-specific domain glossary
    ├── docs/
    │   └── adr/                                # Tool-specific architecture decisions
    │       ├── 0001-flexible-pool-deficit-handling.md
    │       ├── 0002-anniversary-based-salary-escalation.md
    │       └── 0003-locale-aware-number-and-date-formatting.md
    ├── ACTION_PLAN.md                          # Implementation roadmap & checklist
    ├── ITEMS_TO_IMPLEMENT.md                   # Feature requirements & engine specs
    └── TEST_PLAN.md                            # Automated console & manual test suite
```

### Core Architecture Principles

1. **Zero-Build, Single-File Applications**: Every tool is packaged in a single `index.html` file using CDN-loaded libraries (Tailwind CSS, Chart.js, PapaParse, etc.). No Node/npm build steps or bundlers are required to run a tool.
2. **Strict Directory Isolation**: Tools are completely decoupled. They never share runtime state, global dependencies, or storage keys across directories.
3. **Dedicated Domain Modeling**: Each tool maintains its own `CONTEXT.md` glossary and `docs/adr/` decision records to keep requirements explicit and avoid semantic drift.
4. **Instant Portability**: Every tool can be run directly via `file://` by double-clicking `index.html` or hosted on any static web host.

---

## 🛠️ Available Tools

### 💰 [Personal Finance Savings Predictor](./personal-finance-savings-predictor/)

A client-side wealth forecasting and multi-tier savings simulation tool supporting compound salary escalation, inflation purchasing power discounting, scheduled withdrawals, automatic 6-month term reinvestment, and bilingual Vietnamese/English localization.

- **Entry Point:** [`personal-finance-savings-predictor/index.html`](./personal-finance-savings-predictor/index.html)
- **Domain Model:** [`personal-finance-savings-predictor/CONTEXT.md`](./personal-finance-savings-predictor/CONTEXT.md)
- **Requirements & Specs:** [`personal-finance-savings-predictor/ITEMS_TO_IMPLEMENT.md`](./personal-finance-savings-predictor/ITEMS_TO_IMPLEMENT.md)

---

## ➕ Adding a New Standalone Tool

To create and integrate a new tool into this repository:

1. **Create a Dedicated Directory**: `mkdir <tool-name>`
2. **Add Single-File Application**: Create `<tool-name>/index.html` containing all markup, styles, and scripts.
3. **Define Tool Domain Model**: Create `<tool-name>/CONTEXT.md` defining key terms, entities, and avoided synonyms.
4. **Register in Context Map**: Add the tool's entry and summary to [`CONTEXT-MAP.md`](./CONTEXT-MAP.md).
5. **Document Architecture Decisions**: Add tool-specific decisions under `<tool-name>/docs/adr/`.
6. **Include Test & Requirement Plans**: Provide `<tool-name>/ITEMS_TO_IMPLEMENT.md` and `<tool-name>/TEST_PLAN.md`.

---

## 🔒 Code Quality & Pre-Commit

Pre-commit hooks are configured with **Husky** and **lint-staged** running **Prettier** across all staged files on commit:

```bash
# Verify formatting across staged files
npx lint-staged
```
