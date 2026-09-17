# 14. Screen-Off Active Timer Session Persistence & Cold-Boot Reconciliation

Date: 2026-09-17
Status: Accepted

## Context & Problem Statement

Field testing and user reports on mobile devices (particularly iOS WebKit/Safari and aggressive Android power management vendors such as Samsung, Xiaomi, and Huawei) revealed a critical data loss and UX interruption bug in the timer habit modality:

1. **In-Memory Closure Vulnerability**: Running timer state (`runningTimerHabitId`, `runningTimerStartedAt`, `runningTimerBaseValue`, `runningTimerTickCount`, `runningTimerDate`) was stored exclusively in closure variables inside `src/app.js`.
2. **Abrupt OS Process Suspension & Cold Termination**: When a user locks their phone or turns off the screen during an active focus/timer habit session, mobile OS battery managers suspend background JS threads and Web Workers, and frequently kill the PWA process to reclaim memory.
3. **Dropped Async IndexedDB Writes**: While `visibilitychange` and `pagehide` attempted to invoke `flushRunningTimerToStorage()`, asynchronous IndexedDB transaction promises are frequently aborted or killed mid-flight when the browser tab is abruptly terminated.
4. **Complete Loss of Running Timer Context on Cold Relaunch**: When the user reopens the app after locking their phone, the app initialized with `runningTimerHabitId = null`. The timer appeared stopped, elapsed time spent while the phone was off was lost, and the user had to manually restart or guess their logged time.

## Decision Drivers

- **Zero-Loss Timer Continuity**: Habit timer sessions must seamlessly survive screen lock, app switching, tab suspension, and complete OS cold process kills.
- **Synchronous Write Guarantee**: Active session snapshots must commit synchronously to storage before the OS can terminate the JavaScript execution thread.
- **Accurate Elapsed Time Reconciliation**: Elapsed background time must be computed via true wall-clock timestamp deltas (`Date.now() - startedAt`), accurately logging full sessions and overtime.
- **Runaway Session Safety Guardrail**: Abandoned or forgotten timer sessions must not accumulate indefinite logs spanning days or weeks.
- **Circadian Date Invariant**: Midnight rollovers during a timer session must cleanly attribute duration to the originating session date without fragmented log splits.
- **Frictionless Wake UX**: Reopening the app must immediately restore the user's active focus context, celebration events (if target was reached in background), and interactive controls.

## Considered Options & Decision Outcome

### Decision 1: Dual Storage with Synchronous `localStorage` Snapshot (`habit_active_timer_session`)

- **Outcome**: Use `localStorage` to synchronously persist active session metadata (`habitId`, `date`, `startedAt`, `baseValue`, `isRunning`, `lastSavedTimestamp`, `targetValue`, `timerDisplayMode`, `timerSoundEnabled`).
- Write synchronously on every timer start, pause, reset, adjuster click, periodic ticker heartbeat (every 1s), and on Page Lifecycle events (`visibilitychange: hidden/visible`, `pagehide`, `freeze`, `beforeunload`).
- Long-term log records continue to be asynchronously committed to IndexedDB.

### Decision 2: Cold-Boot Time Reconciliation & 12-Hour Safety Cap

- **Outcome**: On `initApp()` and `visibilitychange: visible`, inspect `habit_active_timer_session`.
- If an unpaused session is found:
  - Check staleness against a **12-Hour Safety Cap** ($43,200\text{ seconds}$). If elapsed duration $> 12\text{ hours}$, cap the logged duration at 12 hours, mark the session finalized, and notify the user.
  - If within 12 hours: Calculate $\text{elapsed} = \max\left(0, \lfloor(\text{Date.now()} - \text{startedAt}) / 1000\rfloor\right)$, $\text{totalSecs} = \text{baseValue} + \text{elapsed}$.
  - Synchronize in-memory logs, update IndexedDB, and if target duration was crossed while asleep, trigger the harmonic sine chime, celebratory confetti, and completion toast.
  - Automatically resume the Web Worker / `setInterval` ticker for live overtime logging.

### Decision 3: Originating Session Date Attribution

- **Outcome**: All elapsed and overtime seconds are attributed strictly to `session.date` (the calendar date when the session began). The user's active view displays today's date ribbon while accurately reflecting the active session's progress.

### Decision 4: Immersive Focus Modal Auto-Reopen & Ambient Dynamic Island

- **Outcome**: When the app cold-launches with an active restored timer session:
  - Auto-open the immersive Focus Timer Modal (`#focus-timer-modal-overlay`) with reactive dial and digits.
  - Re-hydrate the Floating Dynamic Timer Island (`#floating-timer-island`) and Dock Active Pill (`#dock-active-timer-pill`).

## Consequences

### Positive

- 100% resilient timer execution across screen locks, phone sleeps, background throttling, and PWA cold reboots.
- Instant synchronous persistence via `localStorage` guarantees zero dropped timer state upon sudden OS process kills.
- Transparent background overtime tracking and audio celebration upon wake matching native mobile timer apps.
- 12-hour safety cap prevents runaway data corruption if the user forgets about an active timer.
- Zero regression on existing offline IndexedDB architecture and bilingual UI.

### Negative

- Adds synchronous `localStorage` serialization operations during timer state transitions (negligible performance overhead for single JSON object).
- Focus modal auto-opening requires defensive checks in `initApp` to ensure habit still exists in catalog.
