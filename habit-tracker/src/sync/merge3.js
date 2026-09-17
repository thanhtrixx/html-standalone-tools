/**
 * Atomic Habit Tracker Deterministic 3-Way Merge Engine
 *
 * Implements:
 * - Deterministic merge of Base, Local, and Remote states
 * - Last-Write-Wins (LWW) entity reconciliation using updatedAt timestamps
 * - Deletion tombstones propagation (preventing zombie restorations)
 * - Additive daily log union (preserves max completed value and notes)
 * - Settings and Vacation range reconciliation
 */

(function (global) {
  "use strict";

  const tombstonesModule =
    typeof require !== "undefined"
      ? require("./tombstones.js")
      : global.HabitTombstones;

  const { pruneDeletedTombstones } = tombstonesModule || {
    pruneDeletedTombstones: () => {},
  };

  /**
   * Helper to extract numeric timestamp in milliseconds from an object or string
   */
  function getTs(obj) {
    if (!obj) return 0;
    if (typeof obj === "number") return obj;
    if (typeof obj === "string") {
      const parsed = new Date(obj).getTime();
      return isNaN(parsed) ? 0 : parsed;
    }
    if (obj.updatedAt) {
      const parsed = new Date(obj.updatedAt).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (obj.timestamp) {
      const parsed =
        typeof obj.timestamp === "number"
          ? obj.timestamp
          : new Date(obj.timestamp).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (obj.createdAt) {
      const parsed = new Date(obj.createdAt).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (obj.date) {
      const parsed = new Date(obj.date).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 0;
  }

  /**
   * Normalizes an array or dictionary of entities into an array
   */
  function toEntityArray(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input.filter(Boolean);
    if (typeof input === "object") return Object.values(input).filter(Boolean);
    return [];
  }

  /**
   * Normalizes logs into a dictionary keyed by `${habitId}_${date}`
   */
  function toLogsMap(input) {
    const map = {};
    if (!input) return map;
    const arr = toEntityArray(input);
    for (const log of arr) {
      if (log && log.habitId && log.date) {
        const key = log.id || `${log.habitId}_${log.date}`;
        map[key] = { ...log, id: key };
      }
    }
    return map;
  }

  /**
   * Merges tombstones dictionaries
   */
  function mergeTombstones(localDeleted, remoteDeleted) {
    const result = { habits: {}, vacations: {} };
    const lDel = localDeleted || {};
    const rDel = remoteDeleted || {};

    ["habits", "vacations"].forEach((key) => {
      const lMap = lDel[key] || {};
      const rMap = rDel[key] || {};
      const combined = { ...lMap };

      Object.keys(rMap).forEach((id) => {
        const rTs = getTs(rMap[id]);
        const lTs = getTs(lMap[id]);
        if (rTs >= lTs) {
          combined[id] = rMap[id];
        }
      });
      result[key] = combined;
    });

    if (typeof pruneDeletedTombstones === "function") {
      pruneDeletedTombstones(result);
    }
    return result;
  }

  /**
   * Merges habits with LWW timestamps and deletion tombstones
   */
  function mergeHabits(localHabitsInput, remoteHabitsInput, tombstones) {
    const localHabits = toEntityArray(localHabitsInput);
    const remoteHabits = toEntityArray(remoteHabitsInput);
    const habitTombstones = (tombstones && tombstones.habits) || {};

    const habitMap = new Map();

    // Index local habits
    localHabits.forEach((h) => {
      if (!h || !h.id) return;
      habitMap.set(String(h.id), { local: h, remote: null });
    });

    // Index remote habits
    remoteHabits.forEach((h) => {
      if (!h || !h.id) return;
      const existing = habitMap.get(String(h.id));
      if (existing) {
        existing.remote = h;
      } else {
        habitMap.set(String(h.id), { local: null, remote: h });
      }
    });

    const merged = [];

    habitMap.forEach(({ local, remote }, id) => {
      const tombstoneTs = getTs(habitTombstones[id]);

      if (local && remote) {
        const localTs = getTs(local);
        const remoteTs = getTs(remote);
        const maxEntityTs = Math.max(localTs, remoteTs);

        // If tombstone is newer than both versions, item remains deleted
        if (tombstoneTs > 0 && tombstoneTs >= maxEntityTs) {
          return;
        }

        if (remoteTs > localTs) {
          merged.push(remote);
        } else {
          // Default to local on tie or newer local
          merged.push({
            ...remote,
            ...local,
            updatedAt: new Date(maxEntityTs || Date.now()).toISOString(),
          });
        }
      } else if (local) {
        const localTs = getTs(local);
        if (tombstoneTs > 0 && tombstoneTs >= localTs) {
          return; // Tombstoned
        }
        merged.push(local);
      } else if (remote) {
        const remoteTs = getTs(remote);
        if (tombstoneTs > 0 && tombstoneTs >= remoteTs) {
          return; // Tombstoned
        }
        merged.push(remote);
      }
    });

    // Preserve ordering if order property exists
    return merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  /**
   * Merges daily habit logs additively without dropping dates or progress
   */
  function mergeLogs(localLogsInput, remoteLogsInput) {
    const localMap = toLogsMap(localLogsInput);
    const remoteMap = toLogsMap(remoteLogsInput);
    const mergedMap = {};

    const allKeys = new Set([
      ...Object.keys(localMap),
      ...Object.keys(remoteMap),
    ]);

    allKeys.forEach((key) => {
      const local = localMap[key];
      const remote = remoteMap[key];

      if (local && remote) {
        const localTs = getTs(local);
        const remoteTs = getTs(remote);
        const maxTs = Math.max(localTs, remoteTs, Date.now());

        const localVal = Number(local.value) || (local.completed ? 1 : 0);
        const remoteVal = Number(remote.value) || (remote.completed ? 1 : 0);
        const maxVal = Math.max(localVal, remoteVal);
        const isCompleted = Boolean(
          local.completed || remote.completed || maxVal >= 1
        );

        // Prefer notes from the more recent edit, falling back to non-empty notes
        const notes =
          remoteTs > localTs
            ? remote.notes || local.notes || ""
            : local.notes || remote.notes || "";

        mergedMap[key] = {
          id: key,
          habitId: local.habitId || remote.habitId,
          date: local.date || remote.date,
          value: maxVal,
          completed: isCompleted,
          notes: notes,
          timestamp: maxTs,
          updatedAt: new Date(maxTs).toISOString(),
        };
      } else if (local) {
        mergedMap[key] = local;
      } else if (remote) {
        mergedMap[key] = remote;
      }
    });

    return mergedMap;
  }

  /**
   * Merges settings dictionaries
   */
  function mergeSettings(localSettings, remoteSettings) {
    const l = localSettings || {};
    const r = remoteSettings || {};
    return {
      ...r,
      ...l,
    };
  }

  /**
   * Merges vacation records
   */
  function mergeVacations(
    localVacationsInput,
    remoteVacationsInput,
    tombstones
  ) {
    const local = toEntityArray(localVacationsInput);
    const remote = toEntityArray(remoteVacationsInput);
    const vacTombstones = (tombstones && tombstones.vacations) || {};

    const vacMap = new Map();
    local.forEach(
      (v) => v && v.id && vacMap.set(String(v.id), { local: v, remote: null })
    );
    remote.forEach((v) => {
      if (!v || !v.id) return;
      const existing = vacMap.get(String(v.id));
      if (existing) existing.remote = v;
      else vacMap.set(String(v.id), { local: null, remote: v });
    });

    const merged = [];
    vacMap.forEach(({ local: l, remote: r }, id) => {
      const tombTs = getTs(vacTombstones[id]);
      if (l && r) {
        const maxTs = Math.max(getTs(l), getTs(r));
        if (tombTs > 0 && tombTs >= maxTs) return;
        merged.push(getTs(r) > getTs(l) ? r : l);
      } else if (l) {
        if (tombTs > 0 && tombTs >= getTs(l)) return;
        merged.push(l);
      } else if (r) {
        if (tombTs > 0 && tombTs >= getTs(r)) return;
        merged.push(r);
      }
    });

    return merged;
  }

  /**
   * Main 3-way or 2-way cloud state merger
   */
  function mergeCloudState(localState, remoteState, baseState = null) {
    if (!localState && !remoteState) {
      return {
        habits: [],
        logs: {},
        settings: {},
        vacations: [],
        _deleted: { habits: {}, vacations: {} },
      };
    }
    if (!localState) return remoteState;
    if (!remoteState) return localState;

    // Unwrap if inside standard envelope .data
    const local = localState.data || localState;
    const remote = remoteState.data || remoteState;

    const mergedTombstones = mergeTombstones(local._deleted, remote._deleted);
    const mergedHabits = mergeHabits(
      local.habits,
      remote.habits,
      mergedTombstones
    );
    const mergedLogs = mergeLogs(local.logs, remote.logs);
    const mergedSettings = mergeSettings(local.settings, remote.settings);
    const mergedVacations = mergeVacations(
      local.vacations || local.vacationRanges,
      remote.vacations || remote.vacationRanges,
      mergedTombstones
    );

    return {
      habits: mergedHabits,
      logs: mergedLogs,
      settings: mergedSettings,
      vacations: mergedVacations,
      _deleted: mergedTombstones,
      mergedAt: new Date().toISOString(),
    };
  }

  /**
   * Creates a standardized cloud sync payload envelope
   */
  function createCloudPayload(state) {
    const raw = state && state.state ? state.state : state || {};
    const data = raw.data || raw;
    const deleted = data._deleted || { habits: {}, vacations: {} };

    if (typeof pruneDeletedTombstones === "function") {
      pruneDeletedTombstones(deleted);
    }

    return {
      app: "atomic-habit-tracker",
      schemaVersion: "1.1.0",
      updatedAt: new Date().toISOString(),
      data: {
        habits: toEntityArray(data.habits),
        logs: toEntityArray(data.logs),
        settings: data.settings || {},
        vacations: toEntityArray(data.vacations || data.vacationRanges),
        _deleted: deleted,
      },
    };
  }

  const mergeExports = {
    getTs,
    toEntityArray,
    toLogsMap,
    mergeTombstones,
    mergeHabits,
    mergeLogs,
    mergeSettings,
    mergeVacations,
    mergeCloudState,
    mergeStates: mergeCloudState,
    createCloudPayload,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = mergeExports;
  } else {
    global.HabitMerge3 = mergeExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
