/**
 * Observable State Container & Action Dispatchers
 * @module state/store
 * @see ADR-0031: Modular Source Architecture, JSDoc Domain Contracts & Observable State Container
 */

// Action Type Constants
const ACTION_TYPES = Object.freeze({
  ITEM_ADD: "ITEM_ADD",
  ITEM_UPDATE: "ITEM_UPDATE",
  ITEM_DELETE: "ITEM_DELETE",
  ITEM_TOGGLE_CHECK: "ITEM_TOGGLE_CHECK",
  SET_TRIP_PHASE: "SET_TRIP_PHASE",
  SET_GROUPING: "SET_GROUPING",
  SET_STORE_FILTER: "SET_STORE_FILTER",
  SET_LANGUAGE: "SET_LANGUAGE",
  SET_CURRENCY: "SET_CURRENCY",
  SET_THEME: "SET_THEME",
  COMPLETE_TRIP: "COMPLETE_TRIP",
  APPLY_MERGE: "APPLY_MERGE",
  RESTORE_SNAPSHOT: "RESTORE_SNAPSHOT",
  SET_CATALOG: "SET_CATALOG",
  SET_LEDGER: "SET_LEDGER",
  SET_STORES: "SET_STORES",
  SET_STORE_ALIASES: "SET_STORE_ALIASES",
  SET_SNAPSHOTS: "SET_SNAPSHOTS",
  REPLACE_STATE: "REPLACE_STATE",
});

/**
 * Root Reducer handling deterministic state transitions.
 * @param {Object} state - Current application state
 * @param {{ type: string, payload?: any }} action - Dispatched action
 * @returns {Object} Next application state
 */
