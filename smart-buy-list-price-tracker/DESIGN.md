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
  "button-primary":
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "16px 12px"
  "button-icon":
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    size: "32px"
  "deal-badge":
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  "item-card":
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.surface}"
    padding: "16px"
  "bottom-nav":
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-variant}"
---

## Overview

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

## Colors

The palette is a **tonal emerald-on-slate system**. It is built from three families: a
single emerald brand ramp, a cool slate neutral ramp, and a small set of semantic
deal-rating colors.

### Foundations

- **Primary** (emerald) is the brand and the accent for primary actions and the active
  navigation state. It reads as a fresh, "good deal" green — fitting for a price tracker.
  The brand carries a full ramp: a faint tint for washes, a soft mid tone for accents, a
  saturated base for emphasis, and a deeper strong tone for solid buttons (which stay
  legible with on-primary text). On the dark surface the primary reads as a bright mint;
  on light it deepens to a forest green.
- **On-primary** is white, used for text and icons on solid primary buttons.
- **Secondary** is a cool teal-blue used for secondary containers; **on-secondary** is a
  light blue used on top of it.
- **Surface** (the slate base) steps up through **surface-container**, **surface-elevated**,
  and **surface-lowest** to build depth by tone. **On-surface** is near-white and
  **on-surface-variant** is a muted slate for secondary text and inactive navigation labels.
- **Outline** and **outline-variant** are the border and divider tones; in light theme they
  invert to a light gray on paper.

### Semantic

- **Deal-great**, **deal-fair**, and **deal-spike** are the three colors of the deal
  intelligence layer — green, amber, and red — each rendered as a small tinted chip
  (a deep background wash, a bright text tone, and a faint same-hue border).
- The **deal badge** chips are the most repeated accent in the UI; they are the place
  color is deliberately spent, so no other surface competes with them.
- **Paper** is the light-theme surface; the light theme is a full inversion where slate
  becomes the text color and paper becomes the surface.

### Application

- Emerald primary marks the **primary action** (e.g., share) and the **active** navigation
  pill; everything inactive is slate.
- The deal rating (great / fair / spike) is the **only semantic color** beyond navigation;
  it is reserved for item-level price verdicts and used nowhere else.
- The light theme keeps the same emerald voice but deepens primary for contrast on paper
  and swaps slate text for paper surfaces; secondary containers shift to a light blue wash.

## Typography

Type is **native system sans** — the platform's own font stack, with no web font loaded,
which keeps the PWA instant and is right for a fast, transactional in-aisle tool.

### Hierarchy

The scale is the default utility scale; the hierarchy is established by **weight and
tracking**, not by a wide range of sizes.

- **Display** is a small, tightly-tracked title (bold, tight line height, negative tracking)
  used for the app title and section headings — compact and assertive, not a large hero.
- **Body** is the default size at a comfortable reading line height for the working text of
  items and summaries.
- **Label** is a small, semibold size used for navigation labels, captions, and section
  eyebrows; micro labels run one step smaller for dense badges and metrics.

### Personality

The personality is **utilitarian and legible at a glance**. Bold, tight-tracked titles give
a crisp product feel; the small type and the system font keep it fast and familiar. There
is no decorative type — the system optimizes for speed and clarity in a noisy, one-handed
context.

### Application

- The system font stack is used everywhere; do **not** introduce a web font, which would
  break the instant-load PWA promise.
- Titles use tight tracking and bold weight; do **not** apply negative tracking to body or
  labels, where it hurts legibility.
- Micro type is reserved for **dense, secondary** data (badges, metrics); primary content
  stays at body size.
- The emerald subtitle under the title is the one place a brand accent touches type.

## Layout

The layout is a **single centered column** with a **fixed top app bar** and a **fixed
bottom navigation**, optimized for one-handed mobile use with room to grow on a wider
screen.

### Structure

- The working content sits in a **centered, max-width column** so it reads as a phone-width
  surface even on a tablet or desktop — the app is mobile-first and never goes wide.
- A **sticky, translucent app bar** pins the brand and quick actions (language, theme,
  share, settings) at the top, floating with a backdrop blur over the scrolling list.
- A **fixed bottom navigation** pins the mode switch (planning, in-store, price history,
  compare) within the same centered column, reachable by the thumb.
- Sections stack vertically with a consistent gap; each section is a card on a tonal
  surface.

### Grid & Gutters

- A single column; no multi-column grid. Gutters and padding follow the spacing scale
  (a compact gutter on mobile that loosens on larger screens).
- Cards and sections use a consistent inner padding; the bottom navigation and app bar share
  the same centered max width so they align vertically.

### Rhythm

- Vertical rhythm is set by a consistent gap between stacked sections and a compact inner
  padding on cards.
- The spacing scale is the utility default; small increments (a half-step and a
  quarter-step) are used for tight groups like badges and icon clusters.
- Generous padding is reserved for the app bar and section headers; dense lists use compact
  padding.

