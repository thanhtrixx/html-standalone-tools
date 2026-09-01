# ADR-0004: CI PR Verification & Automated Release Pipeline

> **Status:** Accepted

## Context

Previously, the repository lacked automated Continuous Integration (CI) verification when Pull Requests were submitted and lacked automated Continuous Delivery (CD) build and release capabilities upon merging to the `main` branch. Quality enforcement relied entirely on local pre-commit hooks and developer diligence, leaving the main branch vulnerable to untested or broken builds if local checks were bypassed. Furthermore, publishing production standalone HTML artifacts for end-user distribution required manual compilation and release creation.

## Decision

We have established automated GitHub Actions workflows for continuous verification and delivery:

1. **Pull Request Quality Gate (`pr-verify.yml`)**:
   - Automatically executes on all Pull Requests targeting `main`.
   - Runs deterministic dependency installations (`npm ci`) and the unified verification suite (`npm run verify` covering Prettier code formatting checks, standalone compaction builds, and the full automated test suite).
   - Implements concurrency run-cancellation (`cancel-in-progress: true`) to terminate superseded in-flight runs when new commits are pushed.

2. **Automated Build & Release on Merge (`release.yml`)**:
   - Automatically executes upon direct push or merged Pull Requests to `main`.
   - Validates build and test suites before publication.
   - Automatically calculates the next Semantic Version tag (`v*.*.*`, defaulting to patch increments with support for conventional commit tags `#minor`/`#major`) and generates markdown release changelogs.
   - Compiles and packages individual standalone HTML applications (`<tool-name>.html`), per-tool PWA bundles, and a unified ZIP bundle (`html-standalone-tools-<version>.zip`) into release assets via `scripts/pack-release.js`.
   - Publishes an annotated GitHub Release with attached downloadable assets.

3. **Deterministic Dependency Management**:
   - Tracks `package-lock.json` in source control while keeping compiled `dist/` and `release-assets/` directories untracked, ensuring reproducible ephemeral CI/CD builds.

## Consequences

- **Quality Guarantee**: Every PR must achieve 100% green status on formatting, compaction compilation, and automated test execution before merging into `main`.
- **Zero-Friction Continuous Delivery**: Every merged feature or bug fix automatically yields a versioned GitHub Release with production-ready, single-file HTML downloads without manual maintainer overhead.
- **Reproducibility**: Builds and tests execute deterministically across local and CI environments.
