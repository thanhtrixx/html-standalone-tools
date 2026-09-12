# ADR-0007: Dual-Runtime Compatibility (Node.js + Bun) with Accelerated CI/CD

## Status

Accepted (Extends [ADR-0004](./0004-ci-pr-verification-and-automated-release-pipeline.md) and [ADR-0005](./0005-unified-test-runner-and-multi-format-reporting.md))

## Context

The repository's build, packaging, verification, and automated test pipelines historically executed exclusively under Node.js (`node` and `npm`).

While Node.js provides a mature ecosystem, as the repository expanded to 3 production tools and over 2,200 assertions across 17 test suites, the verification cycle began incurring noticeable latency:

- Full test runner execution took ~12.7 seconds on developer workstations.
- Clean dependency installations in CI (`npm ci`) required 8–15 seconds to parse and hydrate the dependency graph.
- Pre-PR verification gates (`npm run verify`) took ~15–20 seconds overall.

Bun offers an alternative high-performance runtime built on WebKit's JavaScriptCore (JSC) with an integrated package manager and native bundler/transpiler capabilities. However, a complete, exclusive replacement of Node.js would break compatibility for contributors or environments where Bun cannot be installed or is not permitted.

We required an architectural model that accelerates build, verification, and CI/CD pipelines via Bun while maintaining 100% Dual-Runtime Compatibility with Node.js.

## Decision

We establish **Dual-Runtime Compatibility (Node.js + Bun)** across the repository with the following architecture:

### 1. Dual Lockfiles (`bun.lock` + `package-lock.json`)

- Both `package-lock.json` (for `npm`) and `bun.lock` (text-based format for Bun 1.2+) are tracked in git and maintained in exact synchronization.
- Node.js environments execute frozen reproducible installs via `npm ci`.
- Bun environments execute ultra-fast reproducible installs via `bun install --frozen-lockfile` (~10ms).
- Any dependency addition or upgrade must update both lockfiles simultaneously.

### 2. Runtime-Agnostic Script Dispatcher (`scripts/run.sh` & `scripts/verify.js`)

- `package.json` scripts are decoupled from hardcoded `node` invocations. Instead, they invoke a dynamic POSIX dispatcher script (`./scripts/run.sh <target> [args]`).
- The dispatcher inspects `$npm_config_user_agent`:
  - When invoked via `bun run <script>`: Executes using `bun` (or `bunx` via `-x`).
  - When invoked via `npm run <script>`: Executes using `node` (or `npx` via `-x`).
- A unified verification script (`scripts/verify.js`) runs Prettier code style checks, compaction builds, and automated test suites under whichever runtime initiated the verification gate.

### 3. Cross-Runtime Test Harness Hardening (`node:vm` & Env Isolation)

During testing under Bun's JavaScriptCore engine, two architectural runtime differences were identified and addressed:

1. **`node:vm` Scoping Differences**:
   - In Node.js (V8 engine), context properties and top-level function declarations share a global object proxy, allowing external mutations like `sandbox.showToast = ...` to overwrite top-level functions inside the VM.
   - In Bun (JavaScriptCore engine), top-level function declarations retain lexical bindings within the VM context. Mutating the sandbox object externally does not intercept internal function calls.
   - **Resolution**: Test fixtures standardize on `vm.runInContext("targetFn = ...", sandbox)` for function mocks and spies, ensuring identical, deterministic behavior across both V8 and JavaScriptCore.
2. **Automatic `.env.local` Loading**:
   - Bun natively parses and loads `.env` and `.env.local` into `process.env` on startup, unlike standard Node.js.
   - **Resolution**: In `tests/build.test.js`, fallback cascade assertions explicitly isolate `delete process.env.TOOLS_DEST_DIR` during fallback testing and restore original environment state afterward.

### 4. Pure Bun CI/CD Quality Gate

- In GitHub Actions (`.github/workflows/pr-verify.yml` and `.github/workflows/release.yml`), steps are streamlined to pure Bun pipelines:
  - `oven-sh/setup-bun@v2` installs the latest Bun runtime.
  - Dependencies are installed via `bun install --frozen-lockfile` (~1–2s total step duration).
  - Verification executes `bun run verify`.
  - Release packaging runs `bun scripts/pack-release.js`.
- Eliminating fragile shell fallback cascades (`|| npm ci`, `|| npm run verify`) ensures that lockfile corruptions or Bun-specific anomalies fail fast in CI without silently falling back to Node.

### 5. Documentation & Developer Ergonomics Parity

- Developer documentation ([`README.md`](../../README.md), [`docs/agents/ways-of-working.md`](../agents/ways-of-working.md), and tool `TEST_PLAN.md` files) promotes Bun as the recommended primary runtime for rapid inner-loop feedback, while documenting Node/npm equivalents side-by-side as fully first-class supported commands.

## Consequences

- **Performance Gain**:
  - Full verification gate (`bun run verify`) is significantly faster, completing clean lint, 3-tool compaction build, and 2,222 test assertions in ~12.1s (with sub-second unit tests).
  - CI dependency installation drops from ~10s to sub-second (`~10ms` cache / `~1s` runner fetch).
- **Dual-Runtime Parity**:
  - All 2,222 assertions across 17 test suites pass with 100% success under both `bun scripts/run-tests.js` and `node scripts/run-tests.js`.
  - Developers on machines without Bun can contribute seamlessly using standard `npm` and `node`.
- **Maintenance Discipline**:
  - Any future dependencies or test harness mocks must preserve compatibility with both V8 and JavaScriptCore VM semantics.