### Responsiveness

- Mobile-first: the design is correct at phone width and only **loosens** on larger screens
  (more padding, more gap, two-word labels revealed). It does not restructure into
  columns.
- Labels that are hidden on mobile (two-word button text) appear on wider screens; emoji
  glyphs stand in for text on the smallest widths.
- The bottom navigation and app bar stay fixed on all sizes, centered within the column.

## Elevation & Depth

Depth is **tonal, not shadowed** — a core Material 3 principle the tracker follows
faithfully.

### Surfaces

- The base is **surface-lowest** (the darkest), with **surface** (cards and app bar),
  **surface-container**, and **surface-elevated** stepping up in tone to indicate
  layering.
- Cards sit on the base as **surface** panels with a **card** radius and a faint border;
  raised states step to **surface-elevated**.
- Floating elements (app bar, bottom navigation, modals) use a **translucent fill with a
  backdrop blur** over the content, a Material 3 surface pattern, with a soft shadow on the
  light theme only.

### Shadows

- Shadows are **subtle and sparing**. A small shadow is the default for cards; a medium or
  strong shadow is reserved for modals and the floating action.
- The bottom navigation casts a **soft upward shadow** in light mode to separate it from the
  content; in dark mode the tone change alone provides the separation.
- The primary button carries a faint shadow for a slight lift.

### Effects

- **Backdrop blur** is the signature effect: the app bar and bottom navigation are
  translucent and blur the content behind them, keeping them legible while scrolling.
- Swipe actions on item cards reveal **tinted backgrounds** (a green "done / undo" side and
  an indigo "delete" side) behind the card as it slides — color as an action cue, not
  decoration.
- Hover states are tonal (a card brightens to **surface-elevated**) on pointer devices and
  are no-ops on touch.

## Shapes

The shape language is **soft and rounded**, a Material You signature: almost everything is a
rounded surface, from pills to large cards.

### Corners

- **Pill** radius is used for **chips, badges, and the navigation icon slots** — fully
  rounded.
- **Card** radius is the default for **list items and compact controls** — the most common
  radius in the UI.
- **Surface** radius is used for **larger panels and section containers** — slightly larger
  than the card radius for a softer, more Material feel.
- **Small** and **medium** radii serve tight elements (badges, inputs, icon buttons).
- The largest radius is reserved for **rare, prominent containers**.

### Silhouette

- The overall silhouette is **soft, rounded, and flat** — no sharp corners, no heavy
  bevels. The rounded pills and large card radii give a friendly, tactile feel that suits a
  consumer shopping tool.
- Translucent floating surfaces (app bar, bottom nav) read as **floating pills / bars** over
  the content.
- The one structural break in the roundness is the **fixed bars** (app bar and bottom nav),
  which are full-width and square-edged against the screen edges.

### Iconography

- Icons are **emoji glyphs** (a shopping cart, a pencil, a chart) — simple, universal, and
  zero-cost, fitting a fast standalone PWA. They are large and clear, not fine line icons.
- Glyphs sit inside **rounded pill slots** in the bottom navigation, with a label beneath.
- Emoji stand in for two-word button labels on the smallest widths and are hidden when the
  text label appears on wider screens.
- No custom icon set or decorative illustration language — the system is utilitarian and
  self-contained.

## Components

These are the components that carry the identity. Markup below is illustrative and token
driven; the implementation maps these to Tailwind utilities and CSS variables. Each lists
the states that matter.

### App bar (top, sticky)

The brand and quick actions, pinned and translucent over the scrolling list.

```html
<header class="app-bar">
  <div class="app-bar__inner">
    <div class="app-bar__brand">
      <span class="glyph" aria-hidden="true"></span>
      <h1 class="app-bar__title">Smart Buy-List</h1>
      <p class="app-bar__subtitle">Unit Price &amp; Deal Tracker</p>
    </div>
    <div class="app-bar__actions">
      <button class="icon-button" aria-label="Language"></button>
      <button class="icon-button" aria-label="Theme"></button>
      <button class="primary-button">Share</button>
      <button class="icon-button" aria-label="Settings"></button>
    </div>
  </div>
</header>
```

Usage: pinned to the top on every screen, centered to the same max width as the content.
The title is tight-tracked bold; the subtitle is the single emerald accent on type.

- Resting: translucent surface, medium backdrop blur, a bottom border, a faint shadow.
- Scrolled: same, blur holds; the list scrolls behind the translucent fill.
- Light theme: fill flips to a near-opaque paper, text to slate, border to a light gray.

### Bottom navigation (M3, fixed)

The mode switch, a fixed pill-bar reachable by the thumb. Each tab is a pill icon slot
over a label; the active tab carries the emerald accent.

