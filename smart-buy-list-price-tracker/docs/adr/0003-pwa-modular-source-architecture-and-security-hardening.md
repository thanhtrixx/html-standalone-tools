# ADR-0003: PWA Modular Source Architecture and Security Hardening

> **Status:** Accepted  
> **Supersedes:** Legacy ADRs 0003, 0007, 0015, 0024, 0027, 0031

---

## Context

A production-grade Progressive Web App running client-side requires modular maintainability, offline service worker caching, automated update lifecycles, single-source versioning, and rigorous Content Security Policy (CSP) enforcement.

---

## Decisions

### 1. Modular Source Architecture & Unidirectional State Container

- Domain logic, storage providers, parsers, and UI components are organized into modular, decoupled JavaScript source modules with strict JSDoc contracts.
- Central state store dispatches actions and notifies subscribers, preventing state desynchronization.

### 2. Progressive Web App (PWA) Lifecycle & Service Worker

- `sw.js` caches static assets (app shell, CDN dependencies, manifest, icons) for 100% offline capability.
- **Update Notification Strategy**: When a new service worker version is detected, a non-intrusive toast informs the user with a 1-tap reload button (`skipWaiting()`).

### 3. Companion Asset Compaction & Single-Source Versioning

- Version numbers across `package.json`, `index.html`, `manifest.json`, and `sw.js` are synchronized from a single source of truth.
- `scripts/compact.js` inlines or packages companion assets into `dist/smart-buy-list-price-tracker/`.

### 4. Security Hardening & Content Security Policy (CSP)

- Strict CSP configured in `<meta http-equiv="Content-Security-Policy">` and `_headers`:
  - `default-src 'self'`; allows CDN scripts (`cdn.tailwindcss.com`, `cdn.jsdelivr.net`) and GitHub API endpoints.
  - `script-src 'self' 'unsafe-inline'` without eval.
- **XSS Prevention**: Strict HTML escaping on all user-supplied item names, notes, and store aliases before rendering; forbids unsanitized `innerHTML`.

---

## Consequences

- **Positive**: High code maintainability, bulletproof offline performance, strong resistance to XSS vulnerabilities.
- **Trade-off**: Requires running compaction builds before deploying distribution releases.
