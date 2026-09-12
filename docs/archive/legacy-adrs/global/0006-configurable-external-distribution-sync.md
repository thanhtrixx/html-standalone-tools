# ADR-0006: Configurable External Distribution Directory Synchronization

## Status

Accepted (Extends [ADR-0003](./0003-compacted-standalone-html-build-pipeline.md))

## Context

Standalone web applications built in this repository are frequently consumed by external websites, static hosting roots, and portfolio repositories (e.g. `trile-dev/static/tools/`).

Previously, copying production-compacted tool deliverables (`dist/index.html` and companion PWA assets) to external workspace directories required manual copying or hardcoded file system scripts. Hardcoding local absolute paths in the build pipeline or committing them to git violates environmental portability, exposes machine-specific paths, and fails across CI/CD or different developer workstations.

## Decision

We enhance the standalone build pipeline (`scripts/build.js`) with an automated, configurable external distribution synchronization mechanism:

1. **Multi-Layer Configuration Precedence Cascade**:
   The target destination directory is resolved via a strict multi-layer cascade with zero external npm dependencies:
   - **Tier 1 (CLI Arguments)**: `--dest-dir=<path>`, `--export-dir=<path>`, or `--sync-dir=<path>`
   - **Tier 2 (Environment Variables)**: `process.env.TOOLS_DEST_DIR` or `process.env.DIST_DEST_DIR`
   - **Tier 3 (Local Environment Files)**: `.env.local` or `.env` in the repository root (natively parsed for `TOOLS_DEST_DIR`)
   - **Tier 4 (Fallback)**: If no target directory is configured, external synchronization is cleanly bypassed, ensuring builds in CI/CD and clean clones run without warnings or errors.

2. **Tool-Scoped Directory Mirroring**:
   - Deliverables are mirrored into individual subdirectories under the destination path: `<dest-dir>/<tool-name>/index.html`.
   - Companion runtime assets (e.g., `manifest.webmanifest`, `sw.js`, PWA icons) present in the tool directory or tool `dist/` are automatically synchronized alongside `index.html`.
   - Intermediate destination directories are auto-created recursively (`fs.mkdirSync(..., { recursive: true })`).

3. **Source Control Security & Git Hygiene**:
   - Local environment configuration files (`.env`, `.env.local`, `.env.*`, `*.local.json`) are strictly excluded via `.gitignore`.
   - A documented template `.env.example` provides onboarding instructions for developers wishing to configure local syncing.

4. **Automated Verification & Traceability**:
   - Comprehensive unit and integration test assertions are added to `tests/build.test.js` validating environment parsing, precedence rules, directory mirroring, companion asset sync, and unconfigured fallback behavior.

## Consequences

- **Developer Immediacy**: Running `npm run build` locally automatically updates external static folders in one command without manual file copying.
- **Portability & Security**: Zero hardcoded absolute paths in tracked repository code; safe for open-source publication and automated GitHub Actions CI/CD pipelines.
- **Robustness**: Graceful fallback when unconfigured, with strict error throwing if an explicitly provided destination is invalid or unwritable.
