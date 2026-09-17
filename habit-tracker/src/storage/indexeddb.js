/**
 * Atomic Habit Tracker Local-First IndexedDB Storage Subsystem
 *
 * Implements:
 * - Asynchronous IndexedDB storage adapter (stores: habits, logs, settings, routines, vacations)
 * - Transparent LocalStorage fallback adapter for private/restricted browsing modes
 * - Silent auto-migration from legacy schemas
 */

(function (global) {
  "use strict";

  const DB_NAME = "habit_tracker_db";
  const DB_VERSION = 2;

  const STORES = {
    HABITS: "habits",
    LOGS: "logs",
    SETTINGS: "settings",
    ROUTINES: "routines",
    VACATIONS: "vacations",
    SNAPSHOTS: "snapshots",
  };

  /**
   * Creates an in-memory/localStorage fallback storage adapter
   */
  function createFallbackAdapter(options = {}) {
    const storage =
      options.fallbackStorage ||
      (typeof window !== "undefined" ? window.localStorage : null);
    const inMemory = {};

    function readJson(key, defaultVal) {
      if (storage) {
        try {
          const raw = storage.getItem(key);
          if (raw) return JSON.parse(raw);
        } catch (e) {}
      }
      return inMemory[key] !== undefined ? inMemory[key] : defaultVal;
    }

    function writeJson(key, val) {
      inMemory[key] = val;
      if (storage) {
        try {
          storage.setItem(key, JSON.stringify(val));
        } catch (e) {}
      }
    }

    const adapter = {
      isFallback: true,

      async init() {
        await this.runSilentMigration();
        return true;
      },

      async getHabit(id) {
        const habits = readJson(STORES.HABITS, []);
        return habits.find((h) => h.id === id) || null;
      },

      async putHabit(habit) {
        const habits = readJson(STORES.HABITS, []);
        const idx = habits.findIndex((h) => h.id === habit.id);
        if (idx >= 0) habits[idx] = habit;
        else habits.push(habit);
        writeJson(STORES.HABITS, habits);
        return habit;
      },

      async deleteHabit(id) {
        const habits = readJson(STORES.HABITS, []);
        const filtered = habits.filter((h) => h.id !== id);
        writeJson(STORES.HABITS, filtered);
        // Also remove associated logs
        const logs = readJson(STORES.LOGS, []);
        writeJson(
          STORES.LOGS,
          logs.filter((l) => l.habitId !== id)
        );
        return true;
      },

      async getAllHabits() {
        return readJson(STORES.HABITS, []);
      },

      async getLog(habitId, date) {
        const logs = readJson(STORES.LOGS, []);
        const logId = `${habitId}_${date}`;
        return (
          logs.find(
            (l) => l.id === logId || (l.habitId === habitId && l.date === date)
          ) || null
        );
      },

      async putLog(log) {
        const logs = readJson(STORES.LOGS, []);
        const id = log.id || `${log.habitId}_${log.date}`;
        const normalized = { ...log, id };
        const idx = logs.findIndex((l) => l.id === id);
        if (idx >= 0) logs[idx] = normalized;
        else logs.push(normalized);
        writeJson(STORES.LOGS, logs);
        return normalized;
      },

      async deleteLog(id) {
        const logs = readJson(STORES.LOGS, []);
        writeJson(
          STORES.LOGS,
          logs.filter((l) => l.id !== id)
        );
        return true;
      },

      async getAllLogs() {
        return readJson(STORES.LOGS, []);
      },

      async getLogsByHabit(habitId) {
        const logs = readJson(STORES.LOGS, []);
        return logs.filter((l) => l.habitId === habitId);
      },

      async getLogsByDate(date) {
        const logs = readJson(STORES.LOGS, []);
        return logs.filter((l) => l.date === date);
      },

      async getSetting(key, defaultVal = null) {
        const settings = readJson(STORES.SETTINGS, {});
        return settings[key] !== undefined ? settings[key] : defaultVal;
      },

      async putSetting(key, val) {
        const settings = readJson(STORES.SETTINGS, {});
        settings[key] = val;
        writeJson(STORES.SETTINGS, settings);
        return val;
      },

      async getAllSettings() {
        return readJson(STORES.SETTINGS, {});
      },

      async getVacations() {
        return readJson(STORES.VACATIONS, []);
      },

      async putVacation(vacation) {
        const vacations = readJson(STORES.VACATIONS, []);
        const normalized = {
          ...vacation,
          updatedAt: vacation.updatedAt || new Date().toISOString(),
        };
        const idx = vacations.findIndex((v) => v.id === normalized.id);
        if (idx >= 0) vacations[idx] = normalized;
        else vacations.push(normalized);
        writeJson(STORES.VACATIONS, vacations);
        return normalized;
      },

      async deleteVacation(id) {
        const vacations = readJson(STORES.VACATIONS, []);
        writeJson(
          STORES.VACATIONS,
          vacations.filter((v) => v.id !== id)
        );
        return true;
      },

      async getSnapshots() {
        const list = readJson(STORES.SNAPSHOTS, []);
        return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      },

      async putSnapshot(snapshot) {
        const list = readJson(STORES.SNAPSHOTS, []);
        const id = snapshot.id || `snap-${Date.now()}`;
        const item = {
          ...snapshot,
          id,
          timestamp: snapshot.timestamp || Date.now(),
        };
        const filtered = list.filter((s) => s.id !== id);
        filtered.unshift(item);
        const capped = filtered.slice(0, 5);
        writeJson(STORES.SNAPSHOTS, capped);
        return item;
      },

      async deleteSnapshot(id) {
        const list = readJson(STORES.SNAPSHOTS, []);
        writeJson(
          STORES.SNAPSHOTS,
          list.filter((s) => s.id !== id)
        );
        return true;
      },

      async clearSnapshots() {
        writeJson(STORES.SNAPSHOTS, []);
        return true;
      },

      async getDeletedTombstones() {
        const settings = readJson(STORES.SETTINGS, {});
        return settings._deleted || { habits: {}, vacations: {} };
      },

      async putDeletedTombstones(deletedDict) {
        const settings = readJson(STORES.SETTINGS, {});
        settings._deleted = deletedDict || { habits: {}, vacations: {} };
        writeJson(STORES.SETTINGS, settings);
        return settings._deleted;
      },

      async clearAll() {
        inMemory[STORES.HABITS] = [];
        inMemory[STORES.LOGS] = [];
        inMemory[STORES.SETTINGS] = {};
        inMemory[STORES.ROUTINES] = [];
        inMemory[STORES.VACATIONS] = [];
        inMemory[STORES.SNAPSHOTS] = [];
        if (storage) {
          try {
            storage.removeItem(STORES.HABITS);
            storage.removeItem(STORES.LOGS);
            storage.removeItem(STORES.SETTINGS);
            storage.removeItem(STORES.ROUTINES);
            storage.removeItem(STORES.VACATIONS);
            storage.removeItem(STORES.SNAPSHOTS);
          } catch (e) {}
        }
        return true;
      },

      async runSilentMigration() {
        if (!storage) return false;
        try {
          // Check for legacy atomic_habits_v0
          const legacyHabitsRaw = storage.getItem("atomic_habits_v0");
          if (legacyHabitsRaw) {
            const legacyHabits = JSON.parse(legacyHabitsRaw);
            if (Array.isArray(legacyHabits)) {
              for (const item of legacyHabits) {
                const migrated = {
                  id:
                    item.id ||
                    `legacy-${Math.random().toString(36).slice(2, 7)}`,
                  name: item.name || item.title || "Untitled Habit",
                  type: item.type || (item.count > 1 ? "numeric" : "binary"),
                  targetValue: item.targetValue || item.count || 1,
                  unit: item.unit || "",
                  routine: item.routine || "anytime",
                  scheduleType: item.scheduleType || "daily",
                  createdAt: item.createdAt || "2026-09-01",
                };
                await this.putHabit(migrated);
              }
            }
            storage.removeItem("atomic_habits_v0");
          }

          // Check for legacy atomic_logs_v0
          const legacyLogsRaw = storage.getItem("atomic_logs_v0");
          if (legacyLogsRaw) {
            const legacyLogs = JSON.parse(legacyLogsRaw);
            for (const key in legacyLogs) {
              const [habitId, date] = key.split("_");
              const entry = legacyLogs[key];
              await this.putLog({
                id: key,
                habitId: habitId || "unknown",
                date: date || "2026-09-01",
                value: entry.check || entry.value || 1,
                completed: !!(entry.check || entry.completed),
                notes: entry.text || entry.notes || "",
                timestamp: Date.now(),
              });
            }
            storage.removeItem("atomic_logs_v0");
          }
        } catch (e) {
          console.warn("[SilentMigration] Warning during legacy migration:", e);
        }
        return true;
      },
    };

    return adapter;
  }

  /**
   * IndexedDB Storage Adapter
   */
  function createIndexedDbAdapter(options = {}) {
    let dbInstance = null;

    function openDb() {
      if (dbInstance) return Promise.resolve(dbInstance);

      return new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
          return reject(new Error("IndexedDB not available"));
        }

        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORES.HABITS)) {
            db.createObjectStore(STORES.HABITS, { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains(STORES.LOGS)) {
            const logStore = db.createObjectStore(STORES.LOGS, {
              keyPath: "id",
            });
            logStore.createIndex("by_habit", "habitId", { unique: false });
            logStore.createIndex("by_date", "date", { unique: false });
          }
          if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
            db.createObjectStore(STORES.SETTINGS, { keyPath: "key" });
          }
          if (!db.objectStoreNames.contains(STORES.ROUTINES)) {
            db.createObjectStore(STORES.ROUTINES, { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains(STORES.VACATIONS)) {
            db.createObjectStore(STORES.VACATIONS, { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
            db.createObjectStore(STORES.SNAPSHOTS, { keyPath: "id" });
          }
        };

        req.onsuccess = (e) => {
          dbInstance = e.target.result;
          resolve(dbInstance);
        };

        req.onerror = (e) => {
          reject(e.target.error || new Error("Failed to open IndexedDB"));
        };
      });
    }

    const adapter = {
      isFallback: false,

      async init() {
        await openDb();
        await this.runSilentMigration();
        return true;
      },

      async getHabit(id) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.HABITS, "readonly");
          const req = tx.objectStore(STORES.HABITS).get(id);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });
      },

      async putHabit(habit) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.HABITS, "readwrite");
          const req = tx.objectStore(STORES.HABITS).put(habit);
          req.onsuccess = () => resolve(habit);
          req.onerror = () => reject(req.error);
        });
      },

      async deleteHabit(id) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction([STORES.HABITS, STORES.LOGS], "readwrite");
          tx.objectStore(STORES.HABITS).delete(id);

          // Delete all associated logs
          const logStore = tx.objectStore(STORES.LOGS);
          const index = logStore.index("by_habit");
          const req = index.openKeyCursor(IDBKeyRange.only(id));
          req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
              logStore.delete(cursor.primaryKey);
              cursor.continue();
            }
          };

          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        });
      },

      async getAllHabits() {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.HABITS, "readonly");
          const req = tx.objectStore(STORES.HABITS).getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      },

      async getLog(habitId, date) {
        const db = await openDb();
        const id = `${habitId}_${date}`;
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.LOGS, "readonly");
          const req = tx.objectStore(STORES.LOGS).get(id);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });
      },

      async putLog(log) {
        const db = await openDb();
        const id = log.id || `${log.habitId}_${log.date}`;
        const normalized = { ...log, id };
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.LOGS, "readwrite");
          const req = tx.objectStore(STORES.LOGS).put(normalized);
          req.onsuccess = () => resolve(normalized);
          req.onerror = () => reject(req.error);
        });
      },

      async deleteLog(id) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.LOGS, "readwrite");
          const req = tx.objectStore(STORES.LOGS).delete(id);
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        });
      },

      async getAllLogs() {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.LOGS, "readonly");
          const req = tx.objectStore(STORES.LOGS).getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      },

      async getLogsByHabit(habitId) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.LOGS, "readonly");
          const index = tx.objectStore(STORES.LOGS).index("by_habit");
          const req = index.getAll(habitId);
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      },

      async getLogsByDate(date) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.LOGS, "readonly");
          const index = tx.objectStore(STORES.LOGS).index("by_date");
          const req = index.getAll(date);
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      },

      async getSetting(key, defaultVal = null) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.SETTINGS, "readonly");
          const req = tx.objectStore(STORES.SETTINGS).get(key);
          req.onsuccess = () =>
            resolve(req.result ? req.result.value : defaultVal);
          req.onerror = () => reject(req.error);
        });
      },

      async putSetting(key, value) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.SETTINGS, "readwrite");
          const req = tx.objectStore(STORES.SETTINGS).put({ key, value });
          req.onsuccess = () => resolve(value);
          req.onerror = () => reject(req.error);
        });
      },

      async getAllSettings() {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.SETTINGS, "readonly");
          const req = tx.objectStore(STORES.SETTINGS).getAll();
          req.onsuccess = () => {
            const list = req.result || [];
            const map = {};
            list.forEach((item) => (map[item.key] = item.value));
            resolve(map);
          };
          req.onerror = () => reject(req.error);
        });
      },

      async getVacations() {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.VACATIONS, "readonly");
          const req = tx.objectStore(STORES.VACATIONS).getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
      },

      async putVacation(vacation) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.VACATIONS, "readwrite");
          const req = tx.objectStore(STORES.VACATIONS).put(vacation);
          req.onsuccess = () => resolve(vacation);
          req.onerror = () => reject(req.error);
        });
      },

      async deleteVacation(id) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.VACATIONS, "readwrite");
          const req = tx.objectStore(STORES.VACATIONS).delete(id);
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        });
      },

      async getSnapshots() {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.SNAPSHOTS, "readonly");
          const req = tx.objectStore(STORES.SNAPSHOTS).getAll();
          req.onsuccess = () => {
            const list = req.result || [];
            list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            resolve(list);
          };
          req.onerror = () => reject(req.error);
        });
      },

      async putSnapshot(snapshot) {
        const db = await openDb();
        const id = snapshot.id || `snap-${Date.now()}`;
        const item = {
          ...snapshot,
          id,
          timestamp: snapshot.timestamp || Date.now(),
        };

        const list = await this.getSnapshots();
        const filtered = list.filter((s) => s.id !== id);
        filtered.unshift(item);

        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.SNAPSHOTS, "readwrite");
          const store = tx.objectStore(STORES.SNAPSHOTS);
          store.put(item);

          // Prune excess snapshots older than top 5
          if (filtered.length > 5) {
            for (let i = 5; i < filtered.length; i++) {
              store.delete(filtered[i].id);
            }
          }

          tx.oncomplete = () => resolve(item);
          tx.onerror = () => reject(tx.error);
        });
      },

      async deleteSnapshot(id) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.SNAPSHOTS, "readwrite");
          const req = tx.objectStore(STORES.SNAPSHOTS).delete(id);
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        });
      },

      async clearSnapshots() {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.SNAPSHOTS, "readwrite");
          const req = tx.objectStore(STORES.SNAPSHOTS).clear();
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        });
      },

      async getDeletedTombstones() {
        const val = await this.getSetting("_deleted");
        return val || { habits: {}, vacations: {} };
      },

      async putDeletedTombstones(deletedDict) {
        const dict = deletedDict || { habits: {}, vacations: {} };
        await this.putSetting("_deleted", dict);
        return dict;
      },

      async clearAll() {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(
            [
              STORES.HABITS,
              STORES.LOGS,
              STORES.SETTINGS,
              STORES.ROUTINES,
              STORES.VACATIONS,
              STORES.SNAPSHOTS,
            ],
            "readwrite"
          );
          tx.objectStore(STORES.HABITS).clear();
          tx.objectStore(STORES.LOGS).clear();
          tx.objectStore(STORES.SETTINGS).clear();
          tx.objectStore(STORES.ROUTINES).clear();
          tx.objectStore(STORES.VACATIONS).clear();
          tx.objectStore(STORES.SNAPSHOTS).clear();
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        });
      },

      async runSilentMigration() {
        if (typeof window === "undefined" || !window.localStorage) return false;
        try {
          const storage = window.localStorage;
          const legacyHabitsRaw = storage.getItem("atomic_habits_v0");
          if (legacyHabitsRaw) {
            const legacyHabits = JSON.parse(legacyHabitsRaw);
            if (Array.isArray(legacyHabits)) {
              for (const item of legacyHabits) {
                await this.putHabit({
                  id:
                    item.id ||
                    `legacy-${Math.random().toString(36).slice(2, 7)}`,
                  name: item.name || item.title || "Untitled Habit",
                  type: item.type || (item.count > 1 ? "numeric" : "binary"),
                  targetValue: item.targetValue || item.count || 1,
                  unit: item.unit || "",
                  routine: item.routine || "anytime",
                  scheduleType: item.scheduleType || "daily",
                  createdAt: item.createdAt || "2026-09-01",
                });
              }
            }
            storage.removeItem("atomic_habits_v0");
          }

          const legacyLogsRaw = storage.getItem("atomic_logs_v0");
          if (legacyLogsRaw) {
            const legacyLogs = JSON.parse(legacyLogsRaw);
            for (const key in legacyLogs) {
              const [habitId, date] = key.split("_");
              const entry = legacyLogs[key];
              await this.putLog({
                id: key,
                habitId: habitId || "unknown",
                date: date || "2026-09-01",
                value: entry.check || entry.value || 1,
                completed: !!(entry.check || entry.completed),
                notes: entry.text || entry.notes || "",
                timestamp: Date.now(),
              });
            }
            storage.removeItem("atomic_logs_v0");
          }
        } catch (e) {
          console.warn("[SilentMigration] Warning:", e);
        }
        return true;
      },
    };

    return adapter;
  }

  /**
   * Main storage factory with automatic fallback detection
   */
  function createStorageAdapter(options = {}) {
    if (options.forceFallback || typeof indexedDB === "undefined") {
      return createFallbackAdapter(options);
    }
    try {
      return createIndexedDbAdapter(options);
    } catch (e) {
      return createFallbackAdapter(options);
    }
  }

  const storageExports = {
    DB_NAME,
    DB_VERSION,
    STORES,
    createFallbackAdapter,
    createIndexedDbAdapter,
    createStorageAdapter,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = storageExports;
  } else {
    global.HabitStorage = storageExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
