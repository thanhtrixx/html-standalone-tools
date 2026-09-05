/* =========================================================================
       8. SHARING, TEXT CHECKLIST & MERGE PROTOCOL
       ========================================================================= */
let currentShareScope = "ALL";

function setShareScope(scope) {
  currentShareScope = scope;
  updateShareScopeUI();
}

function updateShareScopeUI() {
  const container = document.getElementById("shareScopeContainer");
  const btnAll = document.getElementById("btnShareScopeAll");
  const btnFiltered = document.getElementById("btnShareScopeFiltered");
  const countAll = document.getElementById("shareScopeAllCount");
  const countFiltered = document.getElementById("shareScopeFilteredCount");
  const filteredName = document.getElementById("shareScopeFilteredName");

  const hasFilter =
    typeof currentStoreFilter !== "undefined" &&
    currentStoreFilter &&
    currentStoreFilter !== "ALL";

  if (container) {
    if (hasFilter) {
      container.classList.remove("hidden");
      const allItems =
        (memoryState &&
          memoryState.activeList &&
          memoryState.activeList.items) ||
        [];
      const filteredItems = allItems.filter(
        (i) => i.store === currentStoreFilter
      );
      if (countAll) countAll.textContent = allItems.length;
      if (countFiltered) countFiltered.textContent = filteredItems.length;
      if (filteredName) filteredName.textContent = currentStoreFilter;

      if (currentShareScope === "FILTERED") {
        if (btnFiltered) {
          btnFiltered.className =
            "py-1.5 px-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white border border-emerald-500 cursor-pointer text-center";
        }
        if (btnAll) {
          btnAll.className =
            "py-1.5 px-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer text-center";
        }
      } else {
        if (btnAll) {
          btnAll.className =
            "py-1.5 px-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white border border-emerald-500 cursor-pointer text-center";
        }
        if (btnFiltered) {
          btnFiltered.className =
            "py-1.5 px-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer text-center";
        }
      }
    } else {
      container.classList.add("hidden");
      currentShareScope = "ALL";
    }
  }
}

function getActiveShareList() {
  if (
    currentShareScope === "FILTERED" &&
    typeof currentStoreFilter !== "undefined" &&
    currentStoreFilter &&
    currentStoreFilter !== "ALL"
  ) {
    const rawItems =
      (memoryState && memoryState.activeList && memoryState.activeList.items) ||
      [];
    return {
      title: `${(memoryState && memoryState.activeList && memoryState.activeList.title) || "Shopping List"} (${currentStoreFilter})`,
      items: rawItems.filter((i) => i.store === currentStoreFilter),
    };
  }
  return (
    (memoryState && memoryState.activeList) || {
      title: "Shopping List",
      items: [],
    }
  );
}

function openShareModal() {
  updateShareScopeUI();
  openModal("shareModal");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    invokeNativeShare,
    copyBuyListTextChecklist,
    copyShareUrl,
    exportBuyListJsonFile,
  };
}
