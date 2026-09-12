/**
 * Atomic Habit Tracker JSON Data Portability
 *
 * Implements:
 * - 1-tap full JSON export
 * - Schema validation
 * - Safe import with Merge & Replace strategies
 */

(function (global) {
  "use strict";

  const APP_IDENTIFIER = "atomic-habit-tracker";
  const SCHEMA_VERSION = "1.0.0";

  /**
   * Serializes complete database state to standardized JSON export payload
   */
  async function exportToJson(storage) {
    const habits = await storage.getAllHabits();
    const logs = await storage.getAllLogs();
    const settings = await storage.getAllSettings();
    const vacations = await storage.getVacations();

    const payload = {
      app: APP_IDENTIFIER,
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        habits: habits || [],
        logs: logs || [],
        settings: settings || {},
        vacations: vacations || [],
      },
    };

    return payload;
  }

  /**
   * Formats in-memory or store state to standardized JSON export payload
   */
  function formatExportPayload(input) {
    let habits = [];
    let logs = [];
    let settings = {};
    let vacations = [];

    let target = input;
    if (target && target.state) {
      target = target.state;
    }

    if (target && typeof target === "object") {
      if (Array.isArray(target.habits)) {
        habits = target.habits;
      } else if (target.habits && typeof target.habits === "object") {
        habits = Object.values(target.habits);
      }

      if (Array.isArray(target.logs)) {
        logs = target.logs;
      } else if (target.logs && typeof target.logs === "object") {
        logs = Object.values(target.logs);
      }

      if (target.settings && typeof target.settings === "object") {
        settings = target.settings;
      }

      if (Array.isArray(target.vacations)) {
        vacations = target.vacations;
      } else if (
        target.vacationRanges &&
        Array.isArray(target.vacationRanges)
      ) {
        vacations = target.vacationRanges;
      }
    }

    return {
      app: APP_IDENTIFIER,
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        habits: habits || [],
        logs: logs || [],
        settings: settings || {},
        vacations: vacations || [],
      },
    };
  }

  /**
   * Triggers browser download of standardized JSON backup file
   */
  function downloadExportJSON(storeOrState, customFilename = null) {
    const payload = formatExportPayload(storeOrState);
    const jsonString = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename =
      customFilename || `atomic-habit-tracker-backup-${dateStr}.json`;

    if (typeof document !== "undefined" && typeof Blob !== "undefined") {
      const blob = new Blob([jsonString], {
        type: "application/json;charset=utf-8",
      });
      const url =
        typeof URL !== "undefined" && URL.createObjectURL
          ? URL.createObjectURL(blob)
          : "";
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      if (document.body) {
        document.body.appendChild(a);
      }
      a.click();
      setTimeout(() => {
        if (document.body && a.parentNode === document.body) {
          document.body.removeChild(a);
        }
        if (typeof URL !== "undefined" && URL.revokeObjectURL && url) {
          URL.revokeObjectURL(url);
        }
      }, 100);
    }

    return payload;
  }

  /**
   * Validates raw JSON payload schema before importing
   */
  function validateImportJson(rawInput) {
    let payload = rawInput;
    if (typeof rawInput === "string") {
      try {
        payload = JSON.parse(rawInput);
      } catch (e) {
        return { valid: false, error: "Invalid JSON format" };
      }
    }

    if (!payload || typeof payload !== "object") {
      return { valid: false, error: "Payload must be a valid JSON object" };
    }

    if (payload.app !== APP_IDENTIFIER) {
      return {
        valid: false,
        error: `Incompatible app identifier. Expected '${APP_IDENTIFIER}', got '${payload.app}'`,
      };
    }

    if (!payload.data || typeof payload.data !== "object") {
      return { valid: false, error: "Missing 'data' container in payload" };
    }

    if (!Array.isArray(payload.data.habits)) {
      return { valid: false, error: "'data.habits' must be an array" };
    }

    return { valid: true, payload };
  }

  /**
   * Parses and validates raw input string or object, returning standard result
   */
  function parseAndValidateImport(rawInput) {
    const result = validateImportJson(rawInput);
    if (!result.valid) {
      return {
        valid: false,
        error: result.error,
        errors: [result.error],
        data: null,
      };
    }
    return {
      valid: true,
      data: result.payload.data,
      payload: result.payload,
    };
  }

  /**
   * Merges imported data into current reactive state or storage adapter
   */
  async function mergeHabitStates(currentState, importedData, mode = "merge") {
    // If currentState is a storage adapter with putHabit, delegate to importFromJson
    if (currentState && typeof currentState.putHabit === "function") {
      return await importFromJson(currentState, importedData, mode);
    }

    const base = currentState || {
      habits: {},
      logs: {},
      settings: {},
      vacations: [],
    };
    const incoming =
      importedData && importedData.data
        ? importedData.data
        : importedData || {};

    if (mode === "replace") {
      const nextHabits = {};
      const nextLogs = {};
      const nextSettings = { ...(incoming.settings || {}) };
      const nextVacations = [...(incoming.vacations || [])];

      if (Array.isArray(incoming.habits)) {
        incoming.habits.forEach((h) => {
          if (h && h.id) nextHabits[h.id] = h;
        });
      }

      if (Array.isArray(incoming.logs)) {
        incoming.logs.forEach((l) => {
          const key = l.id || `${l.habitId}_${l.date}`;
          if (key) nextLogs[key] = l;
        });
      }

      return {
        habits: nextHabits,
        logs: nextLogs,
        settings: nextSettings,
        vacations: nextVacations,
      };
    }

    // Merge mode
    const mergedHabits = { ...base.habits };
    const mergedLogs = { ...base.logs };
    const mergedSettings = {
      ...(base.settings || {}),
      ...(incoming.settings || {}),
    };
    const mergedVacations = [...(base.vacations || [])];

    if (Array.isArray(incoming.habits)) {
      incoming.habits.forEach((h) => {
        if (h && h.id) mergedHabits[h.id] = h;
      });
    }

    if (Array.isArray(incoming.logs)) {
      incoming.logs.forEach((l) => {
        const key = l.id || `${l.habitId}_${l.date}`;
        if (key) mergedLogs[key] = l;
      });
    }

    if (Array.isArray(incoming.vacations)) {
      incoming.vacations.forEach((v) => {
        if (v && v.id && !mergedVacations.some((mv) => mv.id === v.id)) {
          mergedVacations.push(v);
        }
      });
    }

    return {
      habits: mergedHabits,
      logs: mergedLogs,
      settings: mergedSettings,
      vacations: mergedVacations,
    };
  }

  /**
   * Imports JSON data into storage using merge or replace strategy
   */
  async function importFromJson(storage, rawInput, mode = "merge") {
    const val = validateImportJson(rawInput);
    if (!val.valid) {
      throw new Error(val.error);
    }

    const { habits, logs, settings, vacations } = val.payload.data;

    if (mode === "replace" && storage.clearAll) {
      await storage.clearAll();
    }

    // Habits
    if (Array.isArray(habits)) {
      for (const h of habits) {
        if (h && h.id && h.name) {
          await storage.putHabit(h);
        }
      }
    }

    // Logs
    if (Array.isArray(logs)) {
      for (const l of logs) {
        if (l && l.habitId && l.date) {
          await storage.putLog(l);
        }
      }
    }

    // Settings
    if (settings && typeof settings === "object") {
      for (const key in settings) {
        await storage.putSetting(key, settings[key]);
      }
    }

    // Vacations
    if (Array.isArray(vacations)) {
      for (const v of vacations) {
        if (v && v.id) {
          await storage.putVacation(v);
        }
      }
    }

    return {
      success: true,
      countHabits: (habits || []).length,
      countLogs: (logs || []).length,
    };
  }

  const exportImportExports = {
    APP_IDENTIFIER,
    SCHEMA_VERSION,
    exportToJson,
    formatExportPayload,
    downloadExportJSON,
    validateImportJson,
    parseAndValidateImport,
    mergeHabitStates,
    importFromJson,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportImportExports;
  }
  global.HabitExportImport = exportImportExports;
  global.exportImport = exportImportExports;
})(typeof window !== "undefined" ? window : globalThis);
