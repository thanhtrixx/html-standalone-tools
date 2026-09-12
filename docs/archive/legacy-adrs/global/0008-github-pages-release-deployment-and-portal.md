# ADR-0008: GitHub Pages Automated Release Deployment & Central Portal Launcher

> **Status:** Accepted

## Context

The repository provides multiple standalone single-file HTML applications (`smart-buy-list-price-tracker`, `buy-vs-rent-home-comparison`, `personal-finance-savings-predictor`). While `release.yml` produces versioned GitHub Releases with attached `.html` files and `.zip` bundles (ADR-0004), users lacked an instantly accessible online web host to explore, launch, and run these tools directly in a browser without downloading release assets.

Hosting tools on GitHub Pages (`https://thanhtrixx.github.io/html-standalone-tools/`) requires:

1. A root landing experience (`dist/index.html`) to present the tools catalog, prevent 404 errors at the root URL, and allow one-click launches.
2. An automated, zero-touch deployment workflow integrated into the existing CD pipeline (`release.yml`).
3. Preserving the repository's strict quality invariants: Zero Runtime Dependencies, 100% Bilingual Parity (EN/VI), Standalone Isolation, and Two-Speed verification.

## Decision

We have adopted the following architecture for GitHub Pages delivery:

1. **Central Portal Launcher (`portal/index.html` -> `dist/index.html`)**:
   - Source is maintained under `portal/index.html` with responsive Tailwind styling and bilingual dictionary support (English & Vietnamese).
   - Features searchable tool cards, category/feature badges (e.g., PWA, Offline-Ready, Financial Modeling), direct launch buttons, and links to GitHub Release assets and source repository.
   - Integrated into `scripts/build.js` alongside standalone tools, compiling Tailwind CSS at build-time and minifying into a lightweight, standalone `dist/index.html`.

2. **Actions-Based Continuous Deployment (`release.yml`)**:
   - Integrated directly into the main branch release workflow as a downstream job (`deploy-pages`) that executes only after `release` validation and packaging succeed.
   - Utilizes official GitHub Actions Pages actions (`actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4`) with scoped permissions (`pages: write`, `id-token: write`).
   - Targets the official `github-pages` environment, tracking live deployment URLs on GitHub commits.
   - Deploys the compacted `dist/` directory, serving the portal at root and each standalone tool under its respective subpath (e.g. `/smart-buy-list-price-tracker/`).

3. **Asset & Storage Isolation**:
   - Each standalone tool retains complete directory and storage isolation (`localStorage` / IndexedDB).
   - Relative URL references (`./`) ensure standalone compatibility across custom domains, local file systems, and GitHub Pages subpaths.

## Consequences

### Positive

- **Instant Web Access**: Every merged change on `main` automatically updates live web versions of all tools at `https://thanhtrixx.github.io/html-standalone-tools/`.
- **Zero Drift**: Portal and tool deliverables are built simultaneously from source within the dual-runtime pipeline (`bun run build` / `npm run build`).
- **Standardized CI/CD**: Follows Phase 4 of Ways of Working without introducing manual deployment steps or legacy orphan branches.

### Negative / Trade-offs

- One-time administrative configuration required on the GitHub repository: Pages build source must be set to "GitHub Actions".
