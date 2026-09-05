// Base Storage Provider Interface (IStorageProvider)
class StorageProvider {
  async init() {
    return true;
  }
  async getState() {
    return memoryState;
  }
  async saveState(state) {
    return true;
  }
  async sync() {
    return { success: true, timestamp: new Date().toISOString() };
  }
  getStatus() {
    return {
      provider: "base",
      connected: false,
      lastSync: null,
      syncing: false,
    };
  }
  async exportBackup() {
    return JSON.stringify(memoryState, null, 2);
  }
  async importBackup(jsonString) {
    try {
      const parsed =
        typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      if (parsed && typeof parsed === "object") {
        Object.assign(memoryState, parsed);
        await this.saveState(memoryState);
        return true;
      }
    } catch (e) {
      console.error("Failed to import backup", e);
    }
    return false;
  }
}

// IndexedDB Storage Provider (Default Offline Persistence Engine)
class IndexedDBStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.lastSyncTime = null;
    this.isMigrated = false;
  }

  async init() {
    if (typeof window === "undefined" || !window.indexedDB) {
      loadFromLocalStorage();
      return false;
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("lists")) {
            db.createObjectStore("lists", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("catalog")) {
            db.createObjectStore("catalog", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("ledger")) {
            db.createObjectStore("ledger", {
              keyPath: "id",
              autoIncrement: true,
            });
          }
          if (!db.objectStoreNames.contains("settings")) {
            db.createObjectStore("settings", { keyPath: "key" });
          }
          if (!db.objectStoreNames.contains("snapshots")) {
            db.createObjectStore("snapshots", { keyPath: "id" });
          }
        };

        request.onsuccess = async (e) => {
          dbInstance = e.target.result;
          if (dbInstance && typeof dbInstance.transaction === "function") {
            try {
              await this.performAutoMigration();
              await this.loadFromIDB();
            } catch (err) {
              console.warn("IDB migration/load exception", err);
              loadFromLocalStorage();
            }
          } else {
            loadFromLocalStorage();
          }
          this.lastSyncTime = new Date().toISOString();
          resolve(true);
        };

        request.onerror = () => {
          console.warn("IndexedDB open error, falling back to localStorage");
          loadFromLocalStorage();
          resolve(false);
        };
      } catch (err) {
        console.warn(
          "IndexedDB init exception, falling back to localStorage",
          err
        );
        loadFromLocalStorage();
        resolve(false);
      }
    });
  }

  async performAutoMigration() {
    if (typeof localStorage === "undefined") return;
    if (!dbInstance || typeof dbInstance.transaction !== "function") return;
    try {
      const rawLocal = localStorage.getItem("smart_buy_list_state");
      const localToken = localStorage.getItem("github_sync_token");
      const localGistId = localStorage.getItem("github_sync_gist_id");

      if (!rawLocal && !localToken && !localGistId) return;

      let parsedLocal = null;
      if (rawLocal) {
        try {
          parsedLocal = JSON.parse(rawLocal);
        } catch (e) {}
      }

      if (parsedLocal && typeof parsedLocal === "object") {
        await this.writeFullStateToIDB(parsedLocal);
      }

      if (localToken) {
        await this.setSettingInIDB("github_sync_token", localToken);
      }
      if (localGistId) {
        await this.setSettingInIDB("github_sync_gist_id", localGistId);
      }

      localStorage.removeItem("smart_buy_list_state");
      localStorage.removeItem("github_sync_token");
      localStorage.removeItem("github_sync_gist_id");
      this.isMigrated = true;
    } catch (err) {
      console.warn("Auto-migration to IDB failed", err);
    }
  }

  async writeFullStateToIDB(state) {
    if (!dbInstance || typeof dbInstance.transaction !== "function") return;
    return new Promise((resolve, reject) => {
      try {
        const tx = dbInstance.transaction(
          ["lists", "catalog", "ledger", "settings"],
          "readwrite"
        );
        const listStore = tx.objectStore("lists");
        const catalogStore = tx.objectStore("catalog");
        const ledgerStore = tx.objectStore("ledger");
        const settingsStore = tx.objectStore("settings");

        if (state.activeList) {
          listStore.put({
            id: state.activeList.id || "default",
            title: state.activeList.title || "Danh Sách Mua Sắm",
            items: state.activeList.items || [],
          });
        }

        if (Array.isArray(state.catalog)) {
          catalogStore.clear();
          state.catalog.forEach((it) => catalogStore.put(it));
        }

        if (Array.isArray(state.purchaseLedger)) {
          ledgerStore.clear();
          state.purchaseLedger.forEach((it) => ledgerStore.put(it));
        }

        if (state.settings) {
          settingsStore.put({
            key: "app_settings",
            value: state.settings,
          });
        }
        if (Array.isArray(state.stores)) {
          settingsStore.put({ key: "stores", value: state.stores });
        }
        if (state.storeAliases) {
          settingsStore.put({
            key: "storeAliases",
            value: state.storeAliases,
          });
        }
        if (state._deleted) {
          settingsStore.put({
            key: "deleted_tombstones",
            value: state._deleted,
          });
        }
        settingsStore.put({ key: "storage_version", value: 4 });

        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e);
      } catch (e) {
        reject(e);
      }
    });
  }

  async loadFromIDB() {
    if (!dbInstance || typeof dbInstance.transaction !== "function") return;
    return new Promise((resolve, reject) => {
      try {
        const storeNames = ["lists", "catalog", "ledger", "settings"];
        if (
          dbInstance.objectStoreNames &&
          dbInstance.objectStoreNames.contains("snapshots")
        ) {
          storeNames.push("snapshots");
        }
        const tx = dbInstance.transaction(storeNames, "readonly");
        const listStore = tx.objectStore("lists");
        const catalogStore = tx.objectStore("catalog");
        const ledgerStore = tx.objectStore("ledger");
        const settingsStore = tx.objectStore("settings");
        const snapStore =
          dbInstance.objectStoreNames &&
          dbInstance.objectStoreNames.contains("snapshots")
            ? tx.objectStore("snapshots")
            : null;

        const reqList = listStore.get("default");
        const reqCatalog = catalogStore.getAll();
        const reqLedger = ledgerStore.getAll();
        const reqSettings = settingsStore.getAll();
        const reqSnapshots = snapStore ? snapStore.getAll() : null;

        tx.oncomplete = () => {
          if (reqList.result) {
            memoryState.activeList = reqList.result;
          }
          if (reqCatalog.result && Array.isArray(reqCatalog.result)) {
            memoryState.catalog = reqCatalog.result;
          }
          if (reqLedger.result && Array.isArray(reqLedger.result)) {
            memoryState.purchaseLedger = reqLedger.result;
          }
          if (reqSettings.result && Array.isArray(reqSettings.result)) {
            reqSettings.result.forEach((entry) => {
              if (entry.key === "app_settings" && entry.value) {
                memoryState.settings = {
                  ...memoryState.settings,
                  ...entry.value,
                };
              } else if (entry.key === "stores" && Array.isArray(entry.value)) {
                memoryState.stores = entry.value;
              } else if (entry.key === "storeAliases" && entry.value) {
                memoryState.storeAliases = entry.value;
              } else if (entry.key === "deleted_tombstones" && entry.value) {
                memoryState._deleted = entry.value;
              } else if (entry.key === "github_sync_token" && entry.value) {
                githubAuthState.token = entry.value;
                githubAuthState.rememberToken = true;
              } else if (entry.key === "github_sync_gist_id" && entry.value) {
                githubAuthState.gistId = entry.value;
              }
            });
          }
          if (
            reqSnapshots &&
            reqSnapshots.result &&
            Array.isArray(reqSnapshots.result)
          ) {
            const sorted = reqSnapshots.result.sort((a, b) =>
              a.timestamp > b.timestamp ? -1 : 1
            );
            memoryState.snapshots = sorted.slice(0, 5);
            updateSnapshotsUI();
          }
          if (!memoryState.stores || memoryState.stores.length === 0) {
            memoryState.stores = [...DEFAULT_STORES];
          }
          if (!memoryState.storeAliases) {
            memoryState.storeAliases = { ...DEFAULT_STORE_ALIASES };
          }
          resolve(true);
        };

        tx.onerror = (e) => reject(e);
      } catch (e) {
        reject(e);
      }
    });
  }

  async setSettingInIDB(key, value) {
    if (!dbInstance || typeof dbInstance.transaction !== "function") return;
    return new Promise((resolve, reject) => {
      try {
        const tx = dbInstance.transaction(["settings"], "readwrite");
        const store = tx.objectStore("settings");
        if (value === null || value === undefined) {
          store.delete(key);
        } else {
          store.put({ key, value });
        }
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e);
      } catch (e) {
        reject(e);
      }
    });
  }

  async getSettingFromIDB(key) {
    if (!dbInstance || typeof dbInstance.transaction !== "function")
      return null;
    return new Promise((resolve) => {
      try {
        const tx = dbInstance.transaction(["settings"], "readonly");
        const req = tx.objectStore("settings").get(key);
        req.onsuccess = () => {
          resolve(req.result ? req.result.value : null);
        };
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async getState() {
    if (dbInstance && typeof dbInstance.transaction === "function") {
      await this.loadFromIDB();
    }
    return memoryState;
  }

  async saveState(state) {
    if (state) {
      Object.assign(memoryState, state);
    }
    if (dbInstance && typeof dbInstance.transaction === "function") {
      try {
        await this.writeFullStateToIDB(memoryState);
      } catch (e) {
        console.warn("IDB save failed, falling back to localStorage", e);
        saveToLocalStorage();
      }
    } else {
      saveToLocalStorage();
    }
    return true;
  }

  async sync() {
    await this.saveState(memoryState);
    this.lastSyncTime = new Date().toISOString();
    return { success: true, timestamp: this.lastSyncTime };
  }

  getStatus() {
    return {
      provider: "indexeddb",
      connected: !!dbInstance,
      lastSync: this.lastSyncTime,
      syncing: false,
      mode: dbInstance ? "offline-first-idb" : "offline-first-localstorage",
    };
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { StorageProvider, IndexedDBStorageProvider };
}
