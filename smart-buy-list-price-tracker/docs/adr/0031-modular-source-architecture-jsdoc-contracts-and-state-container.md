# ADR-0031: Modular Source Architecture, JSDoc Domain Contracts & Observable State Container

## Status

Accepted (v4.5.0)

## Context

Following an extensive Software Architecture and Codebase Readability review across `smart-buy-list-price-tracker` from two distinct lenses:

1. **The Fresher Persona (Code-Only Reader)**: Developers onboarding without deep historical ADR background face severe cognitive friction reading and maintaining a monolithic 13,782-line single file (`index.html`). Global mutable state (`memoryState`), untyped domain structures, stringly-typed constants, and ad-hoc DOM re-renders make navigation, comprehension, and contribution hazardous.
2. **The Senior / Staff Architect Persona (Context & History Reader)**: The single-file HTML constraint ([ADR-0002](../../docs/adr/0002-zero-build-standalone-single-file-html-constraint.md) and [ADR-0003](../../docs/adr/0003-compacted-standalone-html-build-pipeline.md)) was intended to guarantee zero-dependency standalone portability for distribution, but has accidentally forced developers to author all source code directly inside the production deliverable. Furthermore, test suites in `tests/smart-buy-list/` rely on regex-extracting `<script>` blocks into a complex Node.js `vm` sandbox ([`smart-buy-list-harness.js`](../../tests/helpers/smart-buy-list-harness.js)), preventing standard modular testing of pure business math and persistence engines.

We required an architectural evolution that:

- Decomposes the source into maintainable, navigable modules.
- Enforces strict data contracts and type safety without external runtime transpilers.
- Decouples global state mutations from imperative UI re-renders.
- Retains 100% standalone, zero-dependency single-file HTML distribution and Dual-Runtime Compatibility (Node.js + Bun per [ADR-0007](../../docs/adr/0007-migrate-runtime-and-package-manager-to-bun.md)).

---

## Decisions

### 1. Modular Source Directory (`src/`) & Zero-Dependency Compiler Pipeline

- Source code will be authored in a structured module tree under `smart-buy-list-price-tracker/src/`:
  - `src/domain/`: Pure math, unit conversions (13 units across mass, volume, count), normalization, and deal scoring intelligence.
  - `src/types/`: Formal JSDoc domain models and schema definitions.
  - `src/state/`: Observable state store (`createStore`) with pub/sub action dispatchers.
  - `src/storage/`: IndexedDB v3 engine, localStorage fallback, and snapshot management.
  - `src/sync/`: Multi-cloud synchronization seam (Google Drive, GitHub Gist), 3-way merge, and tombstone pruning.
  - `src/sharing/`: Web Streams `CompressionStream('deflate')` codec and interactive merge diffing.
  - `src/ui/`: Components, 4-tab page views, event delegation handlers, modals, gestures, and bottom sheet controllers.
  - `src/i18n/`: Bilingual translations matrix (English and Vietnamese) and currency formatters.
- Extended [`scripts/build.js`](../../scripts/build.js) with a zero-dependency inliner that concatenates/inlines the modules into the standalone single-file `index.html` deliverable during build, ensuring zero change to runtime distribution.

### 2. Formal JSDoc Type Contracts & Compiler Verification (`checkJs`)

- Formalize all domain entities using standard JSDoc `@typedef` annotations in `src/types/domain.js`:
  - `MasterItem`, `ListItem`, `UnitDefinition`, `LedgerEntry`, `StoreProfile`.
  - `CloudSyncConfig`, `ThreeWayMergeResult`, `SnapshotRecord`, `SharePayload`.
- Configure root `jsconfig.json` / `tsconfig.json` with `"checkJs": true` and `"maxNodeModuleJsDepth": 1` to enable compile-time linting and instant IDE autocomplete without introducing `.ts` transpilation overhead.

### 3. Observable State Container (`createStore`) & Action Dispatchers

- Replace ad-hoc mutations of the global `memoryState` object with a centralized observable store:
  ```javascript
  const store = createStore(initialState, {
    persistence: [indexedDbMiddleware, localStorageMiddleware],
  });
  ```
- Expose explicit action dispatchers (`addItem`, `updateItem`, `toggleCheck`, `deleteItem`, `completeTrip`, `applyMerge`, `restoreSnapshot`).
- UI views and components subscribe only to relevant state slices, replacing scattered calls to `renderApp()` with targeted, predictable updates.

### 4. Dual-Level Test Strategy & Seam Modernization

- Refactor unit test suites (`tests/smart-buy-list-engine-math.test.js`, `storage-persistence`, `cloud-sync`, `security`):
  - Pure domain modules are imported and tested directly as ES/CommonJS modules, eliminating regex `<script>` parsing from the Node `vm` loop for core logic.
  - [`tests/helpers/smart-buy-list-harness.js`](../../tests/helpers/smart-buy-list-harness.js) is preserved and focused specifically on UI interaction, DOM event delegation, gesture routing, and full-page navigation integration tests.

---

## Consequences

### Positive

- **Drastic Cognitive Load Reduction**: Onboarding freshers can navigate isolated 100–300 line files instead of a 13,782-line monolith.
- **Strict Data Contracts**: Full IDE autocompletion, type hinting, and compile-time verification without adding TypeScript dependencies.
- **State Predictability & Traceability**: All mutations pass through structured action handlers and pub/sub subscribers.
- **Preserved Repository Invariants**: 100% standalone, zero-dependency single-file HTML deliverable maintained via automated build inlining.
- **High-Speed Testing**: Direct module unit tests run 3–5x faster without Node `vm` context initialization overhead.

### Negative & Tradeoffs

- **Compilation Step in Dev Workflow**: Modifying files in `src/` requires running `bun run build:tracker` (or continuous watch) to update `smart-buy-list-price-tracker/index.html`.
- **Dual Source Maintenance during Transition**: Requires a carefully phased vertical slice migration to guarantee zero regression across the existing 1,481 test assertions.
