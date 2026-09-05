/**
 * State Management Module Entry Point
 * @module state
 */

const {
  ACTION_TYPES,
  rootReducer,
  createStore,
  createStoragePersistenceMiddleware,
  store,
  addItem,
  updateItem,
  deleteItem,
  toggleItemCheck,
  dispatchSetTripPhase,
  dispatchSetGrouping,
  setStoreFilter,
  completeTrip,
  applyMerge,
  restoreSnapshot,
} = require("./store.js");

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ACTION_TYPES,
    rootReducer,
    createStore,
    createStoragePersistenceMiddleware,
    store,
    addItem,
    updateItem,
    deleteItem,
    toggleItemCheck,
    dispatchSetTripPhase,
    dispatchSetGrouping,
    setStoreFilter,
    completeTrip,
    applyMerge,
    restoreSnapshot,
  };
}
