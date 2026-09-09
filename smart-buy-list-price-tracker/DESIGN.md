---
name: "Smart Buy-List & Unit Price Tracker"
description: "Mobile-first PWA design system: a Material You emerald-on-slate tonal system with a sticky app bar, bottom navigation, and in-aisle deal badges."
colors:
  primary: "#10b981"
  primary-strong: "#059669"
  primary-soft: "#34d399"
  primary-faint: "#6ee7b7"
  primary-tint: "#ecfdf5"
  on-primary: "#ffffff"
  secondary: "#1e3a47"
  on-secondary: "#c4e7ff"
  surface: "#0f172a"
  surface-container: "#1e293b"
  surface-elevated: "#334155"
  surface-lowest: "#0b1120"
  on-surface: "#f8fafc"
  on-surface-variant: "#94a3b8"
  outline: "#334155"
  outline-variant: "#475569"
  paper: "#ffffff"
  deal-great: "#047857"
  deal-fair: "#f59e0b"
  deal-spike: "#dc2626"
  light-surface: "#f1f5f9"
  light-border: "#e2e8f0"
  light-border-subtle: "#cbd5e1"
  light-text-muted: "#64748b"
  light-deal-great-text: "#065f46"
  light-deal-great-border: "#a7f3d0"
  light-deal-fair-bg: "#fffbeb"
  light-deal-fair-text: "#92400e"
  light-deal-fair-border: "#fde68a"
  light-deal-spike-bg: "#fef2f2"
  light-deal-spike-text: "#991b1b"
  light-deal-spike-border: "#fecaca"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  card: "12px"
  surface: "16px"
  lg: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "16px 12px"
  button-icon:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    size: "32px"
  deal-badge:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  item-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.surface}"
    padding: "16px"
  bottom-nav:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-variant}"
---

# Design System: Smart Buy-List & Unit Price Tracker

## Overview

**Creative North Star: "The In-Aisle Tonal Navigator"**

The tracker wears a **Material You** costume over a dark, high-contrast retail surface.
It is a mobile-first PWA built for one-handed use in a store aisle: a sticky app bar
pins the brand and quick actions at the top, a centered column carries the working
list, and a fixed bottom navigation switches the app between planning, in-store buying,
price history, and comparison.

The identity is **emerald on slate**. A cool slate base (the darkest surface is the page,
with cards and containers stepping up in tone) carries a single saturated emerald as the
brand and primary-action accent. There is no decorative graphic language — the visual
weight is the data. Color is spent almost entirely on two jobs: signaling the **deal
rating** of each item (great, fair, spike) and marking the **active** navigation state.
Everything else is tonal slate and a muted secondary text color.

The system is **tonal, not shadowed**. Depth is mostly expressed by stepping up the
surface tone (surface-lowest, surface, surface-container, surface-elevated) rather than by
drop shadows, which are kept subtle. Surfaces that float over content — the app bar, the
bottom navigation, modals — use a translucent fill with a backdrop blur, a Material 3
surface pattern.

It ships **two themes**: dark is canonical and is the default (the document opens in dark
mode and the browser chrome is themed slate), while a light theme inverts the palette to
paper surfaces with slate text. The dark theme reads as the design's true voice; the light
theme is a faithful inversion for daylight use.

The type is **native system sans**, with a few bold, tight-tracked headers as the only
display treatment. The rhythm is the utility scale by default; the distinctive moves are a
small, tightly-tracked title and micro labels, not a custom typeface.

**Key Characteristics:**

- Single centered mobile column (max 480px) preserving in-aisle thumb reach.
- Emerald primary accent strictly rationed for active navigation pills and key completion CTAs.
- High-contrast, glanceable deal badges (Great Deal, Fair Price, Price Spike) as the sole repeated chromatic accents.
- Tonal surface stratification over heavy drop shadows with translucent backdrop blurs for floating bars.
- Instant, zero-latency PWA experience using platform system fonts and offline-first IndexedDB persistence.

## Colors

The palette is a **tonal emerald-on-slate system**. It is built from three families: a
single emerald brand ramp, a cool slate neutral ramp, and a small set of semantic
deal-rating colors.

