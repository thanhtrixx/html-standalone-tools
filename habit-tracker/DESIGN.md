# Impeccable Mobile-First Design System (`DESIGN.md`)

This document defines the visual design standards, color tokens, typography, motion physics, micro-interactions, tactile feedback, and accessibility guidelines for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🎨 Color Palette & Design Tokens

Designed with a modern **iOS Health / Craft Dark-OLED** aesthetic and full **Light Mode** parity.

### 1. Dark Mode (Default OLED Theme)

- **Canvas Base Background**: `#0b0f19` (Deep slate black)
- **Surface Elevation 1 (Card Background)**: `#131b2e` / `rgba(255, 255, 255, 0.04)` with subtle 1px border `rgba(255, 255, 255, 0.08)`
- **Surface Elevation 2 (Modal / Bottom Sheet)**: `#1a233a`
- **Text Primary**: `#f8fafc` (High contrast crisp white)
- **Text Secondary / Muted**: `#94a3b8` (Slate 400)
- **Border / Divider**: `rgba(255, 255, 255, 0.08)`

### 2. Light Mode

- **Canvas Base Background**: `#f8fafc`
- **Surface Elevation 1 (Card Background)**: `#ffffff` with subtle drop shadow `0 2px 8px rgba(0,0,0,0.04)` and border `#e2e8f0`
- **Surface Elevation 2 (Modal / Bottom Sheet)**: `#ffffff`
- **Text Primary**: `#0f172a` (Slate 900)
- **Text Secondary / Muted**: `#64748b` (Slate 500)

### 3. Habit Accent Colors (Vibrant Neo-Pill Tokens)

Users can select vibrant accent themes per habit:

- 🟢 **Emerald Pulse**: `#10b981` (Health, Vitality, Nutrition)
- 🔵 **Electric Indigo**: `#6366f1` (Mindfulness, Study, Meditation)
- 🟠 **Sunset Amber**: `#f59e0b` (Productivity, Deep Work, Writing)
- 🔴 **Crimson Fire**: `#ef4444` (Fitness, Cardio, Strength)
- 🟣 **Neon Violet**: `#8b5cf6` (Creative, Art, Reflection)
- 🩵 **Cyan Wave**: `#06b6d4` (Hydration, Sleep, Recovery)

---

## 📐 Mobile-First View Layout & Component Hierarchy

### 1. Sticky Top Navigation Bar

- **Date Ribbon / Day Selector**: Horizontal scrollable 7-day strip (`< [Mon 10] [Tue 11] [Wed 12] [Thu 13] [Fri 14] >`) with dynamic "Today" pill, daily completion badge, and smooth scroll snapping.
- **Top Pacing & Streak Bar**: Ambient status ticker showing active total daily progress ring, fire streak icon (`🔥 14 days`), and freeze tokens remaining (`❄️ 2`).

### 2. Time-of-Day Routine Sections

- **Routine Cluster Header**: Icon + Routine Name (e.g., 🌅 _Buổi sáng / Morning_), completion ring badge (e.g. `2/3 Done`), and subtle collapsible chevron.
- **Habit Card Component**:
  - **Left**: Color accent bar + Habit Icon/Emoji + Habit Name + Subtitle (Target value, streak badge).
  - **Center**: Interactive completion control (Binary check toggle, Numeric `+` / `-` stepper, or Mini timer button).
  - **Right**: Swipe trigger indicator.
  - **Micro-Interaction**: Tapping complete fires smooth SVG ring stroke animation, spring bounce scale (`scale(0.97)` -> `scale(1.03)` -> `scale(1.0)`), and Web Haptic pulse (`navigator.vibrate([15, 30, 15])`).

### 3. Fixed Glassmorphic Bottom Navigation Bar

- **Three Core Tabs**:
  1. 🎯 **Hôm nay / Today** (`#tab-today`)
  2. 📊 **Thống kê / Insights** (`#tab-insights`)
  3. ⚙️ **Thói quen / Manager** (`#tab-manager`)
- **Backdrop Blur**: `backdrop-filter: blur(16px); background: rgba(11, 15, 25, 0.85);`
- **Safe Area Insets**: `padding-bottom: env(safe-area-inset-bottom, 16px);`

---

## 🖐️ Tactile Touch Gestures & Motion Physics

1. **Swipe to Complete**:
   - Swiping a habit card right ($>80\text{px}$) reveals a green check zone (`✓ Hoàn thành / Complete`) and automatically triggers completion.
   - Spring-back damping when released below threshold.
2. **Swipe to Log / Note**:
   - Swiping left ($>80\text{px}$) opens the Habit Deep-Dive Sheet for instant note logging.
3. **Daily Victory Confetti**:
   - When all scheduled habits reach 100% completion for the day, a celebratory canvas confetti burst triggers with celebratory sound chime and congratulatory banner.

---

## ♿ Accessibility & Ergonomics

- **Minimum Touch Targets**: All interactive buttons, checkboxes, and tabs are $\ge 48 \times 48\text{px}$.
- **Color Contrast**: All text elements satisfy WCAG AA ratio ($\ge 4.5:1$).
- **Reduced Motion**: Respects `@media (prefers-reduced-motion: reduce)` by disabling spring animations and confetti.
