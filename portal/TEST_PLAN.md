# Portal Hub: Test Plan

## Test Strategy

Verification is automated through two complementary testing layers:

### 1. Build Verification & File Artifact Invariants (`tests/build.test.js`)

- Assert that `dist/index.html` exists after `bun run build`.
- Assert that `dist/index.html` is smaller than the size budget (e.g. < 50 KB compacted).
- Assert that `dist/index.html` contains zero unpurged Tailwind CDN script tags (`cdn.tailwindcss.com`).
- Assert that all standalone tool directory paths (`./smart-buy-list-price-tracker/`, `./buy-vs-rent-home-comparison/`, `./personal-finance-savings-predictor/`) are present as direct links.

### 2. Bilingual Parity & DOM Verification (`tests/portal.test.js`)

- Load `portal/index.html` (or compacted `dist/index.html`) in JSDOM / synthetic test harness.
- Assert 100% dictionary key parity between `en` and `vi` translations.
- Assert that switching language dynamically updates headers, tool descriptions, and button labels in the DOM.
- Assert that language choice persists across sessions via `localStorage`.

### 3. CI/CD Workflow Syntax & Action Integrity

- Static validation of `.github/workflows/release.yml` for required permissions (`pages: write`, `id-token: write`) and valid `actions/deploy-pages@v4` job specification.
