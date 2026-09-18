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
   * Copies formatted JSON export payload directly to system clipboard.
   * If navigator.clipboard is unavailable or rejected, returns fallback payload with json string.
   */
  async function copyJsonToClipboard(storeOrState, options = {}) {
    const payload = formatExportPayload(storeOrState);
    const jsonString = JSON.stringify(
      payload,
      null,
      options.pretty !== false ? 2 : 0
    );

    let copied = false;
    let error = null;

    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(jsonString);
        copied = true;
      } catch (err) {
        error = err;
      }
    }

    // Fallback: document.execCommand('copy') in browser context if writeText failed
    if (!copied && typeof document !== "undefined") {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = jsonString;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        if (document.body) {
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          const successful = document.execCommand("copy");
          document.body.removeChild(textarea);
          if (successful) {
            copied = true;
            error = null;
          }
        }
      } catch (e) {
        if (!error) error = e;
      }
    }

    return {
      success: copied,
      jsonString,
      payload,
      fallback: !copied,
      error: error ? error.message : null,
    };
  }

  /**
   * Reads raw JSON text from system clipboard if permissions permit
   */
  async function readJsonFromClipboard() {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.readText === "function"
    ) {
      try {
        const text = await navigator.clipboard.readText();
        return { success: true, text };
      } catch (err) {
        return { success: false, error: err.message, text: null };
      }
    }
    return {
      success: false,
      error: "Clipboard API not supported or accessible in this environment",
      text: null,
    };
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
        return {
          valid: false,
          error: "Invalid JSON format",
          errors: ["Invalid JSON format"],
        };
      }
    }

    if (!payload || typeof payload !== "object") {
      return {
        valid: false,
        error: "Payload must be a valid JSON object",
        errors: ["Payload must be a valid JSON object"],
      };
    }

    if (payload.app !== APP_IDENTIFIER) {
      const err = `Incompatible app identifier. Expected '${APP_IDENTIFIER}', got '${payload.app}'`;
      return {
        valid: false,
        error: err,
        errors: [err],
      };
    }

    // Check if encrypted envelope
    if (payload.encrypted === true || payload.ciphertext) {
      if (!payload.ciphertext || !payload.iv || !payload.salt) {
        const err =
          "Encrypted backup missing required cryptography fields (ciphertext, iv, salt)";
        return { valid: false, error: err, errors: [err], isEncrypted: true };
      }
      return { valid: true, payload, isEncrypted: true };
    }

    if (!payload.data || typeof payload.data !== "object") {
      return {
        valid: false,
        error: "Missing 'data' container in payload",
        errors: ["Missing 'data' container in payload"],
      };
    }

    if (!Array.isArray(payload.data.habits)) {
      return {
        valid: false,
        error: "'data.habits' must be an array",
        errors: ["'data.habits' must be an array"],
      };
    }

    return { valid: true, payload, isEncrypted: false };
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
        errors: result.errors || [result.error],
        data: null,
        isEncrypted: !!result.isEncrypted,
      };
    }
    if (result.isEncrypted) {
      return {
        valid: true,
        isEncrypted: true,
        payload: result.payload,
        data: null,
      };
    }
    return {
      valid: true,
      data: result.payload.data,
      payload: result.payload,
      isEncrypted: false,
    };
  }

  /**
   * Inspects incoming import data against current state, producing diff statistics
   */
  function inspectImportPayload(incomingData, currentState) {
    const incoming =
      incomingData && incomingData.data
        ? incomingData.data
        : incomingData || {};
    const base = currentState || {
      habits: {},
      logs: {},
      settings: {},
      vacations: [],
    };

    const incomingHabits = Array.isArray(incoming.habits)
      ? incoming.habits
      : incoming.habits && typeof incoming.habits === "object"
        ? Object.values(incoming.habits)
        : [];
    const incomingLogs = Array.isArray(incoming.logs)
      ? incoming.logs
      : incoming.logs && typeof incoming.logs === "object"
        ? Object.values(incoming.logs)
        : [];
    const incomingSettings = incoming.settings || {};
    const incomingVacations = Array.isArray(incoming.vacations)
      ? incoming.vacations
      : Array.isArray(incoming.vacationRanges)
        ? incoming.vacationRanges
        : [];

    const localHabitsMap = new Map();
    if (Array.isArray(base.habits)) {
      base.habits.forEach((h) => {
        if (h && h.id) localHabitsMap.set(h.id, h);
      });
    } else if (base.habits && typeof base.habits === "object") {
      Object.values(base.habits).forEach((h) => {
        if (h && h.id) localHabitsMap.set(h.id, h);
      });
    }

    let newHabitsCount = 0;
    let updatedHabitsCount = 0;
    incomingHabits.forEach((h) => {
      if (h && h.id && localHabitsMap.has(h.id)) {
        updatedHabitsCount++;
      } else {
        newHabitsCount++;
      }
    });

    // Calculate date span
    let minDate = null;
    let maxDate = null;
    incomingLogs.forEach((l) => {
      if (l && l.date) {
        if (!minDate || l.date < minDate) minDate = l.date;
        if (!maxDate || l.date > maxDate) maxDate = l.date;
      }
    });

    const localLogsCount = Array.isArray(base.logs)
      ? base.logs.length
      : Object.keys(base.logs || {}).length;

    return {
      incomingHabitsCount: incomingHabits.length,
      newHabitsCount,
      updatedHabitsCount,
      incomingLogsCount: incomingLogs.length,
      dateSpan: minDate && maxDate ? { minDate, maxDate } : null,
      incomingVacationsCount: incomingVacations.length,
      settingsCount: Object.keys(incomingSettings).length,
      localHabitsCount: localHabitsMap.size,
      localLogsCount,
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
      const nextVacations = [
        ...(incoming.vacations || incoming.vacationRanges || []),
      ];

      if (Array.isArray(incoming.habits)) {
        incoming.habits.forEach((h) => {
          if (h && h.id) nextHabits[h.id] = h;
        });
      } else if (incoming.habits && typeof incoming.habits === "object") {
        Object.values(incoming.habits).forEach((h) => {
          if (h && h.id) nextHabits[h.id] = h;
        });
      }

      if (Array.isArray(incoming.logs)) {
        incoming.logs.forEach((l) => {
          const key = l.id || `${l.habitId}_${l.date}`;
          if (key) nextLogs[key] = l;
        });
      } else if (incoming.logs && typeof incoming.logs === "object") {
        Object.values(incoming.logs).forEach((l) => {
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
    const baseHabitsMap = {};
    if (Array.isArray(base.habits)) {
      base.habits.forEach((h) => {
        if (h && h.id) baseHabitsMap[h.id] = h;
      });
    } else if (base.habits && typeof base.habits === "object") {
      Object.values(base.habits).forEach((h) => {
        if (h && h.id) baseHabitsMap[h.id] = h;
      });
    }

    const baseLogsMap = {};
    if (Array.isArray(base.logs)) {
      base.logs.forEach((l) => {
        if (l) {
          const key = l.id || `${l.habitId}_${l.date}`;
          if (key) baseLogsMap[key] = l;
        }
      });
    } else if (base.logs && typeof base.logs === "object") {
      Object.keys(base.logs).forEach((k) => {
        const l = base.logs[k];
        if (l) {
          const key = l.id || `${l.habitId}_${l.date}` || k;
          baseLogsMap[key] = l;
        }
      });
    }

    const mergedHabits = { ...baseHabitsMap };
    const mergedLogs = { ...baseLogsMap };
    const mergedSettings = {
      ...(base.settings || {}),
      ...(incoming.settings || {}),
    };
    const mergedVacations = Array.isArray(base.vacations)
      ? [...base.vacations]
      : Array.isArray(base.settings && base.settings.vacationRanges)
        ? [...base.settings.vacationRanges]
        : [];

    if (Array.isArray(incoming.habits)) {
      incoming.habits.forEach((h) => {
        if (h && h.id) mergedHabits[h.id] = h;
      });
    } else if (incoming.habits && typeof incoming.habits === "object") {
      Object.values(incoming.habits).forEach((h) => {
        if (h && h.id) mergedHabits[h.id] = h;
      });
    }

    if (Array.isArray(incoming.logs)) {
      incoming.logs.forEach((l) => {
        const key = l.id || `${l.habitId}_${l.date}`;
        if (key) mergedLogs[key] = l;
      });
    } else if (incoming.logs && typeof incoming.logs === "object") {
      Object.values(incoming.logs).forEach((l) => {
        const key = l.id || `${l.habitId}_${l.date}`;
        if (key) mergedLogs[key] = l;
      });
    }

    const incomingVacationsList = Array.isArray(incoming.vacations)
      ? incoming.vacations
      : Array.isArray(incoming.vacationRanges)
        ? incoming.vacationRanges
        : [];

    incomingVacationsList.forEach((v) => {
      if (v && v.id && !mergedVacations.some((mv) => mv.id === v.id)) {
        mergedVacations.push(v);
      }
    });

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
    copyJsonToClipboard,
    readJsonFromClipboard,
    validateImportJson,
    parseAndValidateImport,
    inspectImportPayload,
    mergeHabitStates,
    importFromJson,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportImportExports;
  }
  global.HabitExportImport = exportImportExports;
  global.exportImport = exportImportExports;
})(typeof window !== "undefined" ? window : globalThis);