### Primary

- **Emerald Mint** (`#10b981`): The brand accent for active tabs and glanceable deal highlights.
- **Emerald Strong** (`#059669`): Filled primary action buttons (Complete Trip, Save).
- **Emerald Soft** (`#34d399`): Deal badge highlight text and positive unit-price deltas.
- **Emerald Faint** (`#6ee7b7`): Subtle border accents on active interactive components.
- **Emerald Tint** (`#ecfdf5`): Light-mode ambient washes.
- **On-Primary** (`#ffffff`): Text and icons on solid primary buttons.

### Secondary

- **Deep Steel Blue** (`#1e3a47`): Secondary container background and muted badge fills.
- **On-Secondary** (`#c4e7ff`): Text on secondary containers.

### Neutral

- **Surface Lowest** (`#0b1120`): Page canvas and deepest background backdrop.
- **Surface** (`#0f172a`): Default resting card and container surface.
- **Surface Container** (`#1e293b`): Raised panels, input fields, and icon button backgrounds.
- **Surface Elevated** (`#334155`): Hovered cards, dialogs, and prominent floating surfaces.
- **On-Surface** (`#f8fafc`): High-contrast primary text and active icons.
- **On-Surface Variant** (`#94a3b8`): Secondary text, timestamps, and inactive navigation labels.
- **Outline** (`#334155`): Default container and card boundary borders.
- **Outline Variant** (`#475569`): Emphasized section dividers and active input strokes.
- **Paper** (`#ffffff`): Inverted background surface for light mode.

### Semantic Deal Ratings

- **Deal Great** (`#047857` / `#34d399`): Better than historical median — reads as "buy now".
- **Deal Fair** (`#f59e0b` / `#fbbf24`): Within normal historical variance — reads as "standard price".
- **Deal Spike** (`#dc2626` / `#f87171`): Substantially above historical average — reads as "overpriced".

### Named Rules

**The Scarcity Rule.** Emerald is strictly reserved for the active navigation state and primary action CTAs. It covers ≤5% of screen area so it never loses its guiding power.
**The Deal Isolation Rule.** Green, amber, and red are solely dedicated to deal-rating badges and unit-price comparison indicators; they are strictly prohibited as decorative tints.

## Typography

**Display Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`  
**Body Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`  
**Label/Caption Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

**Character:** Utilitarian, crisp, and glanceable under supermarket fluorescent lighting. Uses native system sans to guarantee zero-latency offline loading.

### Hierarchy

- **Display** (700, 18px, line-height 1.25, tracking -0.025em): Pinned app bar title and major modal headings.
- **Body** (400, 14px, line-height 1.5): Working grocery item titles, notes, and regular content.
- **Label** (600, 12px, line-height 1.2): Navigation tabs, button labels, and omnibox action tags.
- **Caption** (500, 11px, line-height 1.2): Normalized unit prices (`$/kg`, `$/L`), ATL deltas, and deal chips.

### Named Rules

**The Zero-Webfont Rule.** All typographic styles must rely on the platform's native system sans stack. No external webfonts may be loaded over network pipes.
**The Tight-Display Rule.** Negative letter-spacing (`-0.025em`) is confined strictly to Display titles; Body and Caption type must never be negatively tracked.

## Layout

The layout is a **single centered column** (max-width 480px on mobile, holding its centered column posture on tablet/desktop) with a **fixed top app bar** and a **fixed bottom navigation**, optimized for one-handed thumb navigation.

### Structure

- Pinned translucent app bar (`48px` - `56px` height) containing branding and quick utility actions.
- Scrollable list viewport with vertical card rhythm (`gap: 8px` to `12px`).
- Fixed bottom navigation bar (`64px` height) thumb-reachable at the viewport base.

### Named Rules

**The In-Aisle Column Rule.** The interface must never reflow into a multi-column desktop dashboard. The centered, phone-width column is an invariant that preserves thumb ergonomics across all device viewports.

## Elevation & Depth

Depth is **tonal, not shadowed** — following Material 3 principles where surface tint indicates hierarchy.

### Surfaces

