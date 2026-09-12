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
   * Imports JSON data into storage using merge or replace strategy
   */
  async function importFromJson(storage, rawInput, mode = "merge") {
    const val = validateImportJson(rawInput);
    if (!val.valid) {
      throw new Error(val.error);
    }

    const { habits, logs, settings, vacations } = val.payload.data;

    if (mode === "replace") {
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
    validateImportJson,
    importFromJson,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportImportExports;
  } else {
    global.HabitExportImport = exportImportExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
