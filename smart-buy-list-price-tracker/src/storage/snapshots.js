function saveFullStateSnapshot(reason = "MANUAL_SNAPSHOT") {
  const snapshot = {
    id: "snap_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    reason: reason,
    state: JSON.parse(JSON.stringify(memoryState)),
    activeList: JSON.parse(
      JSON.stringify(
        (memoryState && memoryState.activeList) || {
          title: "Shopping List",
          items: [],
        }
      )
    ),
    activeListCount: memoryState.activeList?.items?.length || 0,
    ledgerCount: memoryState.purchaseLedger?.length || 0,
    storesCount: memoryState.stores?.length || 0,
  };

  if (!Array.isArray(memoryState.snapshots)) {
    memoryState.snapshots = [];
  }
  memoryState.snapshots.unshift(snapshot);
  // Cap snapshot storage to the 5 most recent snapshots to prevent storage bloat
  if (memoryState.snapshots.length > 5) {
    memoryState.snapshots = memoryState.snapshots.slice(0, 5);
  }

  // Persist to IndexedDB 'snapshots' store if available
  if (dbInstance && typeof dbInstance.transaction === "function") {
    try {
      if (
        dbInstance.objectStoreNames &&
        dbInstance.objectStoreNames.contains("snapshots")
      ) {
        const tx = dbInstance.transaction(["snapshots"], "readwrite");
        const store = tx.objectStore("snapshots");
        store.put(snapshot);

        const getAllReq = store.getAll();
        getAllReq.onsuccess = (e) => {
          const all = e.target.result || [];
          if (all.length > 5) {
            all.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
            const toDelete = all.slice(5);
            const delTx = dbInstance.transaction(["snapshots"], "readwrite");
            const delStore = delTx.objectStore("snapshots");
            toDelete.forEach((snap) => delStore.delete(snap.id));
          }
        };
      }
    } catch (e) {
      console.warn("Failed to persist snapshot to IDB", e);
    }
  }

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        "smart_buy_list_snapshots",
        JSON.stringify(memoryState.snapshots)
      );
    }
  } catch (e) {}

  updateSnapshotsUI();
  return snapshot;
}

function saveActiveListSnapshot(reason = "PRE_IMPORT_BACKUP") {
  return saveFullStateSnapshot(reason);
}

function restoreSnapshot(snapshotId) {
  const snapshots = memoryState.snapshots || [];
  const target = snapshots.find((s) => s.id === snapshotId) || snapshots[0];
  if (!target || !target.state) {
    const tr = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
    showToast(tr.toast_no_snapshot || "Không có snapshot nào để hoàn tác.");
    return false;
  }

  // Save current state prior to restore as an emergency rollback
  saveFullStateSnapshot("PRE_RESTORE_UNDO");

  const restoredState = JSON.parse(JSON.stringify(target.state));
  if (typeof store !== "undefined" && store && store.dispatch) {
    store.dispatch({
      type: ACTION_TYPES.RESTORE_SNAPSHOT,
      payload: restoredState,
    });
  } else {
    if (restoredState.activeList)
      memoryState.activeList = restoredState.activeList;
    if (Array.isArray(restoredState.purchaseLedger))
      memoryState.purchaseLedger = restoredState.purchaseLedger;
    if (Array.isArray(restoredState.stores))
      memoryState.stores = restoredState.stores;
    if (restoredState.storeAliases)
      memoryState.storeAliases = restoredState.storeAliases;
    if (restoredState.settings)
      memoryState.settings = Object.assign(
        memoryState.settings,
        restoredState.settings
      );
    if (restoredState._deleted) memoryState._deleted = restoredState._deleted;
    saveToLocalStorage();
    renderApp();
  }
  const tr = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
  showToast(tr.toast_snapshot_restored || "Đã khôi phục snapshot thành công!");
  return true;
}

function restoreLastSnapshot() {
  const snapshots = memoryState.snapshots || [];
  if (!snapshots.length) {
    const tr = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
    showToast(tr.toast_no_snapshot || "Không có snapshot nào để hoàn tác.");
    return false;
  }
  return restoreSnapshot(snapshots[0].id);
}

function updateSnapshotsUI() {
  const countBadge = document.getElementById("snapshotCountBadge");
  if (countBadge) {
    const count = (memoryState.snapshots || []).length;
    countBadge.textContent = `${count} snapshot${count === 1 ? "" : "s"}`;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    saveFullStateSnapshot,
    saveActiveListSnapshot,
    restoreSnapshot,
    restoreLastSnapshot,
    updateSnapshotsUI,
  };
}
