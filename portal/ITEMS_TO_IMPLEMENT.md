# Portal Hub: Specification & Items to Implement

## Requirements

### 1. Catalog Presentation

- Render a responsive header with suite brand name, short tagline, bilingual language toggle (`EN` / `VI`), and link to GitHub repository.
- Display a responsive grid of Tool Cards for all tools:
  - **Smart Buy-List & Unit Price Tracker** (`smart-buy-list-price-tracker`)
    - Badges: `PWA`, `Offline-Ready`, `Deal Intelligence`
    - Actions: "Launch App" -> `./smart-buy-list-price-tracker/`
  - **Buy vs. Rent Home Comparison** (`buy-vs-rent-home-comparison`)
    - Badges: `Financial Modeling`, `Mortgage & Opportunity Cost`, `Visual Analytics`
    - Actions: "Launch App" -> `./buy-vs-rent-home-comparison/`
  - **Personal Finance Savings Predictor** (`personal-finance-savings-predictor`)
    - Badges: `Monte Carlo / Escalation`, `Multi-Tier Deposit`, `Inflation Modeling`
    - Actions: "Launch App" -> `./personal-finance-savings-predictor/`

### 2. Localization & Language Persistence

- Support instantaneous client-side switching between English (`en`) and Vietnamese (`vi`).
- Store selected language in `localStorage.getItem('portal_lang')`.
- Default to `en` if unconfigured or `navigator.language` contains non-Vietnamese locales.

### 3. Build & Compaction Integration

- Source maintained at `portal/index.html`.
- `scripts/build.js` must compile `portal/index.html` into `dist/index.html` during `bun run build` / `npm run build`.
- Compiles Tailwind CSS classes into a static, purged inline `<style>` and minifies HTML structure.

### 4. GitHub Actions Release Workflow Integration

- Update `.github/workflows/release.yml` to:
  - Add `pages: write` and `id-token: write` permissions.
  - In `release` job, invoke `actions/upload-pages-artifact@v3` with `path: dist`.
  - Add `deploy-pages` job (`needs: release`) deploying artifact via `actions/deploy-pages@v4` targeting `environment: github-pages`.