- `surface-lowest` (`#0b1120`): Canvas base.
- `surface` (`#0f172a`): Cards at rest.
- `surface-container` (`#1e293b`): Active input boxes, controls, and chips.
- `surface-elevated` (`#334155`): Modals, drawers, and active hover states.

### Shadows

- **Resting:** `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3)` on cards.
- **Upward Lift:** `box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.25)` on the fixed bottom navigation bar.
- **Modal Lift:** `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5)` on popovers and bottom sheets.

### Named Rules

**The Tone Over Shadow Rule.** Layering must be established by stepping surface tones upward. Shadows are subtle state embellishments, never structural separators.

## Shapes

The form language is **tactile, soft, and rounded**, matching Material You.

### Corners

- **Pill (`9999px`):** Used for navigation icon indicator slots, action pills, and deal chips.
- **Card (`12px`):** Default radius for grocery item cards and comparator panels.
- **Surface (`16px`):** Used for modal dialog shells and bottom-sheet containers.
- **Small (`6px`):** Compact badges and micro chips.
- **Medium (`8px`):** Action buttons, input containers, and icon buttons.

## Components

### App bar (top, sticky)

- **Shape:** Full width, bottom border `1px solid {colors.outline}`.
- **Surface:** Translucent `{colors.surface}` with `backdrop-filter: blur(12px)`.
- **Actions:** Icon buttons (`36px` square) with subtle hover lift.

### Bottom navigation (M3, fixed)

- **Shape:** Full width with centered 480px constraint, top border `1px solid {colors.outline}`.
- **Tabs:** Pill slot (`44px × 26px`) over label. Active tab features emerald pill fill `rgba(16, 185, 129, 0.2)` and emerald label text.

### Deal badge

- **Shape:** Rounded chip (`rounded.sm: 6px`), padding `3px 8px`.
- **Variants:**
  - _Great Deal:_ Background `rgba(4, 120, 87, 0.25)`, text `{colors.primary-soft}`, border `1px solid rgba(52, 211, 153, 0.4)`.
  - _Fair Price:_ Background `rgba(245, 158, 11, 0.2)`, text `#fbbf24`, border `1px solid rgba(251, 191, 36, 0.4)`.
  - _Price Spike:_ Background `rgba(220, 38, 38, 0.2)`, text `#f87171`, border `1px solid rgba(248, 113, 113, 0.4)`.

### Item card (swipeable)

- **Shape:** Rounded card (`rounded.card: 12px`), surface fill `{colors.surface}`, border `1px solid {colors.outline}`.
- **Content:** Item title and package size on left; total price and normalized unit price (`$/kg`, `$/L`) on right.
- **Swipe actions:** Left swipe reveals delete action (indigo/red tone); right swipe reveals check/done action (emerald tone).

### Primary button

- **Shape:** Rounded pill (`rounded.md: 8px`), padding `12px 20px`.
- **Fill:** `{colors.primary-strong}` with `{colors.on-primary}` text.
- **States:** Hover lifts to `{colors.primary}`, active triggers `scale(0.98)`.

### Icon button

- **Shape:** Rounded square (`rounded.md: 8px`), `36px × 36px`.
- **Fill:** `{colors.surface-container}` with `1px solid {colors.outline}`.

## Do's and Don'ts

### Do:

- **Do** spend emerald on the active state and primary actions only; keep the accent scarce so it stays meaningful.
- **Do** express depth by tonal surfaces, stepping from `surface-lowest` up to `surface-elevated` to separate layers.
- **Do** let the deal badge carry semantic color (green, amber, red) exclusively for price verdicts.
- **Do** keep everything rounded and thumb-first with card/pill radii and bottom navigation.
- **Do** hold the centered mobile column on larger screens to preserve the in-aisle posture.

### Don't:

- **Don't** tint general cards emerald — that dilutes the primary action and deal signal.
- **Don't** stack heavy drop shadows — the system is tonal, not shadowed.
- **Don't** reuse green, amber, or red for decorative accents, breaking the glanceable price reading.
- **Don't** introduce sharp corners or top hamburger menus that break the Material You one-handed model.
- **Don't** reflow into a wide multi-column desktop dashboard that violates the in-aisle shopping posture.
