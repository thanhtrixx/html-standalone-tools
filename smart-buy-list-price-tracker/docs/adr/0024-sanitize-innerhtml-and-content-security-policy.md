# ADR-0024: innerHTML User Input Sanitization & Content-Security-Policy Meta Tag

## Status

Accepted (v4.0.0 / Security Hardening)

## Context

A security review identified two P0 defense-in-depth vectors in the Smart Buy-List single-file client application:

1. **Unsanitized `innerHTML` String Interpolation (XSS Risk)**:
   - Dynamic UI template generators (`renderItemCard`, `renderPriceLedgerTable`, `renderStoreManagerList`, `renderStoreFilterChips`, `renderApp` store grouping headers, and `handleItemAutocomplete`) interpolated user-provided strings directly into `innerHTML` HTML templates.
   - User inputs such as item names (`<img onerror=alert(1)>`), custom store names (`<script>alert(1)</script>`), measurement units, or shared buy-list payloads could trigger arbitrary script execution in untrusted contexts (e.g. importing malicious shared lists via `#share=` or JSON clipboard).

2. **Absence of Content Security Policy (CSP)**:
   - The application `<head>` lacked a `<meta http-equiv="Content-Security-Policy">` tag, leaving script execution and network connection boundaries unrestricted on modern browsers.

---

## Decisions

### 1. Robust `sanitizeHTML(str)` Utility Seam

We introduce a canonical, high-performance HTML entity encoder:

```javascript
function sanitizeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

- Handles `null`, `undefined`, numbers, and strings deterministically.
- Applied at the seam in all dynamic template rendering functions:
  - `renderItemCard(item)`: Item names, units, and interactive `aria-label` attributes.
  - `renderPriceLedgerTable(query)`: Historical item names, stores, units, dates, and ARIA labels.
  - `renderStoreManagerList()`: Custom store names and ARIA action labels.
  - `renderStoreFilterChips()`: Store labels, data keys, and ARIA labels.
  - `renderApp()`: Store grouping headers (`sName`).
  - `handleItemAutocomplete(val)`: Search suggestion buttons and query values.
- Exported globally via `window.sanitizeHTML = sanitizeHTML` for standalone testability.

### 2. Strict Declarative Content Security Policy (CSP) Meta Tag

We declare a Content Security Policy in `<head>` via `<meta http-equiv="Content-Security-Policy">`:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://accounts.google.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' data: blob: https://trile.dev https://*.googleusercontent.com https://avatars.githubusercontent.com; connect-src 'self' https://api.github.com https://www.googleapis.com https://accounts.google.com https://cloudflareinsights.com https://static.cloudflareinsights.com; font-src 'self' data:; manifest-src 'self';"
/>
```

#### Whitelist Directives & Justifications:

- **`default-src 'self'`**: Restricts all unlisted resource types to the origin.
- **`script-src`**:
  - `'self' 'unsafe-inline' 'unsafe-eval'`: Allows standalone inline vanilla script and dynamic runtime calculations.
  - `https://cdn.tailwindcss.com`: Required for Tailwind Play CDN JIT stylesheet runtime.
  - `https://accounts.google.com`: Required for Google Identity Services (GSI) OAuth 2.0 client library.
  - `https://static.cloudflareinsights.com`: Required for Cloudflare Web Analytics beacon.
- **`style-src`**: `'self' 'unsafe-inline' https://cdn.tailwindcss.com` for inline utility styles.
- **`img-src`**: `'self' data: blob: https://trile.dev https://*.googleusercontent.com https://avatars.githubusercontent.com` for local icons, data URLs, social preview assets, Google user profile avatars, and GitHub user avatars.
- **`connect-src`**:
  - `'self'`: Local storage and same-origin assets.
  - `https://api.github.com`: Required for GitHub Gist Cloud Sync provider.
  - `https://www.googleapis.com`: Required for Google Drive AppData Cloud Sync provider.
  - `https://accounts.google.com`: Required for Google OAuth token validation.
  - `https://cloudflareinsights.com` & `https://static.cloudflareinsights.com`: For analytics beacon pings.
- **`font-src 'self' data:`**: Local and embedded fonts.
- **`manifest-src 'self'`**: Standalone PWA webmanifest.

---

## Consequences

### Positive

- Prevents stored and reflected XSS attacks from crafted grocery payloads, imported share links, and malicious store names.
- Blocks unauthorized external script injection and unauthorized network exfiltration via declarative browser enforcement.
- Preserves 100% offline functionality, Google Drive sync, and GitHub Gist sync without regressions.

### Trade-offs

- Inline `<script>` and CDN evaluation requires `'unsafe-inline'` and `'unsafe-eval'` under current zero-build standalone HTML architecture. In future compiled pipelines, nonces or sha256 hashes can further tighten this policy.
