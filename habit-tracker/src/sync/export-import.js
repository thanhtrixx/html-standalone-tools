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

  /**
   * Universal CSV parser supporting standard RFC-4180 quotes, multiline values, and auto-delimiter detection (, ; \t)
   */
  function parseCsvTokens(text) {
    let clean = (text || "").replace(/^\uFEFF/, ""); // Strip UTF-8 BOM
    if (!clean.trim()) return [];

    // Auto-detect delimiter from first non-empty line
    const firstLine = clean.split(/\r?\n/)[0] || "";
    let delimiter = ",";
    const commas = (firstLine.match(/,/g) || []).length;
    const semis = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    if (semis > commas && semis >= tabs) delimiter = ";";
    else if (tabs > commas && tabs > semis) delimiter = "\t";

    const rows = [];
    let currentRow = [];
    let currentCell = "";
    let inQuotes = false;

    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      const next = clean[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          currentCell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          currentCell += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === delimiter) {
          currentRow.push(currentCell.trim());
          currentCell = "";
        } else if (ch === "\r" && next === "\n") {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = "";
          i++;
        } else if (ch === "\n" || ch === "\r") {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = "";
        } else {
          currentCell += ch;
        }
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }

    return rows.filter((r) => r.length > 0 && r.some((c) => c.length > 0));
  }

  /**
   * Normalizes arbitrary date strings from CSV to standard YYYY-MM-DD
   */
  function normalizeCsvDate(str) {
    if (!str) return null;
    const trimmed = str.trim();
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    // YYYY/MM/DD
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
      return trimmed.replace(/\//g, "-");
    }
    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, "0");
      const month = dmy[2].padStart(2, "0");
      const year = dmy[3];
      return `${year}-${month}-${day}`;
    }
    // Try Date parse
    try {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    } catch (e) {}
    return null;
  }

  /**
   * Universal CSV parser for Habit Tracker supporting both Tabular and Wide Matrix (Loop) formats
   */
  function parseHabitCsv(rawCsvText) {
    const rows = parseCsvTokens(rawCsvText);
    if (!rows || rows.length < 2) {
      return {
        valid: false,
        error: "CSV file is empty or missing data rows",
        errors: ["CSV file is empty or missing data rows"],
        data: null,
      };
    }

    const headers = rows[0].map((h) => (h || "").toLowerCase().trim());

    // Check if wide matrix format (Loop Habit Tracker format: Date in col 0, habit names in col 1..N)
    const isFirstColDate = [
      "date",
      "ngày",
      "day",
      "timestamp",
      "time",
    ].includes(headers[0]);
    const standardHeaderKeywords = [
      "habit",
      "habit name",
      "name",
      "habit id",
      "id",
      "value",
      "logged value",
      "target",
      "target value",
      "unit",
      "status",
      "completed",
      "notes",
      "note",
      "streaks",
      "adherence",
      "adherence %",
      "domain",
      "routine",
      "type",
      "thói quen",
      "tên thói quen",
      "ghi chú",
      "hoàn thành",
    ];

    const nonStandardCols = headers
      .slice(1)
      .filter((h) => !standardHeaderKeywords.includes(h));
    const isMatrixFormat =
      isFirstColDate && headers.length > 2 && nonStandardCols.length >= 2;

    const habitsMap = new Map();
    const logsMap = new Map();

    const generateIdFromName = (name) => {
      const clean = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return `habit-${clean || Date.now().toString(36)}`;
    };

    if (isMatrixFormat) {
      // Wide format: each column (1..N) is a habit!
      for (let j = 1; j < rows[0].length; j++) {
        const habitName = rows[0][j] || `Habit ${j}`;
        const habitId = generateIdFromName(habitName);
        if (!habitsMap.has(habitId)) {
          habitsMap.set(habitId, {
            id: habitId,
            name: habitName,
            type: "binary",
            domain: "health",
            routines: ["anytime"],
            routine: "anytime",
            targetValue: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const dateStr = normalizeCsvDate(row[0]);
        if (!dateStr) continue;

        for (let j = 1; j < rows[0].length; j++) {
          const habitName = rows[0][j] || `Habit ${j}`;
          const habitId = generateIdFromName(habitName);
          const cell = (row[j] || "").trim();
          if (!cell || cell === "-" || cell === "0") continue;

          const numVal = parseFloat(cell);
          const isCompleted =
            cell.toLowerCase() === "true" ||
            cell.toLowerCase() === "yes" ||
            cell.toLowerCase() === "x" ||
            cell.toLowerCase() === "v" ||
            (!isNaN(numVal) && numVal > 0);
          const val = !isNaN(numVal) ? numVal : isCompleted ? 1 : 0;

          const logKey = `${habitId}_${dateStr}`;
          logsMap.set(logKey, {
            id: logKey,
            habitId: habitId,
            date: dateStr,
            value: val,
            completed: isCompleted,
            notes: "",
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } else {
      // Row-per-entry tabular format
      let dateIdx = headers.findIndex((h) =>
        ["date", "ngày", "day", "timestamp", "time"].includes(h)
      );
      let nameIdx = headers.findIndex((h) =>
        [
          "habit name",
          "habit",
          "name",
          "thói quen",
          "tên thói quen",
          "title",
          "tên",
        ].includes(h)
      );
      let idIdx = headers.findIndex((h) =>
        ["habit id", "id", "mã", "habit_id"].includes(h)
      );
      let valIdx = headers.findIndex((h) =>
        [
          "logged value",
          "value",
          "giá trị",
          "progress",
          "amount",
          "số lượng",
        ].includes(h)
      );
      let completedIdx = headers.findIndex((h) =>
        [
          "completed",
          "status",
          "hoàn thành",
          "done",
          "check",
          "trạng thái",
        ].includes(h)
      );
      let notesIdx = headers.findIndex((h) =>
        [
          "notes",
          "note",
          "ghi chú",
          "journal",
          "comment",
          "description",
        ].includes(h)
      );
      let targetIdx = headers.findIndex((h) =>
        ["target value", "target", "mục tiêu", "chỉ tiêu"].includes(h)
      );
      let unitIdx = headers.findIndex((h) => ["unit", "đơn vị"].includes(h));
      let domainIdx = headers.findIndex((h) =>
        ["domain", "lĩnh vực", "category", "danh mục"].includes(h)
      );
      let routineIdx = headers.findIndex((h) =>
        ["routine", "buổi", "routines", "time of day"].includes(h)
      );
      let typeIdx = headers.findIndex((h) => ["type", "loại"].includes(h));

      if (dateIdx === -1 && nameIdx === -1) {
        // Fallback: assume col 0 is date, col 1 is habit name
        dateIdx = 0;
        nameIdx = 1;
      }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rawDate = dateIdx >= 0 ? row[dateIdx] : null;
        const dateStr = normalizeCsvDate(rawDate);
        if (!dateStr) continue;

        const habitName =
          (nameIdx >= 0 && row[nameIdx] && row[nameIdx].trim()) ||
          (idIdx >= 0 && row[idIdx] && row[idIdx].trim()) ||
          "Imported Habit";
        const habitId =
          (idIdx >= 0 && row[idIdx] && row[idIdx].trim()) ||
          generateIdFromName(habitName);

        const targetVal =
          targetIdx >= 0 && row[targetIdx]
            ? parseFloat(row[targetIdx]) || 1
            : 1;
        const unitVal = unitIdx >= 0 && row[unitIdx] ? row[unitIdx].trim() : "";
        const domainVal =
          domainIdx >= 0 && row[domainIdx] ? row[domainIdx].trim() : "health";
        const routineVal =
          routineIdx >= 0 && row[routineIdx]
            ? row[routineIdx].trim()
            : "anytime";
        const typeVal =
          typeIdx >= 0 && row[typeIdx] ? row[typeIdx].trim() : "binary";

        if (!habitsMap.has(habitId)) {
          habitsMap.set(habitId, {
            id: habitId,
            name: habitName,
            type: typeVal,
            domain: domainVal,
            routines: [routineVal],
            routine: routineVal,
            targetValue: targetVal,
            unit: unitVal,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        const rawVal = valIdx >= 0 ? row[valIdx] : null;
        const rawCompleted = completedIdx >= 0 ? row[completedIdx] : null;
        const numVal = rawVal ? parseFloat(rawVal) : NaN;

        let isCompleted = false;
        if (rawCompleted) {
          const compLower = String(rawCompleted).toLowerCase().trim();
          isCompleted = [
            "true",
            "yes",
            "1",
            "completed",
            "done",
            "x",
            "v",
          ].includes(compLower);
        } else if (!isNaN(numVal)) {
          isCompleted = numVal >= targetVal;
        } else {
          isCompleted = true;
        }

        const val = !isNaN(numVal) ? numVal : isCompleted ? targetVal : 0;
        const notes =
          notesIdx >= 0 && row[notesIdx] ? row[notesIdx].trim() : "";

        const logKey = `${habitId}_${dateStr}`;
        logsMap.set(logKey, {
          id: logKey,
          habitId: habitId,
          date: dateStr,
          value: val,
          completed: isCompleted,
          notes: notes,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const habits = Array.from(habitsMap.values());
    const logs = Array.from(logsMap.values());

    if (habits.length === 0 && logs.length === 0) {
      return {
        valid: false,
        error: "No valid habit logs could be parsed from the CSV file",
        errors: ["No valid habit logs could be parsed from the CSV file"],
        data: null,
      };
    }

    return {
      valid: true,
      data: {
        habits,
        logs,
        settings: {},
        vacations: [],
      },
    };
  }

  /**
   * Converts habit logs and metadata into standardized UTF-8 CSV string
   */
  function exportToCsv(storeOrState) {
    const payload = formatExportPayload(storeOrState);
    const habitsMap = {};
    const habitLogsMap = {};

    (payload.data.habits || []).forEach((h) => {
      habitsMap[h.id] = h;
      habitLogsMap[h.id] = [];
    });

    const logs = payload.data.logs || [];
    logs.forEach((l) => {
      if (l && l.habitId) {
        if (!habitLogsMap[l.habitId]) habitLogsMap[l.habitId] = [];
        habitLogsMap[l.habitId].push(l);
      }
    });

    // Calculate completion rates and current streaks per habit
    const statsMap = {};
    for (const habitId in habitLogsMap) {
      const hLogs = habitLogsMap[habitId];
      const completedCount = hLogs.filter((l) => l.completed).length;
      const adherencePct =
        hLogs.length > 0
          ? Math.round((completedCount / hLogs.length) * 100)
          : 0;
      statsMap[habitId] = {
        adherencePct: `${adherencePct}%`,
        streak: completedCount,
      };
    }

    const headers = [
      "Date",
      "Habit ID",
      "Habit Name",
      "Domain",
      "Routine",
      "Type",
      "Target Value",
      "Logged Value",
      "Unit",
      "Status",
      "Notes",
      "Streaks",
      "Adherence %",
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const rows = [headers.map(escapeCsv).join(",")];

    const sortedLogs = [...logs].sort((a, b) =>
      (b.date || "").localeCompare(a.date || "")
    );

    for (const log of sortedLogs) {
      const habit = habitsMap[log.habitId] || {};
      const stats = statsMap[log.habitId] || { adherencePct: "0%", streak: 0 };
      const statusText = log.completed ? "Completed" : "Incomplete";

      const row = [
        escapeCsv(log.date || ""),
        escapeCsv(log.habitId || ""),
        escapeCsv(habit.name || log.habitId || ""),
        escapeCsv(habit.domain || "health"),
        escapeCsv(
          (habit.routines && habit.routines.join("; ")) ||
            habit.routine ||
            "anytime"
        ),
        escapeCsv(habit.type || "binary"),
        escapeCsv(habit.targetValue || 1),
        escapeCsv(log.value !== undefined ? log.value : log.completed ? 1 : 0),
        escapeCsv(habit.unit || ""),
        escapeCsv(statusText),
        escapeCsv(log.notes || ""),
        escapeCsv(stats.streak),
        escapeCsv(stats.adherencePct),
      ];
      rows.push(row.join(","));
    }

    return rows.join("\r\n");
  }

  /**
   * Triggers browser download of standardized CSV file with UTF-8 BOM
   */
  function downloadExportCSV(storeOrState, customFilename = null) {
    const csvContent = exportToCsv(storeOrState);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename =
      customFilename || `atomic-habit-tracker-export-${dateStr}.csv`;

    if (typeof document !== "undefined" && typeof Blob !== "undefined") {
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
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
        if (a.parentNode) {
          a.parentNode.removeChild(a);
        }
        if (typeof URL !== "undefined" && URL.revokeObjectURL) {
          URL.revokeObjectURL(url);
        }
      }, 500);
    }

    return { filename, content: csvContent };
  }

  const exportImportExports = {
    APP_IDENTIFIER,
    SCHEMA_VERSION,
    exportToJson,
    formatExportPayload,
    downloadExportJSON,
    exportToCsv,
    downloadExportCSV,
    parseCsvTokens,
    normalizeCsvDate,
    parseHabitCsv,
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
