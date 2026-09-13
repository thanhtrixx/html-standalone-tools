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

      // Silent migration: normalize routines array
      for (const h of this.state.habits) {
        if (!Array.isArray(h.routines) || h.routines.length === 0) {
          h.routines = [h.routine || engine.ROUTINES.ANYTIME];
        }
        if (!h.routine) {
          h.routine = h.routines[0];
        }
      }

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

    getLog(habitId, dateInput) {
      const dateStr = engine.toDateString(dateInput || this.getActiveDate());
      return this.state.logs[`${habitId}_${dateStr}`] || null;
    }

    // Habits CRUD
    async addHabit(habitData) {
      const assignedRoutines =
        Array.isArray(habitData.routines) && habitData.routines.length > 0
          ? habitData.routines
          : [habitData.routine || engine.ROUTINES.ANYTIME];

      const newHabit = {
        id:
          habitData.id ||
          `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: habitData.name || "New Habit",
        type: habitData.type || engine.HABIT_TYPES.BINARY,
        targetValue: Number(habitData.targetValue) || 1,
        unit: habitData.unit || "",
        step: Number(habitData.step) || 1,
        routines: assignedRoutines,
        routine: assignedRoutines[0],
        domain: habitData.domain || "health",
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

    async applyStarterKit(kitId, lang = "vi") {
      const kit = engine.STARTER_KITS.find((k) => k.id === kitId);
      if (!kit || !Array.isArray(kit.habits)) return [];

      const created = [];
      for (const hData of kit.habits) {
        const name =
          lang === "vi" && hData.nameVi
            ? hData.nameVi
            : hData.nameEn || hData.name;
        const habit = await this.addHabit({
          ...hData,
          name,
        });
        created.push(habit);
      }
      this.notify("starter_kit_applied", { kitId, created });
      return created;
    }

    async updateHabit(id, updates) {
      const idx = this.state.habits.findIndex((h) => h.id === id);
      if (idx === -1) return null;

      const normalizedUpdates = { ...updates };
      if (
        Array.isArray(normalizedUpdates.routines) &&
        normalizedUpdates.routines.length > 0
      ) {
        normalizedUpdates.routine = normalizedUpdates.routines[0];
      } else if (normalizedUpdates.routine && !normalizedUpdates.routines) {
        normalizedUpdates.routines = [normalizedUpdates.routine];
      }

      const updated = {
        ...this.state.habits[idx],
        ...normalizedUpdates,
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
          if (
            routine &&
            (!Array.isArray(h.routines) || !h.routines.includes(routine))
          ) {
            h.routines = Array.isArray(h.routines)
              ? [...h.routines, routine]
              : [routine];
            h.routine = h.routines[0];
          }
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

    async replaceState(newState) {
      if (!newState || typeof newState !== "object") return;

      // Normalize habits
      let nextHabits = [];
      if (Array.isArray(newState.habits)) {
        nextHabits = [...newState.habits];
      } else if (newState.habits && typeof newState.habits === "object") {
        nextHabits = Object.values(newState.habits);
      }

      for (const h of nextHabits) {
        if (!Array.isArray(h.routines) || h.routines.length === 0) {
          h.routines = [h.routine || engine.ROUTINES.ANYTIME];
        }
        if (!h.routine) {
          h.routine = h.routines[0];
        }
      }

      // Normalize logs
      const nextLogs = {};
      if (Array.isArray(newState.logs)) {
        for (const log of newState.logs) {
          const key = log.id || `${log.habitId}_${log.date}`;
          nextLogs[key] = log;
        }
      } else if (newState.logs && typeof newState.logs === "object") {
        for (const key in newState.logs) {
          const log = newState.logs[key];
          const logKey = log.id || `${log.habitId}_${log.date}` || key;
          nextLogs[logKey] = log;
        }
      }

      // Normalize settings & vacations
      const nextSettings = {
        ...this.state.settings,
        ...(newState.settings || {}),
      };

      const nextVacations = Array.isArray(newState.vacations)
        ? newState.vacations
        : Array.isArray(newState.vacationRanges)
          ? newState.vacationRanges
          : [];
      nextSettings.vacationRanges = nextVacations;

      // Persist to storage
      if (typeof this.storage.clearAll === "function") {
        await this.storage.clearAll();
      }

      for (const h of nextHabits) {
        await this.storage.putHabit(h);
      }
      for (const key in nextLogs) {
        await this.storage.putLog(nextLogs[key]);
      }
      for (const key in nextSettings) {
        if (key !== "vacationRanges") {
          await this.storage.putSetting(key, nextSettings[key]);
        }
      }
      for (const v of nextVacations) {
        await this.storage.putVacation(v);
      }

      this.state.habits = nextHabits;
      this.state.logs = nextLogs;
      this.state.settings = nextSettings;

      this.notify("state_replaced", this.state);
      return this.state;
    }

    async resetToDefaults() {
      const defaults = [
        {
          id: "h-water",
          name: "Uống 2.5L Nước",
          type: "numeric",
          targetValue: 2500,
          unit: "ml",
          step: 250,
          routines: ["afternoon"],
          routine: "afternoon",
          scheduleType: "daily",
          color: "cyan",
          icon: "💧",
          reminderTime: "14:00",
          archived: false,
          isPaused: false,
          createdAt: engine.toDateString(new Date()),
          order: 0,
        },
        {
          id: "h-meditate",
          name: "Thiền chánh niệm 10 phút",
          type: "binary",
          targetValue: 1,
          routines: ["morning"],
          routine: "morning",
          scheduleType: "daily",
          color: "indigo",
          icon: "🧘",
          reminderTime: "07:00",
          archived: false,
          isPaused: false,
          createdAt: engine.toDateString(new Date()),
          order: 1,
        },
        {
          id: "h-read",
          name: "Đọc sách 20 phút",
          type: "timer",
          targetValue: 1200,
          unit: "mins",
          routines: ["evening"],
          routine: "evening",
          scheduleType: "daily",
          color: "amber",
          icon: "📖",
          reminderTime: "21:00",
          archived: false,
          isPaused: false,
          createdAt: engine.toDateString(new Date()),
          order: 2,
        },
      ];

      if (typeof this.storage.clearAll === "function") {
        await this.storage.clearAll();
      }

      for (const h of defaults) {
        await this.storage.putHabit(h);
      }

      const defaultSettings = {
        theme: "dark",
        language: "vi",
        freezeTokens: 2,
        remindersEnabled: true,
        vacationRanges: [],
      };

      for (const k in defaultSettings) {
        await this.storage.putSetting(k, defaultSettings[k]);
      }

      this.state.habits = defaults;
      this.state.logs = {};
      this.state.settings = { ...defaultSettings };
      this.notify("state_reset_defaults", this.state);
      return this.state;
    }

    async factoryWipe() {
      if (typeof this.storage.clearAll === "function") {
        await this.storage.clearAll();
      }

      const defaultSettings = {
        theme: "dark",
        language: "vi",
        freezeTokens: 2,
        remindersEnabled: true,
        vacationRanges: [],
      };

      this.state.habits = [];
      this.state.logs = {};
      this.state.settings = { ...defaultSettings };
      this.notify("state_factory_wipe", this.state);
      return this.state;
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