function rootReducer(state, action) {
  if (!action || !action.type) return state;

  switch (action.type) {
    case ACTION_TYPES.ITEM_ADD: {
      const item = action.payload;
      if (!item) return state;
      const currentItems = Array.isArray(state?.activeList?.items)
        ? [...state.activeList.items]
        : [];
      if (typeof unrecordDeletedItem === "function" && item.id) {
        unrecordDeletedItem(item.id, state._deleted);
      }
      currentItems.push(item);
      return {
        ...state,
        activeList: {
          ...(state.activeList || {
            id: "default",
            title: "Danh Sách Mua Sắm",
          }),
          items: currentItems,
        },
      };
    }

    case ACTION_TYPES.ITEM_UPDATE: {
      const { id, patch } = action.payload || {};
      if (!id || !patch) return state;
      const currentItems = Array.isArray(state?.activeList?.items)
        ? state.activeList.items
        : [];
      const target = currentItems.find((it) => it.id === id);
      if (target) {
        Object.assign(target, patch);
        target.updatedAt = new Date().toISOString();
        if (typeof touchItem === "function") {
          touchItem(target);
        }
      }
      return {
        ...state,
        activeList: {
          ...(state.activeList || {
            id: "default",
            title: "Danh Sách Mua Sắm",
          }),
          items: [...currentItems],
        },
      };
    }

    case ACTION_TYPES.ITEM_DELETE: {
      const { id } = action.payload || {};
      if (!id) return state;
      if (typeof recordDeletedItem === "function") {
        recordDeletedItem(id);
      }
      const currentItems = Array.isArray(state?.activeList?.items)
        ? [...state.activeList.items]
        : [];
      const remainingItems = currentItems.filter((it) => it.id !== id);
      return {
        ...state,
        activeList: {
          ...(state.activeList || {
            id: "default",
            title: "Danh Sách Mua Sắm",
          }),
          items: remainingItems,
        },
      };
    }

    case ACTION_TYPES.ITEM_TOGGLE_CHECK: {
      const { id } = action.payload || {};
      if (!id) return state;
      const currentItems = Array.isArray(state?.activeList?.items)
        ? state.activeList.items
        : [];
      const target = currentItems.find((it) => it.id === id);
      if (target) {
        target.checked = !target.checked;
        const nowIso = new Date().toISOString();
        target.checkedAt = target.checked ? nowIso : null;
        target.updatedAt = nowIso;
        if (typeof touchItem === "function") {
          touchItem(target);
        }
      }
      return {
        ...state,
        activeList: {
          ...(state.activeList || {
            id: "default",
            title: "Danh Sách Mua Sắm",
          }),
          items: [...currentItems],
        },
      };
    }

    case ACTION_TYPES.SET_TRIP_PHASE: {
      const phase = action.payload;
      return {
        ...state,
        settings: {
          ...(state.settings || {}),
          tripPhase: phase,
        },
      };
    }

    case ACTION_TYPES.SET_GROUPING: {
      const grouping = action.payload;
      return {
        ...state,
        settings: {
          ...(state.settings || {}),
          grouping,
        },
      };
    }

    case ACTION_TYPES.SET_STORE_FILTER: {
      const storeFilter = action.payload;
      return {
        ...state,
        settings: {
          ...(state.settings || {}),
          currentStoreFilter: storeFilter,
        },
      };
    }

    case ACTION_TYPES.SET_LANGUAGE: {
      return {
        ...state,
        settings: {
          ...(state.settings || {}),
          language: action.payload,
        },
      };
    }

    case ACTION_TYPES.SET_CURRENCY: {
      return {
        ...state,
        settings: {
          ...(state.settings || {}),
          currency: action.payload,
        },
      };
    }

    case ACTION_TYPES.SET_THEME: {
      return {
        ...state,
        settings: {
          ...(state.settings || {}),
          theme: action.payload,
        },
      };
    }

    case ACTION_TYPES.COMPLETE_TRIP: {
      const {
        ledgerEntries = [],
        uncheckedItems = [],
        catalogUpdates = null,
      } = action.payload || {};
      const nextLedger = [...(state.purchaseLedger || []), ...ledgerEntries];
      let nextCatalog = state.catalog ? [...state.catalog] : [];
      if (Array.isArray(catalogUpdates)) {
        nextCatalog = catalogUpdates;
      }
      return {
        ...state,
        purchaseLedger: nextLedger,
        catalog: nextCatalog,
        activeList: {
          ...(state.activeList || {
            id: "default",
            title: "Danh Sách Mua Sắm",
          }),
          items: uncheckedItems,
        },
      };
    }

    case ACTION_TYPES.APPLY_MERGE: {
      const merged = action.payload || {};
      return {
        ...state,
        ...merged,
        activeList: merged.activeList || state.activeList,
        catalog: merged.catalog || state.catalog,
        purchaseLedger: merged.purchaseLedger || state.purchaseLedger,
        stores: merged.stores || state.stores,
        storeAliases: merged.storeAliases || state.storeAliases,
        settings: {
          ...(state.settings || {}),
          ...(merged.settings || {}),
        },
        _deleted: merged._deleted || state._deleted,
      };
    }

    case ACTION_TYPES.RESTORE_SNAPSHOT: {
      const restored = action.payload || {};
      return {
        ...state,
        ...restored,
        activeList: restored.activeList || state.activeList,
        catalog: restored.catalog || state.catalog,
        purchaseLedger: restored.purchaseLedger || state.purchaseLedger,
        stores: restored.stores || state.stores,
        storeAliases: restored.storeAliases || state.storeAliases,
        settings: {
          ...(state.settings || {}),
          ...(restored.settings || {}),
        },
        _deleted: restored._deleted || state._deleted,
      };
    }

    case ACTION_TYPES.SET_CATALOG: {
      return {
        ...state,
        catalog: action.payload,
      };
    }

    case ACTION_TYPES.SET_LEDGER: {
      return {
        ...state,
        purchaseLedger: action.payload,
      };
    }

    case ACTION_TYPES.SET_STORES: {
      return {
        ...state,
        stores: action.payload,
      };
    }

    case ACTION_TYPES.SET_STORE_ALIASES: {
      return {
        ...state,
        storeAliases: action.payload,
      };
    }

    case ACTION_TYPES.SET_SNAPSHOTS: {
      return {
        ...state,
        snapshots: action.payload,
      };
    }

    case ACTION_TYPES.REPLACE_STATE: {
      return {
        ...state,
        ...action.payload,
      };
    }

    default:
      return state;
  }
}

