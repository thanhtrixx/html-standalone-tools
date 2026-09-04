# HTML Standalone Tools — Product

> Durable product truth for the **collection**. This is the root anchor for the whole
> repository. Each tool carries its own tool-specific product truth in
> `<tool>/PRODUCT.md` (e.g. [`personal-finance-savings-predictor/PRODUCT.md`](./personal-finance-savings-predictor/PRODUCT.md)).
> Domain glossaries live in per-tool `CONTEXT.md`; the registry of tools is
> [`CONTEXT-MAP.md`](./CONTEXT-MAP.md); decisions live in `docs/adr/`.
>
> This file captures **what the product is and why it must stay the way it is** — not the
> visual world. Visual identity is decided per tool in design work (DESIGN.md / new-work), not here.

---

## What this is

A curated collection of **self-contained, client-side decision tools**, each authored as a
human-readable single-file application and compiled by a compaction pipeline into a
production, minified, **single-file HTML** deliverable that runs with **zero backend** in any
browser. The author maintains one `index.html` per tool; the build produces a compact
`dist/index.html` (plus companion PWA assets where applicable).

The collection is not a monolith and not a shared web app. It is a set of **independent
utilities** under one roof, sharing only architecture standards and a build/release/test
infrastructure. Each tool ships on its own lifecycle.

## Who it's for

**Primary user: Vietnamese-speaking individuals (VND market)** doing the three financial and
household jobs below. Tools default to Vietnamese locale and currency (VND, `vi` first) and are
shipped to that audience, while remaining usable in English.

The collection serves **three distinct user moments**, one per tool:

1. **Planning long-term savings & wealth** — a financially-mindful individual projecting how
   multi-tier savings, salary growth, and inflation compound over time, and exporting a private
   dossier for an external AI advisor. → _Personal Finance Savings Predictor_
2. **Deciding whether to buy a home or keep renting** — someone weighing the long-run economics
   of homeownership versus investing the difference, before a large commitment. → _Buy vs. Rent
   Home Comparison_
3. **A grocery / household shopping trip** — a shopper building a multi-store list, normalizing
   package unit prices, and getting in-aisle deal intelligence. → _Smart Buy-List & Unit Price
   Tracker_

The secondary user of the _collection_ (as opposed to any single tool) is the **author**, who
builds, compacts, tests, and distributes these tools to external static hosts
(`trile-dev/static/tools/`). See [`docs/adr/0006`](./docs/adr/0006-configurable-external-distribution-sync.md).

## What it makes possible

Each tool turns a complex, multi-variable financial or household question into a **fast,
private, local simulation** the user can run and interrogate without a server, an account, or
network round-trips. The meaningfully different position, shared across all three:

- **Privacy-first by construction.** No account, no server, no telemetry. Financial data is
  computed in the browser. Where a tool offers an AI consultation, it exports a
  **portable Markdown dossier** that can be **anonymized** (absolute values → salary multiples /
  price multiples / percent shares, dates → relative offsets, institution names masked) before
  leaving the device.
- **Zero-backend single-file portability.** One HTML file, minified, runs anywhere — email it,
  host it, open it offline. This is the north-star that every tool inherits (ADR-0003).
- **Bilingual, locale-native.** 100% Vietnamese/English dictionary parity; locale-aware number,
  date, currency masking, and verbal helpers (`2.5 Tỷ VND`).
- **Trust through transparency.** The financial tools expose the **methodology and live formula
  traces** so the user can audit the math; the tracker exposes its deal-scoring rules. No
  black boxes.

## The three tools

| Tool                                             | One-line job                                                                                                               | Platform                                    | Product truth                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| **Personal Finance Savings Predictor**           | Project multi-tier savings, salary escalation, and inflation; compare scenarios; export a private Financial Health Dossier | Web (desktop-first, responsive to mobile)   | [`PRODUCT.md`](./personal-finance-savings-predictor/PRODUCT.md) |
| **Buy vs. Rent Home Comparison**                 | Model the long-run net-worth outcome of buying vs. renting; find the crossover date; sweep sensitivity                     | Web (desktop-first, responsive to mobile)   | [`PRODUCT.md`](./buy-vs-rent-home-comparison/PRODUCT.md)        |
| **Smart Buy-List & Unit Price Tracker** (v4.0.0) | Multi-store buy-list + purchase ledger; normalize package unit prices; in-aisle deal ratings; offline PWA                  | **Mobile-first PWA** (also runs on desktop) | [`PRODUCT.md`](./smart-buy-list-price-tracker/PRODUCT.md)       |

Each tool is 100% isolated: **zero shared runtime state, globals, or `localStorage` keys**
between tools (ADR-0001). Adding or changing one tool must not require touching another —
**this is the single most important invariant of the collection.**

## Platform

