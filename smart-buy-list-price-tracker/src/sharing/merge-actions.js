function applySmartMerge() {
  if (!window.pendingSharedList || !currentMergeDiff) return;

  const updateCatalog = document.getElementById("mergeUpdatePriceCatalog")
    ? document.getElementById("mergeUpdatePriceCatalog").checked
    : true;

  let processedCount = 0;

  currentMergeDiff.diffItems.forEach((diff) => {
    if (!diff.includeInMerge) return;

    const inc = diff.incoming;
    const loc = diff.local;

    if (diff.status === "NEW") {
      const newItem = touchItem({
        ...inc,
        store: resolveStoreAlias(inc.store),
      });
      if (!memoryState.activeList.items) {
        memoryState.activeList.items = [];
      }
      memoryState.activeList.items.push(newItem);
      processedCount++;

      if (updateCatalog && inc.price > 0) {
        const unitPrice = normalizeUnitPrice(inc.price, inc.quantity, inc.unit);
        memoryState.purchaseLedger.push({
          id: generateItemId("rec"),
          itemId: newItem.id,
          itemName: newItem.name,
          store: newItem.store || "Supermarket",
          date: new Date().toISOString().slice(0, 10),
          timestamp: new Date().toISOString(),
          quantity: newItem.quantity,
          unit: newItem.unit,
          price: newItem.price,
          unitPrice,
        });
      }
    } else if (loc) {
      // Apply Qty strategy
      if (diff.hasQtyDiff) {
        if (diff.selectedQtyStrategy === "SUM") {
          loc.quantity = Number(loc.quantity || 0) + Number(inc.quantity || 0);
        } else if (diff.selectedQtyStrategy === "REMOTE") {
          loc.quantity = Number(inc.quantity);
        }
      }

      // Apply Price strategy
      if (diff.hasPriceDiff && diff.useRemotePrice) {
        loc.price = Number(inc.price);
      }

      touchItem(loc);
      processedCount++;

      if (updateCatalog && inc.price > 0 && diff.useRemotePrice) {
        const unitPrice = normalizeUnitPrice(
          inc.price,
          loc.quantity || inc.quantity,
          loc.unit || inc.unit
        );
        memoryState.purchaseLedger.push({
          id: generateItemId("rec"),
          itemId: loc.id,
          itemName: loc.name,
          store: loc.store || "Supermarket",
          date: new Date().toISOString().slice(0, 10),
          timestamp: new Date().toISOString(),
          quantity: loc.quantity,
          unit: loc.unit,
          price: loc.price,
          unitPrice,
        });
      }
    }
  });

  saveToLocalStorage();
  closeModal("mergeReviewModal");
  closeModal("importModal");
  renderApp();

  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
  const msg = (
    t.toast_smart_merge_success || "Smart merge applied! Merged {count} items."
  ).replace("{count}", processedCount);
  showToast(msg);
}

function importAsNewListWithSnapshot() {
  if (!window.pendingSharedList) return;
  saveActiveListSnapshot("PRE_REPLACE_IMPORT");

  const normalizedItems = (window.pendingSharedList.items || []).map((i) =>
    touchItem({
      ...i,
      store: resolveStoreAlias(i.store),
    })
  );

  memoryState.activeList = {
    title: window.pendingSharedList.title || "Shared Shopping List",
    items: normalizedItems,
  };

  saveToLocalStorage();
  closeModal("mergeReviewModal");
  closeModal("importModal");
  renderApp();

  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
  showToast(
    t.toast_import_shared_success || "Shared list successfully imported!"
  );
}

function openMergeReviewModal(sharedList) {
  sharedList = sharedList || window.pendingSharedList;
  if (!sharedList) return;
  window.pendingSharedList = sharedList;
  renderMergeReviewModal(sharedList);
  openModal("mergeReviewModal");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { applySmartMerge, importAsNewListWithSnapshot };
}
