---
name: Atomic Habit & Routine Tracker
description: Mobile-first standalone PWA for atomic habit building, daily routine clustering, and mathematical consistency scoring.
colors:
  primary: "#10b981"
  primary-hover: "#059669"
  canvas-dark: "#020617"
  surface-dark: "#0f172a"
  surface-sheet-dark: "#1e293b"
  border-dark: "#1e293b"
  text-primary-dark: "#f8fafc"
  text-muted-dark: "#94a3b8"
  canvas-light: "#f8fafc"
  surface-light: "#ffffff"
  border-light: "#e2e8f0"
  text-primary-light: "#0f172a"
  text-muted-light: "#64748b"
  accent-indigo: "#6366f1"
  accent-amber: "#f59e0b"
  accent-crimson: "#ef4444"
  accent-violet: "#8b5cf6"
  accent-cyan: "#06b6d4"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "0.375rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary-dark}"
    rounded: "{rounded.xl}"
    padding: "0.75rem 1.25rem"
  card-habit:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-primary-dark}"
    rounded: "{rounded.xl}"
    padding: "0.875rem 1rem"
  bottom-dock:
    backgroundColor: "rgba(2, 6, 23, 0.95)"
    textColor: "{colors.text-muted-dark}"
    padding: "0.5rem 0.75rem"
---

# Design System: Atomic Habit & Routine Tracker

## Overview

**Creative North Star: "The Circadian Sanctuary"**

The Atomic Habit & Routine Tracker is designed as a calm, distraction-free cockpit for building life-changing daily rituals. Set against a deep OLED slate canvas (`#020617`), the interface recedes into the background so personal intention, streak momentum, and routine completion take center stage. Every visual element evokes focus, precision, and organic vitality, avoiding the aggressive gamification, loud confetti noise, or corporate dashboard clutter common in generic habit apps.

Motion and micro-interactions are tactile, fluid, and purposeful: interactive progress rings animate with zero-latency spring physics, check-ins trigger subtle micro-haptic taps (`15ms`), and daily completion honors the user with an elegant, non-intrusive victory state. The application operates with dual-theme parity (Dark-OLED default and high-contrast clean Light mode), ensuring optimal readability whether logging a morning meditation at sunrise or reviewing evening wind-down habits before sleep.

**Key Characteristics:**

- **Atmospheric OLED Depth:** Deep slate tonal planes layered with frosted glassmorphic navigation bars (`backdrop-filter: blur(16px)`).
- **Circadian Routine Rhythm:** Temporal routine groupings (🌅 Morning, ☀️ Afternoon, 🌙 Evening, 🔄 Anytime) with dedicated progress indicators.
- **Kinetic Micro-Feedback:** Tactile spring scaling (`scale(0.97)` $\rightarrow$ `scale(1.03)` $\rightarrow$ `scale(1.0)`), SVG progress strokes, and native vibration cues.
- **Zero-Friction Ergonomics:** $\ge 48\times 48\text{px}$ touch targets, thumb-zone mobile navigation dock, and 1-tap rapid counters.

## Colors

The palette balances a serene OLED dark slate foundation with luminous, high-energy accent pills that give each routine and habit category an unmistakable visual identity.

### Primary

- **Emerald Vitality** (`#10b981` / Dark hover `#059669`): The core pulse of progress. Used for primary completion rings, active date pills, streak badges, and primary action buttons. Represents health, vitality, and successful consistency.

### Accents (Habit Theme Pill Tokens)

- **Electric Indigo** (`#6366f1`): Mindfulness, study, reflection, and intellectual habits.
- **Sunset Amber** (`#f59e0b`): Productivity, deep work, writing, and streak freeze protections.
- **Crimson Fire** (`#ef4444`): High-intensity workouts, cardio, strength training, and vital alerts.
- **Neon Violet** (`#8b5cf6`): Creative arts, music, design, and evening wind-down rituals.
- **Cyan Wave** (`#06b6d4`): Hydration, sleep hygiene, breathwork, and recovery routines.

### Neutral