**Web.** All three are browser applications. The tracker is a **mobile-first Progressive Web
Application** (installable, offline via a service worker) but is still a web design — it is not a
native app and must not adopt a native design language. The two financial tools are desktop-first
web apps that degrade gracefully to mobile. There is no iOS, Android, or adaptive native surface.

## Stack

Established by the repository and its ADRs (not a choice to be re-asked):

- **No build framework at runtime.** Plain HTML/CSS/JS authored in one `index.html` per tool.
  Styling via **Tailwind CSS (CDN)**; charts via **Chart.js (CDN)**; CSV via **PapaParse**;
  PDF export via **jsPDF** + **html2canvas** (financial tools); **Font Awesome (CDN)** for icons.
- **Compaction build pipeline** (`scripts/build.js`, `html-minifier-terser` + `terser`): inlines
  local assets and minifies HTML/CSS/JS into a compact `dist/index.html` per tool; >30% payload
  reduction; dual-path (readable source vs. compacted deliverable). ADR-0003.
- **PWA** (tracker only): service worker, IndexedDB storage, `manifest`, maskable icons,
  cache-first offline. ADRs 0003/0007/0015/0025.
- **Tooling / gates:** Node, Prettier (format gate in CI), a unified test runner
  (`scripts/run-tests.js`) with multi-format reporting, GitHub Actions PR-verify + automated
  SemVer release, and configurable external distribution sync (`TOOLS_DEST_DIR`).
  ADRs 0004/0005/0006.

## Durable constraints (non-negotiables for future work)

These are the invariants every change must preserve. They are the reason this product can stay
small, private, and portable — do not trade them away for convenience.

- **Single-file, zero-backend runtime.** Each tool runs with no server call. No new backend
  dependency, no required network at use-time (PWA offline, CDN-at-load, and user-supplied cloud
  sync are the only network touches, all optional/offline-degradable).
- **Tool isolation.** No shared runtime state, globals, or storage keys across tools. Each tool
  is independently lifecycled, tested, and shipped.
- **Dual-path build.** Author readable `index.html`; ship compacted `dist/index.html` via the
  compaction pipeline. Do not hand-edit or author directly in `dist/` (it is gitignored).
- **Bilingual parity (vi + en).** Every user-facing string exists in both dictionaries with
  100% coverage; `tests/i18n.test.js` enforces parity. New copy is not done until it is
  translated both ways.
- **Accessibility floor.** WCAG 2.1 AA/AAA contrast across dark and light themes; keyboard-
  accessible controls and tooltips. Do not regress this when restyling.
- **Privacy default.** Financial tools export anonymized-by-default dossiers; absolute monetary
  values are sanitized before they leave the device unless the user opts out.
- **Transparency / auditability.** Financial tools expose methodology and live formula traces;
  the tracker exposes deal-scoring rules. No unexplained numbers.
- **Delivery discipline (GitHub Flow + TDD).** Branch per issue, tests green before PR, CI PR
  gate (format + build + test), squash merge, automated release. Prettier format is a CI gate.
- **Durable assets preserved.** Per-tool `icon.svg` / maskable PWA icons, `I18N.md`, and the
  ADR trails are authoritative; restyle around them, don't orphan them.

## Durable assets & sources of truth

- **Registry:** [`CONTEXT-MAP.md`](./CONTEXT-MAP.md) — the list of tools and their summaries.
- **Per-tool domain glossary:** `<tool>/CONTEXT.md` (ubiquitous language, `_Avoid_` synonyms).
- **Per-tool product truth:** `<tool>/PRODUCT.md`.
- **Per-tool bilingual guide:** `<tool>/I18N.md`.
- **Decisions:** root [`docs/adr/`](./docs/adr/) (system-wide) and `<tool>/docs/adr/`
  (tool-specific).
- **Tests:** [`tests/`](./tests), run via `npm test`; per-tool plans in `<tool>/TEST_PLAN.md`.
- **Implementation backlog:** `<tool>/ITEMS_TO_IMPLEMENT.md`.
- **Brand assets:** per-tool `icon.svg` (+ `icon-180.png`, maskable PWA icons, `og-image.png`
  for the tracker).

## How this file relates to the rest

`CONTEXT-MAP.md` _lists_ the tools; this file is the **shared product truth** those tools
inherit. Per-tool `PRODUCT.md` specializes it. `CONTEXT.md` is the **glossary**, not product
truth. `docs/adr/` is the **decision log**. When a future task touches visuals, it should load or
establish a `DESIGN.md` for that tool's world — this file does not.

## Next

- Per-tool PRODUCT.md files now carry the tool-specific user, job, and constraints.
- For a tool that needs new visual work or a replacement world, run design work
  (`$impeccable new-work` / `shape`) — that is where a `DESIGN.md` and the visual world are
  decided, keeping this product truth intact.
- Live browser iteration (`$impeccable live`) is available for any tool; configure it per tool
  when that iteration is wanted (it touches that tool's config/CSP).