/**
 * Synchronize internal store state into legacy memoryState for 100% backward compatibility.
 * @param {Object} srcState
 */
function syncToMemoryState(srcState) {
  if (
    typeof memoryState !== "undefined" &&
    memoryState &&
    typeof memoryState === "object"
  ) {
    Object.assign(memoryState, srcState);
    if (srcState.activeList) memoryState.activeList = srcState.activeList;
    if (srcState.purchaseLedger)
      memoryState.purchaseLedger = srcState.purchaseLedger;
    if (srcState.catalog) memoryState.catalog = srcState.catalog;
    if (srcState.stores) memoryState.stores = srcState.stores;
    if (srcState.storeAliases) memoryState.storeAliases = srcState.storeAliases;
    if (srcState.settings) memoryState.settings = srcState.settings;
    if (srcState._deleted) memoryState._deleted = srcState._deleted;
    if (srcState.snapshots) memoryState.snapshots = srcState.snapshots;
  }
}

/**
 * Observable State Container Factory
 * @param {Function|Object} arg1 - Reducer function or initial state
 * @param {Object|Array} [arg2] - Initial state or middlewares array
 * @param {Array} [arg3] - Middlewares array
 * @returns {Object} Store instance with getState, dispatch, subscribe, replaceState
 */
function createStore(arg1, arg2, arg3) {
  let reducer = rootReducer;
  let state = null;
  let middlewares = [];

  if (typeof arg1 === "function") {
    reducer = arg1;
    state = arg2 || {};
    middlewares = Array.isArray(arg3) ? arg3 : [];
  } else {
    state = arg1 || {};
    middlewares = Array.isArray(arg2) ? arg2 : [];
  }

  const listeners = new Set();

  function getState() {
    // Reconcile if external sandbox/tests imperatively mutated memoryState directly
    if (
      typeof memoryState !== "undefined" &&
      memoryState &&
      typeof memoryState === "object" &&
      state
    ) {
      if (
        memoryState.activeList &&
        memoryState.activeList !== state.activeList
      ) {
        state.activeList = memoryState.activeList;
      }
      if (
        memoryState.purchaseLedger &&
        memoryState.purchaseLedger !== state.purchaseLedger
      ) {
        state.purchaseLedger = memoryState.purchaseLedger;
      }
      if (memoryState.catalog && memoryState.catalog !== state.catalog) {
        state.catalog = memoryState.catalog;
      }
      if (memoryState.stores && memoryState.stores !== state.stores) {
        state.stores = memoryState.stores;
      }
      if (
        memoryState.storeAliases &&
        memoryState.storeAliases !== state.storeAliases
      ) {
        state.storeAliases = memoryState.storeAliases;
      }
      if (memoryState.settings && memoryState.settings !== state.settings) {
        state.settings = memoryState.settings;
      }
      if (memoryState.snapshots && memoryState.snapshots !== state.snapshots) {
        state.snapshots = memoryState.snapshots;
      }
      if (memoryState._deleted && memoryState._deleted !== state._deleted) {
        state._deleted = memoryState._deleted;
      }
    }
    return state;
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  let rawDispatch = (action) => {
    state = reducer(getState(), action);
    syncToMemoryState(state);
    listeners.forEach((listener) => {
      try {
        listener(state, action);
      } catch (err) {
        console.error("Store listener error:", err);
      }
    });
    return action;
  };

  let dispatch = rawDispatch;

  if (Array.isArray(middlewares) && middlewares.length > 0) {
    const middlewareAPI = {
      getState: () => getState(),
      dispatch: (act) => dispatch(act),
    };
    const chain = middlewares.map((fn) => fn(middlewareAPI));
    dispatch = chain.reduceRight((composed, fn) => fn(composed), rawDispatch);
  }

  return {
    getState,
    dispatch: (act) => dispatch(act),
    subscribe,
    replaceState(nextState) {
      return dispatch({
        type: ACTION_TYPES.REPLACE_STATE,
        payload: nextState,
      });
    },
  };
}

/**
 * Storage Persistence Middleware
 * Persists state transitions to IndexedDB and LocalStorage automatically.
 */
function createStoragePersistenceMiddleware() {
  const PERSIST_ACTIONS = new Set([
    ACTION_TYPES.ITEM_ADD,
    ACTION_TYPES.ITEM_UPDATE,
    ACTION_TYPES.ITEM_DELETE,
    ACTION_TYPES.ITEM_TOGGLE_CHECK,
    ACTION_TYPES.SET_TRIP_PHASE,
    ACTION_TYPES.SET_GROUPING,
    ACTION_TYPES.SET_STORE_FILTER,
    ACTION_TYPES.SET_LANGUAGE,
    ACTION_TYPES.SET_CURRENCY,
    ACTION_TYPES.SET_THEME,
    ACTION_TYPES.COMPLETE_TRIP,
    ACTION_TYPES.APPLY_MERGE,
    ACTION_TYPES.RESTORE_SNAPSHOT,
    ACTION_TYPES.SET_CATALOG,
    ACTION_TYPES.SET_LEDGER,
    ACTION_TYPES.SET_STORES,
    ACTION_TYPES.SET_STORE_ALIASES,
    ACTION_TYPES.SET_SNAPSHOTS,
    ACTION_TYPES.REPLACE_STATE,
  ]);

  return (storeAPI) => (next) => (action) => {
    const result = next(action);
    if (action && PERSIST_ACTIONS.has(action.type)) {
      if (typeof saveToLocalStorage === "function") {
        saveToLocalStorage();
      } else if (typeof localStorage !== "undefined") {
        try {
          const state = storeAPI.getState();
          localStorage.setItem("smart_buy_list_state", JSON.stringify(state));
        } catch (e) {}
      }
    }
    return result;
  };
}

// Global default singleton store initialized with memoryState
const store = createStore(
  typeof memoryState !== "undefined" ? memoryState : {},
  [createStoragePersistenceMiddleware()]
);

/**
 * Action Dispatcher: Add new item to shopping list
 * @param {Object} item
 * @returns {Object} Added item
 */
function dispatchAddItem(item) {
  if (!item || typeof item !== "object") return null;
  const normalized = {
    id:
      item.id ||
      (typeof generateItemId === "function"
        ? generateItemId("item")
        : "item_" + Date.now()),
    name: item.name || "",
    category: item.category || "other",
    store: item.store || "",
    quantity: parseFloat(item.quantity) || 1,
    unit: item.unit || "item",
    price: parseFloat(item.price) || 0,
    checked: !!item.checked,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (typeof touchItem === "function") {
    touchItem(normalized);
  }
  store.dispatch({ type: ACTION_TYPES.ITEM_ADD, payload: normalized });
  return normalized;
}

/**
 * Action Dispatcher: Update item by ID
 * @param {string} id
 * @param {Object} patch
 * @returns {Object|null}
 */
function dispatchUpdateItem(id, patch) {
  if (!id || !patch) return null;
  store.dispatch({
    type: ACTION_TYPES.ITEM_UPDATE,
    payload: { id, patch },
  });
  return store.getState().activeList?.items?.find((i) => i.id === id) || null;
}

/**
 * Action Dispatcher: Delete item by ID
 * @param {string} id
 * @returns {boolean}
 */
function dispatchDeleteItem(id) {
  if (!id) return false;
  store.dispatch({ type: ACTION_TYPES.ITEM_DELETE, payload: { id } });
  return true;
}

/**
 * Action Dispatcher: Toggle item checked state
 * @param {string} id
 * @returns {Object|null}
 */
function dispatchToggleItemCheck(id) {
  if (!id) return null;
  store.dispatch({
    type: ACTION_TYPES.ITEM_TOGGLE_CHECK,
    payload: { id },
  });
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    try {
      navigator.vibrate([15]);
    } catch (e) {}
  }
  return store.getState().activeList?.items?.find((i) => i.id === id) || null;
}

/**
 * Action Dispatcher: Set active trip phase (PLANNING | BUY)
 * @param {string} phase
 */
function dispatchSetTripPhase(phase) {
  store.dispatch({ type: ACTION_TYPES.SET_TRIP_PHASE, payload: phase });
}

/**
 * Action Dispatcher: Set list grouping (AISLE | STORE)
 * @param {string} grouping
 */
function dispatchSetGrouping(grouping) {
  store.dispatch({ type: ACTION_TYPES.SET_GROUPING, payload: grouping });
}

/**
 * Action Dispatcher: Set active store filter
 * @param {string} storeName
 */
function dispatchSetStoreFilter(storeName) {
  store.dispatch({
    type: ACTION_TYPES.SET_STORE_FILTER,
    payload: storeName,
  });
}

/**
 * Action Dispatcher: Complete trip and record ledger entries
 * @param {Object} payload
 */
function dispatchCompleteTrip(payload) {
  store.dispatch({ type: ACTION_TYPES.COMPLETE_TRIP, payload });
}

/**
 * Action Dispatcher: Apply incoming 3-way or shared merge diff
 * @param {Object} diff
 */
function dispatchApplyMerge(diff) {
  store.dispatch({ type: ACTION_TYPES.APPLY_MERGE, payload: diff });
}

/**
 * Action Dispatcher: Restore state from snapshot
 * @param {string} snapshotId
 * @returns {boolean}
 */
function dispatchRestoreSnapshot(snapshotId) {
  const snapshots =
    store.getState().snapshots ||
    (typeof memoryState !== "undefined" ? memoryState.snapshots : []) ||
    [];
  const target = snapshots.find((s) => s.id === snapshotId) || snapshots[0];
  if (!target || !target.state) {
    if (typeof showToast === "function") {
      const tr =
        (typeof TRANSLATIONS !== "undefined" &&
          TRANSLATIONS[currentLanguage]) ||
        {};
      showToast(tr.toast_no_snapshot || "Không có snapshot nào để hoàn tác.");
    }
    return false;
  }
  if (typeof saveFullStateSnapshot === "function") {
    saveFullStateSnapshot("PRE_RESTORE_UNDO");
  }
  const restoredState = JSON.parse(JSON.stringify(target.state));
  store.dispatch({
    type: ACTION_TYPES.RESTORE_SNAPSHOT,
    payload: restoredState,
  });
  if (typeof updateSnapshotsUI === "function") updateSnapshotsUI();
  if (typeof showToast === "function") {
    const tr =
      (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) ||
      {};
    showToast(
      tr.toast_snapshot_restored || "Đã khôi phục dữ liệu từ snapshot."
    );
  }
  return true;
}

// Bind action dispatchers as methods on store instance
store.addItem = dispatchAddItem;
store.updateItem = dispatchUpdateItem;
store.deleteItem = dispatchDeleteItem;
store.toggleItemCheck = dispatchToggleItemCheck;
store.setTripPhase = dispatchSetTripPhase;
store.setGrouping = dispatchSetGrouping;
store.setStoreFilter = dispatchSetStoreFilter;
store.completeTrip = dispatchCompleteTrip;
store.applyMerge = dispatchApplyMerge;
store.restoreSnapshot = dispatchRestoreSnapshot;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ACTION_TYPES,
    rootReducer,
    createStore,
    createStoragePersistenceMiddleware,
    store,
    addItem: dispatchAddItem,
    updateItem: dispatchUpdateItem,
    deleteItem: dispatchDeleteItem,
    toggleItemCheck: dispatchToggleItemCheck,
    dispatchSetTripPhase,
    dispatchSetGrouping,
    setStoreFilter: dispatchSetStoreFilter,
    completeTrip: dispatchCompleteTrip,
    applyMerge: dispatchApplyMerge,
    restoreSnapshot: dispatchRestoreSnapshot,
  };
}