- **OLED Slate Base** (`#020617` Dark / `#f8fafc` Light): The main viewport canvas background.
- **Surface Elevation 1** (`#0f172a` Dark / `#ffffff` Light): Elevated habit cards, metric summaries, and routine containers.
- **Surface Elevation 2 / Bottom Sheet** (`#1e293b` Dark / `#ffffff` Light): Modal dialogs, detail bottom sheets, and popovers.
- **Text Primary** (`#f8fafc` Dark / `#0f172a` Light): High-contrast, crisp typography meeting WCAG AAA contrast ratios.
- **Text Muted** (`#94a3b8` Dark / `#64748b` Light): Secondary subtitles, timestamps, unit labels, and inactive day numbers.
- **Border / Divider** (`#1e293b` Dark / `#e2e8f0` Light): Crisp 1px structural boundaries.

### Named Rules

- **The Circadian Contrast Rule.** OLED slate canvas must maintain $\ge 4.5:1$ contrast against all body copy. Saturated accent colors are strictly reserved for active rings, progress metrics, and category identity pills—never for full screen backgrounds.
- **The Habit Accent Sovereignty Rule.** Each habit maintains its assigned accent color across all views (Today card, 365-day mini heatmap, and history logs) to reinforce immediate spatial recognition.

## Typography

The typography system relies on the native Apple San Francisco / BlinkMacSystemFont / Segoe UI system font stack, ensuring zero network load, instant startup, and native-grade rendering fidelity.

**Character:** Crisp, modern, and highly legible with distinct tracking and weight jumps between glanceable numeric metrics and supporting routine labels.

### Hierarchy

- **Display** (800 Bold, `1.75rem` / `28px`, line-height `1.2`, letter-spacing `-0.025em`): Hero streak summaries, milestone badges, and key statistic callouts.
- **Headline** (700 Bold, `1.25rem` / `20px`, line-height `1.3`, letter-spacing `-0.015em`): Routine section titles (e.g. 🌅 _Buổi sáng / Morning_) and view headers.
- **Title** (600 SemiBold, `1rem` / `16px`, line-height `1.4`): Habit card names and modal dialog headers.
- **Body** (400 Regular, `0.875rem` / `14px`, line-height `1.5`): Journal notes, helper descriptions, and modal form instructions.
- **Label** (600 SemiBold, `0.75rem` / `12px`, letter-spacing `0.05em`, uppercase): Weekday indicators (MON, TUE), target unit chips, and status badges.

### Named Rules

- **The Glanceable Legibility Rule.** Numeric metrics and streak counters must always render in tabular or bold semi-bold weight with clear units attached (`14 days`, `2,500 ml`), never relying on fine or hairline weights.

## Layout

The layout is engineered from the ground up for single-hand mobile ergonomics while gracefully scaling inside a centered `max-w-lg` ($512\text{px}$) container on tablet and desktop screens.

- **Viewport Insets:** Strict adherence to mobile safe areas using `env(safe-area-inset-top)` on the sticky header and `env(safe-area-inset-bottom)` on the fixed glassmorphic dock.
- **Horizontal Date Ribbon:** 7-day scrollable strip centered on the active day, featuring quick snap scrolling, day-completion status dots, and an elevated "Today" badge.
- **Vertical Rhythm:** 16px (`1rem`) standard gutter spacing between routine clusters, with 8px (`0.5rem`) internal card gaps to create grouped gestalt cohesion.
- **Bottom Navigation Dock:** Fixed, persistent 3-tab dock (🎯 Today, 📊 Insights, ⚙️ Manager) floating 16px above the home indicator bar.

## Elevation & Depth

Depth is achieved through **tonal surface layering** combined with subtle 1px border strokes and translucent backdrop blur, rather than heavy skeuomorphic shadows.

### Shadow & Surface Vocabulary

- **Glassmorphic Floating Dock** (`backdrop-filter: blur(16px); background: rgba(2, 6, 23, 0.95)` with `border-t: 1px solid rgba(255, 255, 255, 0.08)`): Floats above scrollable content with pristine legibility.
- **Elevated Card Surface** (`background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.06); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2)`): Clean separation from base canvas.
- **Active Pill Glow** (`box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25)`): Subtle luminous ambient aura indicating selected date or completed status.
- **Modal & Bottom Sheet Backdrop** (`background: rgba(0, 0, 0, 0.80); backdrop-filter: blur(8px)`): Deep immersion focus when configuring habits or inspecting logs.

