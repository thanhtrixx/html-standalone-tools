# ADR-0010: Monolingual English UI, Permanent Dark Theme, and Ergonomic Hotkey Architecture

- **Status:** Accepted
- **Date:** 2026-09-20
- **Scope:** `english-shadowing`

---

## 1. Context & Problem Statement

Following user feedback and operational evaluation of the English Shadowing Player:

1. **Redundant UI i18n Switcher Overhead**: The application implemented a full client-side dynamic i18n switcher (`setLanguage()`, `TRANSLATIONS` dictionary, `data-i18n` attributes, language toggle button in header). For an English language acquisition tool, the UI chrome, buttons, menus, and modals should natively be in English. At the same time, learners still benefit from bilingual Vietnamese cues in subtitle `.lrc` tracks and Word Inspector definitions. Maintaining a separate runtime UI localization system adds DOM manipulation overhead, test complexity, and bundle weight without pedagogical value.
2. **Unnecessary Theme Switching**: The player supported light and dark mode toggling. In practice, deliberate audio shadowing with glowing karaoke word highlights, active sentence tracking, and Web Audio API waveform canvas rendering requires maximum contrast against deep slate backgrounds (`#090d16` / `#0f172a`). Light mode compromised waveform legibility, dimmed glow effects, and added layout/CSS maintenance debt.
3. **Suboptimal Keyboard Ergonomics**: Power users and deliberate practice learners rely on keyboard shortcuts for uninterrupted practice. Previously:
   - No hotkeys existed to cycle between Playback Modes (`continuous` ➔ `loop` ➔ `echoic`).
   - No hotkeys existed to trigger Comparative Playback (`C`) to compare native speaker reference against recorded voice takes.
   - Flashcard SRS review required mouse clicks to flip cards and select 1-day/3-day/30-day grading tiers.
   - Catalog search required manual clicking into the search input.
   - Transport only supported partial key combinations without media/Vim transport aliases (`J`/`K`/`L`).

---

## 2. Decision Drivers

- **Lean, Monolingual UI Chrome**: Strip client-side UI translation machinery, hardcode clean, professional English copy into the DOM, and keep bilingual Vietnamese references in content (LRC subtitles and vocabulary definitions).
- **Permanent High-Contrast Dark Theme**: Standardize 100% on the Midnight Slate/Navy dark theme for optimal readability, contrast, and visual focus, removing theme switching state and buttons.
- **True Keyboard-First Workflow**: Provide complete multi-layout transport (`WASD` + Arrows + `JKL`), dedicated shadowing hotkeys (`P` for mode cycle, `C` for comparative playback, `M` for mic take, `B` for bookmark, `/` for search focus), and full keyboard grading (`Space`/`Enter` flip, `1`/`2`/`3` grading) during Leitner SRS flashcard reviews.
- **Categorized Shortcuts Cheat Sheet**: Present an organized, intuitive modal detailing all hotkeys across Transport, Practice, Subtitles, Vocabulary, and Flashcards.

---

## 3. Considered Options & Decision Outcome

### A. UI Localization & Translation Architecture

- **Option 1 (Retain Dynamic i18n Engine)**: Keep `TRANSLATIONS` object and EN/VI switcher in header. _(Rejected: Unnecessary cognitive load and DOM complexity for an English learning PWA)._
- **Option 2 (Total Elimination of Vietnamese)**: Remove Vietnamese from subtitles and dictionary as well. _(Rejected: Strips vital reference support for Vietnamese English learners during sentence comprehension)._
- **Option 3 (Chosen - Monolingual English UI + Bilingual Study Content)**:
  - Hardcode clean English strings directly into `index.html` elements.
  - Remove `#langBtnEn`, `#langBtnVi`, `setLanguage()`, `state.lang`, and the `TRANSLATIONS` UI dictionary.
  - Maintain Vietnamese lines in `.lrc` scenario files, subtitle masking modes (`Dual`, `EN Only`, `VI Only`, `Blur`), and Vietnamese definitions in `BUILTIN_VOCAB_DB`.
  - _Outcome_: Chosen. Streamlines codebase, removes ~300 lines of UI boilerplate, and preserves essential learning aids.

### B. Theme Management

- **Option 1 (Retain Light/Dark Switcher)**: Keep theme toggle button and dual CSS styling. _(Rejected: Light mode impairs karaoke glow pill visibility and waveform contrast)._
- **Option 2 (Chosen - Permanent Dark Mode)**:
  - Enforce `<html lang="en" class="dark">` permanently.
  - Remove `#themeToggleBtn`, `#themeIconDark`, `#themeIconLight`, `setTheme()`, `toggleTheme()`, and `localStorage` theme loading.
  - _Outcome_: Chosen. Consistent visual hierarchy and reduced bundle footprint.

### C. Keyboard Shortcut Architecture

- **Option 1 (Minimal Existing Shortcuts)**: Keep existing Space, R, A/D, [ / ], 1-4, M, V. _(Rejected: Lacks mode switching, comparative playback, flashcard review, and search focus hotkeys)._
- **Option 2 (Chosen - Unified Multi-Layout Keyboard Architecture)**:
  - **Transport & Navigation**: `Space` / `K` (Play/Pause), `R` / `ArrowUp` (Replay), `A` / `ArrowLeft` / `J` (Prev sentence), `D` / `ArrowRight` / `L` (Next sentence), `Home` / `0` (First sentence), `End` (Last sentence), `[` / `]` (Speed adjustment).
  - **Shadowing & Audio Tools**: `P` (Cycle Continuous ➔ Loop ➔ Echoic mode), `M` (Toggle Mic Take), `C` (Play A/B Comparative audio), `B` (Bookmark scenario), `1`–`4` (Subtitle masking: Dual, EN, VI, Blur).
  - **Leitner Flashcard Review**: `Space` / `Enter` / `F` / `ArrowUp` (Flip Card), `1` (Hard / Reset Box 1), `2` (Good / Advance Box), `3` (Mastered / Box 5), `ArrowLeft` / `ArrowRight` (Prev / Next card).
  - **Global & Search**: `/` (Focus search input in Catalog), `V` (Vocab Drawer), `I` (Insights Modal), `?` (`Shift + /`) (Cheat Sheet), `Escape` (Dismiss modal/drawer or back to Catalog).
  - _Outcome_: Chosen. Provides a fluid, distraction-free desktop practice experience.

---

## 4. Consequences

### Positive

- Zero runtime UI i18n overhead and faster initial render.
- Consistent dark theme design without style flickering or contrast regression.
- Complete keyboard accessibility enabling hands-off-mouse deliberate shadowing practice.
- Cleaner, categorized keyboard cheat sheet modal for instant discoverability.

### Negative

- Learners cannot switch application navigation labels to Vietnamese (mitigated because English labels are standard and concise: Scenarios, Player, Vocab, Insights).
