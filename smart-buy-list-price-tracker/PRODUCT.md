# Smart Buy-List & Unit Price Tracker — Product

> Tool-specific product truth. Inherits the collection's shared truth from
> [`../../PRODUCT.md`](../../PRODUCT.md). Domain glossary: [`CONTEXT.md`](./CONTEXT.md).
> Bilingual guide: [`I18N.md`](./I18N.md). Decisions: [`docs/adr/`](./docs/adr/).
> Version: **v4.0.0**.

## What it is

A standalone, **mobile-first Progressive Web Application** for grocery and household shopping. It
manages a multi-store buy-list, tracks a historical purchase ledger, **normalizes package prices to
a unit price** so items are comparable across packs and stores, and gives **in-aisle deal
intelligence**. It works **offline** and can sync across devices through user-supplied cloud
storage. No vendor account is required to use the core tool.

## User & job-in-context

**User:** a Vietnamese-speaking household shopper (VND, `vi`-first) on or planning a grocery
trip, primarily **on a phone** (English available).

**Job-in-context:** "Build my list for this trip across my stores, **is this shelf price a good
deal versus what I've paid before and what other stores charge?**, and remember it next time." The
user plans (Planning mode) and executes (Buy mode) a multi-store trip, compares packages by
**normalized unit price** ($/kg, $/L, $/ea), records purchases into a **ledger**, and sees a
**Deal Rating** (great / fair / spike). The app is a PWA: installable and usable offline, with
optional cloud sync.

## What it makes possible / mechanism

- **Measurement normalization & deal scoring** — every package reduces to a normalized unit price
  with deterministic Deal Ratings: 🟢 great (≤ all-time low or ≥10% below average), 🟡 fair
  (±5% of average), 🔴 spike (≥10% above) (ADR-0002).
- **Mobile-first PWA** — service worker lifecycle, cache-first offline, manifest + maskable icons,
  single-source versioning (ADR-0003, 0007, 0015).
- **Persistent storage on IndexedDB** with a cloud-sync seam (Google Drive / GitHub Gist) using a
  **deterministic 3-way merge, deletion tombstones, and mutation concurrency** so multi-device use
  is safe and resumable (ADR-0001, 0011, 0012, 0016, 0019–0025).
- **Material You navigation + an in-aisle item comparator** and **multi-store management**
  (grouping, swipe gestures, dedicated store filter chips, quick-add store picker) (ADR-0004, 0005,
  0018, 0020).
- **Differentiated Planning vs. Buy-mode card UX** and a unified trip-completion bar (ADR-0006,
  0021, 0022).
- **Vietnamese-first defaults, a smart omnibox, and currency ergonomics** (ADR-0013, 0014);
  **URL payload compression** for shareable buy-lists; **clipboard JSON interchange**; full item
  edit, streamlined planning card, and **CSP + innerHTML input sanitization** for security
  (ADR-0009/0018, 0010, 0017, 0022–0024).

## Durable constraints specific to this tool

- **Mobile-first PWA is the primary surface.** Keep it touch-first, installable, and offline;
  Material You is the navigation identity. Do not regress offline or touch ergonomics.
- **Deal-scoring thresholds are product semantics** (great/fair/spike bands above) — they drive
  the user's decisions; don't silently change them.
- **Cloud sync is optional and reslient** — a sync failure (e.g. GitHub 403/rate-limit) must
  degrade gracefully, never block core use; 3-way merge + tombstones + concurrency are the
  invariants (ADR-0016, 0019, 0020, 0021).
- **Security posture:** CSP meta tag + innerHTML sanitization + IndexedDB/PAT migration are
  durable (ADR-0024, 0025). Preserve them when editing rendering.
- **Vietnamese-first defaults** with full bilingual vi+en parity.
- Inherit collection constraints: single-file/zero-backend runtime, tool isolation, dual-path
  build, WCAG 2.1 AA/AAA, GitHub Flow + TDD.

## Durable assets & sources of truth

- [`CONTEXT.md`](./CONTEXT.md) — ubiquitous language (Master Item, List Item, Package Size,
  Normalized Unit Price, Historical Purchase Ledger, All-Time Low, Deal Rating, …).
- [`I18N.md`](./I18N.md), `icon.svg`, `icon-180.png`, maskable PWA icons, `og-image.png`,
  `manifest.webmanifest`, `sw.js`, [`docs/adr/`](./docs/adr/) (0001–0025),
  [`ITEMS_TO_IMPLEMENT.md`](./ITEMS_TO_IMPLEMENT.md), [`TEST_PLAN.md`](./TEST_PLAN.md).
- Tests: `tests/smart-buy-list-*.test.js` (unit-price, storage, lifecycle, comparator, sharing,
  i18n, Material You, pacing, clipboard, scanner, cloud-sync, concurrency).