### Named Rules

- **The Flat-Canvas Layering Rule.** Surfaces rest on flat tonal planes. Elevation is communicated through step-wise lightness increases (`#020617` $\rightarrow$ `#0f172a` $\rightarrow$ `#1e293b`) and translucent blur rather than diffuse drop shadows.

## Shapes

- **Pills & Circular Badges** (`border-radius: 9999px` / `rounded-full`): Date selectors, streak counters, status tags, and routine filter chips.
- **Habit Cards** (`border-radius: 1rem` / `16px` / `rounded-2xl`): Gently curved corners providing a friendly, tactile card silhouette.
- **Bottom Sheets & Modals** (`border-radius: 1.5rem 1.5rem 0 0` / `24px` on mobile; `rounded-3xl` on desktop): Soft top radii welcoming thumb gestures.
- **Action Buttons & Steppers** (`border-radius: 0.75rem` / `12px` / `rounded-xl`): Ergonomic tap surfaces with smooth inner alignment.

## Components

### Habit Cards

- **Character:** Highly responsive tactile surfaces supporting 1-tap checks, steppers, or timer triggers.
- **Left Region:** Dynamic category accent vertical indicator bar, custom emoji icon container, habit name, and target streak badge.
- **Center / Action Control:**
  - _Binary Habits:_ Circular toggle with smooth SVG progress check animation.
  - _Numeric Habits:_ Inline `-` / `+` incremental stepper buttons with live value counter.
  - _Timer Habits:_ Compact start/pause countdown trigger with remaining time ticker.
- **Micro-Interaction:** Tapping complete triggers spring scaling (`scale(0.97)` $\rightarrow$ `scale(1.03)` $\rightarrow$ `scale(1.0)`), celebratory SVG stroke transition, and a light haptic pulse.

### 7-Day Date Ribbon

- **Structure:** Horizontal scrollable date pills with weekday abbreviation (`MON`), day number (`12`), and mini completion status dot.
- **Active State:** Emerald Vitality fill with glowing ambient shadow and crisp white typography.

### SVG Circular Progress Rings

- **Implementation:** Vector `<circle>` strokes using `stroke-dasharray` and `stroke-dashoffset` with smooth `transition: stroke-dashoffset 0.5s ease-out`.
- **Context:** Used in Top Header (daily total pacing), Routine Headers (section adherence), and Habit Deep-Dive sheets.

### Habit Deep-Dive Bottom Sheet

- **Structure:** Smooth slide-up sheet displaying a 365-day GitHub-style mini activity heatmap, all-time streak metrics, check-in history logs, and an inline micro-journal reflection note editor.

### Glassmorphic Bottom Navigation Dock

- **Tabs:** 🎯 **Hôm nay / Today** (`#tab-today`), 📊 **Thống kê / Insights** (`#tab-insights`), ⚙️ **Quản lý / Manager** (`#tab-manager`).
- **Touch Targets:** $\ge 48 \times 48\text{px}$ touch bounding boxes with `active:scale-95` tactile response.

## Do's and Don'ts

### Do:

- **Do** maintain strict single-tap completion speed ($<100\text{ms}$) with optimistic state updates and haptic reinforcement.
- **Do** use native system font sizing with clear hierarchical steps ($\ge 1.25\times$ ratio between adjacent heading and body roles).
- **Do** preserve 100% Vietnamese and English bilingual parity for all labels, dates, routine clusters, and empty state prompts.
- **Do** respect `@media (prefers-reduced-motion: reduce)` by disabling spring bounce physics and particle confetti.

### Don't:

- **Don't** use low-contrast washed-out gray text on saturated colored backgrounds (e.g. avoid `text-slate-400` directly over `bg-emerald-600`).
- **Don't** skip HTML heading hierarchies (e.g., jumping from `<h1>` directly to `<h4>`).
- **Don't** introduce external heavy UI runtime dependencies or icon font bundles; use inline SVGs and native system emojis.
- **Don't** block the UI during background data persistence or encrypted cloud sync operations.