```html
<nav class="bottom-nav" role="tablist" aria-label="Main Navigation">
  <button class="bottom-nav__tab is-active" role="tab" aria-selected="true">
    <span class="glyph bottom-nav__icon"></span>
    <span class="bottom-nav__label">Planning</span>
  </button>
  <button class="bottom-nav__tab" role="tab" aria-selected="false">
    <span class="glyph bottom-nav__icon"></span>
    <span class="bottom-nav__label">Buy Mode</span>
  </button>
  <button class="bottom-nav__tab" role="tab" aria-selected="false">
    <span class="glyph bottom-nav__icon"></span>
    <span class="bottom-nav__label">Price History</span>
  </button>
</nav>
```

Usage: fixed to the bottom, centered to the content column, switching trip phases and
opening modals.

- Inactive: muted on-surface-variant label, neutral pill slot.
- Active: emerald label with a tinted emerald pill slot behind the glyph.
- Light theme: fill flips to near-opaque paper with a soft upward shadow for separation.

### Deal badge

The single most repeated accent — the per-item price verdict. Three variants only.

```html
<span class="deal-badge deal-badge--great">
  <span class="glyph deal-badge__icon" aria-hidden="true"></span>
  <span class="deal-badge__label">Great Deal</span>
</span>
```

Usage: inline, right-aligned on each item card; a compact tinted chip (small radius,
micro type, bold) with a deep background wash, a bright same-hue label, and a faint
same-hue border.

- Great deal: emerald family — reads as "buy now."
- Fair price: amber family — reads as "wait, it is normal."
- Price spike: red family — reads as "avoid, it is overpriced."
- Mobile: shows the glyph only; wider screens reveal the text label.

### Item card (swipeable)

The core list item — a tonal panel with a swipe-to-act reveal behind it.

```html
<article class="item-card">
  <div class="item-card__reveal item-card__reveal--done"></div>
  <div class="item-card__reveal item-card__reveal--delete"></div>
  <div class="item-card__content">
    <span class="glyph"></span>
    <div class="item-card__meta">
      <h3 class="item-card__name">Organic Coffee</h3>
      <span class="deal-badge deal-badge--great">Great Deal</span>
    </div>
  </div>
</article>
```

Usage: one per list line, stacked in the centered column; the content slides over two
hidden tinted backgrounds.

- Resting: surface fill, a card radius, a faint border and small shadow, no reveal shown.
- Swiping right: a green "done / undo" background peeks out from the left edge.
- Swiping left: an indigo "delete" background peeks out from the right edge.
- Raised / hover: steps to the elevated surface tone on pointer devices.

### Primary button

The main call to action (e.g., Share, Complete Trip) — a solid emerald pill with a faint
lift.

```html
<button class="primary-button">
  <span class="glyph" aria-hidden="true"></span>
  <span class="primary-button__label">Share</span>
</button>
```

Usage: a compact solid control; the label is hidden on the smallest widths, leaving the
glyph.

- Default: emerald-strong fill, on-primary text, medium radius, faint shadow.
- Hover: lifts to the brighter emerald.
- Icon-only: square icon size, glyph centered, no label.

### Icon button

The compact square control for quick actions (language, theme, settings).

```html
<button class="icon-button" aria-label="Toggle theme">
  <span class="glyph" aria-hidden="true"></span>
</button>
```

Usage: a small square button in the app bar; neutral, never emerald.

- Default: surface-container fill, a medium radius, a faint border, on-surface glyph.
- Hover: steps to the elevated surface tone.
- Active: a slightly deeper fill while pressed.

## Do & Don'ts

Do:

- Spend emerald on the active state and primary actions only — Do keep the accent scarce
  so it stays meaningful. Don't: tint every card emerald — that dilutes the "this is the
  one" signal.
- Express depth by tonal surfaces — Do step surface-lowest up to surface-elevated to
  separate layers. Don't: stack heavy drop shadows — the system is tonal, not shadowed.
- Let the deal badge carry semantic color — Do use green/amber/red for the price verdict
  and nowhere else. Don't: reuse those hues for decorative accents, which would break the
  "green means buy" reading.
- Keep everything rounded and thumb-first — Do use the card and pill radii and a bottom
  navigation. Don't: introduce sharp corners or a top hamburger menu, which fight the
  Material You language and the one-handed context.
- Hold the centered mobile column — Do keep content phone-width on larger screens. Don't:
  reflow into a wide multi-column dashboard — that breaks the in-aisle posture.

## Narrative

The tracker began as a dense, dark retail dashboard and was redesigned into a Material You
experience so a shopper can plan a trip, walk the aisles, and settle scores without looking
at a screen for long. The move was from a busy, multi-panel view to a **single, centered,
tonal column** with one accent color and a thumb-reachable bottom navigation. The dark
slate base made the data pop and the emerald "good deal" reading immediate; the light theme
was added later as a faithful inversion for daylight. Depth was deliberately pushed to
**tone rather than shadow**, and the one place color is spent — the per-item deal verdict —
was isolated so it reads instantly from across the store. The result is a fast, self-
contained, one-handed tool where the visual system does the thinking for you: green means
buy, the active tab is where you are, and everything else recedes.
