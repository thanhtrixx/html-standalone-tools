/**
 * Atomic Habit Tracker Reactive State Store
 *
 * Provides in-memory reactive state cache, listener subscriptions,
 * and high-level async actions integrating with Storage and Domain Engine.
 */

(function (global) {
  "use strict";

  const engine =
    typeof require !== "undefined"
      ? require("../domain/engine.js")
      : global.HabitEngine;

  const storageModule =
    typeof require !== "undefined"
      ? require("../storage/indexeddb.js")
      : global.HabitStorage;

  class HabitStore {
    constructor(options = {}) {
      this.storage = options.storage || storageModule.createStorageAdapter();
      this.listeners = new Set();

      this.state = {
        habits: [],
        logs: {}, // key: habitId_date -> logObject
        settings: {
          theme: "dark",
          lang: "vi",
          freezeTokens: 2,
          remindersEnabled: true,
          vacationRanges: [],
          ...options.initialSettings,
        },
        activeDate: engine.toDateString(new Date()),
      };
    }

    subscribe(listener) {
      if (typeof listener === "function") {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      }
      return () => {};
    }

    notify(eventType, payload) {
      for (const listener of this.listeners) {
        try {
          listener(this.state, eventType, payload);
        } catch (e) {
          console.error("[HabitStore] Listener error:", e);
        }
      }
    }

    async init() {
      await this.storage.init();

      // Load habits
      const habits = await this.storage.getAllHabits();
      this.state.habits = habits || [];

      // Load logs
      const allLogs = await this.storage.getAllLogs();
      const logsMap = {};
      if (Array.isArray(allLogs)) {
        for (const log of allLogs) {
          const key = log.id || `${log.habitId}_${log.date}`;
          logsMap[key] = log;
        }
      }
      this.state.logs = logsMap;

      // Load settings
      const settingsMap = await this.storage.getAllSettings();
      if (settingsMap && typeof settingsMap === "object") {
        this.state.settings = {
          ...this.state.settings,
          ...settingsMap,
        };
      }

      // Load vacations
      const vacations = await this.storage.getVacations();
      if (Array.isArray(vacations)) {
        this.state.settings.vacationRanges = vacations;
      }

      this.notify("init", this.state);
      return this.state;
    }

    // Getters
    getHabits(includeArchived = false) {
      const list = includeArchived
        ? [...this.state.habits]
        : this.state.habits.filter((h) => !h.archived);
      return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    getHabit(id) {
      return this.state.habits.find((h) => h.id === id) || null;
    }

    getSettings() {
      return this.state.settings;
    }

    getActiveDate() {
      return this.state.activeDate;
    }

    setActiveDate(dateStr) {
      this.state.activeDate = engine.toDateString(dateStr);
      this.notify("active_date_change", this.state.activeDate);
    }

    // Habits CRUD
    async addHabit(habitData) {
      const newHabit = {
        id:
          habitData.id ||
          `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: habitData.name || "New Habit",
        type: habitData.type || engine.HABIT_TYPES.BINARY,
        targetValue: Number(habitData.targetValue) || 1,
        unit: habitData.unit || "",
        step: Number(habitData.step) || 1,
        routine: habitData.routine || engine.ROUTINES.ANYTIME,
        scheduleType: habitData.scheduleType || engine.SCHEDULE_TYPES.DAILY,
        scheduleDays: habitData.scheduleDays || [0, 1, 2, 3, 4, 5, 6],
        intervalDays: habitData.intervalDays || 1,
        color: habitData.color || "emerald",
        icon: habitData.icon || "🎯",
        reminderTime: habitData.reminderTime || null,
        archived: false,
        isPaused: false,
        createdAt: habitData.createdAt || engine.toDateString(new Date()),
        order:
          habitData.order !== undefined
            ? habitData.order
            : this.state.habits.length,
      };

      await this.storage.putHabit(newHabit);
      this.state.habits.push(newHabit);
      this.notify("habit_added", newHabit);
      return newHabit;
    }

    async updateHabit(id, updates) {
      const idx = this.state.habits.findIndex((h) => h.id === id);
      if (idx === -1) return null;

      const updated = {
        ...this.state.habits[idx],
        ...updates,
      };

      await this.storage.putHabit(updated);
      this.state.habits[idx] = updated;
      this.notify("habit_updated", updated);
      return updated;
    }

    async deleteHabit(id) {
      await this.storage.deleteHabit(id);
      this.state.habits = this.state.habits.filter((h) => h.id !== id);

      // Clean in-memory logs
      for (const key in this.state.logs) {
        if (this.state.logs[key].habitId === id) {
          delete this.state.logs[key];
        }
      }

      this.notify("habit_deleted", id);
      return true;
    }

    async archiveHabit(id) {
      return this.updateHabit(id, { archived: true });
    }

    async restoreHabit(id) {
      return this.updateHabit(id, { archived: false });
    }

    async reorderHabits(routine, orderedIds) {
      if (!Array.isArray(orderedIds)) return;
      for (let index = 0; index < orderedIds.length; index++) {
        const id = orderedIds[index];
        const h = this.state.habits.find((item) => item.id === id);
        if (h) {
          h.order = index;
          if (routine) h.routine = routine;
          await this.storage.putHabit(h);
        }
      }
      this.state.habits.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      this.notify("habits_reordered", { routine, orderedIds });
    }

    // Logging & Check-ins
    async logHabit(habitId, dateInput, value, notes = null) {
      const habit = this.getHabit(habitId);
      if (!habit) return null;

      const dateStr = engine.toDateString(dateInput);
      const key = `${habitId}_${dateStr}`;
      const existingLog = this.state.logs[key] || { notes: "" };

      const prog = engine.calculateHabitProgress(habit, value);

      const logEntry = {
        id: key,
        habitId,
        date: dateStr,
        value: prog.loggedValue,
        completed: prog.isCompleted,
        notes: notes !== null ? notes : existingLog.notes || "",
        timestamp: Date.now(),
      };

      await this.storage.putLog(logEntry);
      this.state.logs[key] = logEntry;
      this.notify("log_updated", logEntry);
      return logEntry;
    }

    async toggleHabit(habitId, dateInput) {
      const habit = this.getHabit(habitId);
      if (!habit) return null;

      const dateStr = engine.toDateString(dateInput);
      const key = `${habitId}_${dateStr}`;
      const currentLog = this.state.logs[key];
      const prog = engine.calculateHabitProgress(habit, currentLog);

      const newValue = prog.isCompleted ? 0 : habit.targetValue || 1;
      return this.logHabit(habitId, dateStr, newValue);
    }

    async updateNotes(habitId, dateInput, notesText) {
      const dateStr = engine.toDateString(dateInput);
      const key = `${habitId}_${dateStr}`;
      const existingLog = this.state.logs[key] || {
        value: 0,
        completed: false,
      };

      const logEntry = {
        ...existingLog,
        id: key,
        habitId,
        date: dateStr,
        notes: notesText || "",
        timestamp: Date.now(),
      };

      await this.storage.putLog(logEntry);
      this.state.logs[key] = logEntry;
      this.notify("notes_updated", logEntry);
      return logEntry;
    }

    // Daily & Insights queries
    getDailyState(dateInput = this.state.activeDate) {
      const dateStr = engine.toDateString(dateInput);
      const habits = this.getHabits();
      const dailyLogs = {};

      habits.forEach((h) => {
        const key = `${h.id}_${dateStr}`;
        dailyLogs[h.id] = this.state.logs[key] || {
          value: 0,
          completed: false,
          notes: "",
        };
      });

      const dailyProgress = engine.calculateDailyProgress(
        habits,
        dailyLogs,
        dateStr
      );

      return {
        date: dateStr,
        habits,
        logs: dailyLogs,
        dailyProgress,
      };
    }

    async updateSettings(partial) {
      this.state.settings = {
        ...this.state.settings,
        ...partial,
      };

      for (const k in partial) {
        await this.storage.putSetting(k, partial[k]);
      }

      this.notify("settings_updated", this.state.settings);
      return this.state.settings;
    }

    async addVacationRange(range) {
      const vac = {
        id: range.id || `vac-${Date.now()}`,
        startDate: engine.toDateString(range.startDate),
        endDate: engine.toDateString(range.endDate || range.startDate),
        reason: range.reason || "Vacation / Sick Pause",
        active: range.active !== false,
      };

      await this.storage.putVacation(vac);
      const vacations = await this.storage.getVacations();
      this.state.settings.vacationRanges = vacations;
      this.notify("vacation_added", vac);
      return vac;
    }

    async deleteVacationRange(id) {
      await this.storage.deleteVacation(id);
      const vacations = await this.storage.getVacations();
      this.state.settings.vacationRanges = vacations;
      this.notify("vacation_deleted", id);
      return true;
    }
  }

  const storeExports = {
    HabitStore,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = storeExports;
  } else {
    global.HabitState = storeExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
