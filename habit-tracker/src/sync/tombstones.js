/**
 * Atomic Habit Tracker Deletion Tombstones
 *
 * Implements:
 * - 30-day TTL for deletion tombstones
 * - Timestamp recording for deleted habits and vacations
 * - Entity touching (createdAt / updatedAt) and revival handling
 */

(function (global) {
  "use strict";

  const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  function pruneDeletedTombstones(deletedDict, nowMs = Date.now()) {
    if (!deletedDict || typeof deletedDict !== "object") return;
    ["habits", "vacations"].forEach((key) => {
      const map = deletedDict[key];
      if (map && typeof map === "object") {
        Object.keys(map).forEach((id) => {
          const ts = new Date(map[id]).getTime() || 0;
          if (nowMs - ts > TOMBSTONE_TTL_MS) {
            delete map[id];
          }
        });
      } else {
        deletedDict[key] = {};
      }
    });
  }

  function touchEntity(entity, deletedDict = null) {
    if (!entity || typeof entity !== "object") return entity;
    const nowIso = new Date().toISOString();
    if (!entity.createdAt) entity.createdAt = nowIso;
    entity.updatedAt = nowIso;
    if (
      deletedDict &&
      deletedDict.habits &&
      entity.id &&
      deletedDict.habits[String(entity.id)]
    ) {
      delete deletedDict.habits[String(entity.id)];
    }
    return entity;
  }

  function recordDeletedHabit(id, deletedDict) {
    if (!id || !deletedDict) return;
    if (!deletedDict.habits) deletedDict.habits = {};
    deletedDict.habits[String(id)] = new Date().toISOString();
  }

  function recordDeletedVacation(id, deletedDict) {
    if (!id || !deletedDict) return;
    if (!deletedDict.vacations) deletedDict.vacations = {};
    deletedDict.vacations[String(id)] = new Date().toISOString();
  }

  const tombstoneExports = {
    TOMBSTONE_TTL_MS,
    pruneDeletedTombstones,
    touchEntity,
    recordDeletedHabit,
    recordDeletedVacation,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = tombstoneExports;
  } else {
    global.HabitTombstones = tombstoneExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
