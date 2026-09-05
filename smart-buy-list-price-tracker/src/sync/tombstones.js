const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function pruneDeletedTombstones(
  deletedDict = memoryState?._deleted,
  nowMs = Date.now()
) {
  if (!deletedDict || typeof deletedDict !== "object") return;
  ["items", "ledger", "stores"].forEach((key) => {
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

function touchItem(item) {
  if (!item || typeof item !== "object") return item;
  const nowIso = new Date().toISOString();
  if (!item.createdAt) item.createdAt = nowIso;
  item.updatedAt = nowIso;
  if (
    memoryState?._deleted?.items &&
    item.id &&
    memoryState._deleted.items[String(item.id)]
  ) {
    delete memoryState._deleted.items[String(item.id)];
  }
  return item;
}

function recordDeletedItem(id) {
  if (!id) return;
  if (!memoryState._deleted)
    memoryState._deleted = { items: {}, ledger: {}, stores: {} };
  if (!memoryState._deleted.items) memoryState._deleted.items = {};
  memoryState._deleted.items[String(id)] = new Date().toISOString();
}

function recordDeletedLedger(id) {
  if (id === undefined || id === null) return;
  if (!memoryState._deleted)
    memoryState._deleted = { items: {}, ledger: {}, stores: {} };
  if (!memoryState._deleted.ledger) memoryState._deleted.ledger = {};
  memoryState._deleted.ledger[String(id)] = new Date().toISOString();
}

function recordDeletedStore(storeName) {
  if (!storeName) return;
  if (!memoryState._deleted)
    memoryState._deleted = { items: {}, ledger: {}, stores: {} };
  if (!memoryState._deleted.stores) memoryState._deleted.stores = {};
  memoryState._deleted.stores[String(storeName)] = new Date().toISOString();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TOMBSTONE_TTL_MS,
    pruneDeletedTombstones,
    touchItem,
    recordDeletedItem,
    recordDeletedLedger,
    recordDeletedStore,
  };
}
