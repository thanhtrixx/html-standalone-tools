/* =========================================================================
       6. UI RENDERING & COMPONENT INTERACTIONS
       ========================================================================= */
const TAB_ORDER = ["PLANNING", "BUY", "PRICE_HISTORY", "COMPARATOR"];
let currentActiveTab = "PLANNING";
let currentPhase = "PLANNING";
let currentGrouping = "AISLE";
let currentStoreFilter = "ALL";
let currentLanguage = "vi";
let currentCurrency = "VND";

function setActiveTab(tab, options = {}) {
  if (!TAB_ORDER.includes(tab)) return;

  if (!options.fromPopState && tab !== currentActiveTab) {
    try {
      if (
        typeof window !== "undefined" &&
        window.history &&
        window.history.pushState
      ) {
        window.history.pushState({ tab }, "");
      }
    } catch (e) {
      // Ignore sandboxed history errors
    }
  }

  currentActiveTab = tab;
  if (typeof window !== "undefined") {
    window.currentActiveTab = tab;
  }

  const viewPlanning = document.getElementById("viewPlanning");
  const viewBuy = document.getElementById("viewBuy");
  const viewPriceHistory = document.getElementById("viewPriceHistory");
  const viewComparator = document.getElementById("viewComparator");
  const tripSummarySection = document.getElementById("tripSummarySection");
  const shoppingListSection = document.getElementById("shoppingListSection");

  if (viewPlanning) viewPlanning.classList.add("hidden");
  if (viewBuy) viewBuy.classList.add("hidden");
  if (viewPriceHistory) viewPriceHistory.classList.add("hidden");
  if (viewComparator) viewComparator.classList.add("hidden");
  if (shoppingListSection) shoppingListSection.classList.add("hidden");

  if (tab !== "COMPARATOR" && !options.preserveItem) {
    activeComparingItemId = null;
    const compBanner = document.getElementById("compComparingItemBanner");
    const btnApplyWinner = document.getElementById("btnApplyWinnerToList");
    if (compBanner) compBanner.classList.add("hidden");
    if (btnApplyWinner) btnApplyWinner.classList.add("hidden");
  }

  if (tab === "PLANNING") {
    if (tripSummarySection) tripSummarySection.classList.remove("hidden");
    if (viewPlanning) viewPlanning.classList.remove("hidden");
    if (shoppingListSection) shoppingListSection.classList.remove("hidden");
    setTripPhase("PLANNING", false);
  } else if (tab === "BUY") {
    if (tripSummarySection) tripSummarySection.classList.remove("hidden");
    if (viewBuy) viewBuy.classList.remove("hidden");
    if (shoppingListSection) shoppingListSection.classList.remove("hidden");
    setTripPhase("IN_STORE", false);
  } else if (tab === "PRICE_HISTORY") {
    if (tripSummarySection) tripSummarySection.classList.add("hidden");
    if (viewPriceHistory) viewPriceHistory.classList.remove("hidden");
    if (typeof renderPriceLedgerTable === "function") {
      renderPriceLedgerTable();
    }
  } else if (tab === "COMPARATOR") {
    if (tripSummarySection) tripSummarySection.classList.add("hidden");
    if (viewComparator) viewComparator.classList.remove("hidden");
    if (typeof runComparatorCalc === "function") {
      runComparatorCalc();
    }
  }

  updateBottomNavPills();
}

function updateBottomNavPills() {
  const tabs = [
    { name: "PLANNING", btn: "navPlanningBtn", pill: "navPlanningPill" },
    { name: "BUY", btn: "navBuyModeBtn", pill: "navBuyModePill" },
    { name: "PRICE_HISTORY", btn: "navLedgerBtn", pill: "navLedgerPill" },
    { name: "COMPARATOR", btn: "navCompareBtn", pill: "navComparePill" },
  ];

  tabs.forEach(({ name, btn, pill }) => {
    const btnEl = document.getElementById(btn);
    const pillEl = document.getElementById(pill);
    const isActive = currentActiveTab === name;

    if (btnEl) {
      if (typeof btnEl.setAttribute === "function") {
        btnEl.setAttribute("aria-selected", isActive ? "true" : "false");
      }
      btnEl.className = isActive
        ? "flex flex-col items-center gap-0.5 text-xs font-semibold py-1 text-emerald-400 transition-colors cursor-pointer"
        : "flex flex-col items-center gap-0.5 text-xs font-semibold py-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer";
    }
    if (pillEl) {
      pillEl.className = isActive
        ? "w-14 h-7 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-base font-bold transition-all"
        : "w-14 h-7 rounded-full flex items-center justify-center text-base font-bold transition-all text-slate-400";
    }
  });
}

function setTripPhase(phase, syncTab = true) {
  currentPhase = phase;
  if (syncTab) {
    currentActiveTab = phase === "PLANNING" ? "PLANNING" : "BUY";
  }
  if (memoryState && memoryState.settings) {
    memoryState.settings.tripPhase = phase;
  }
  saveToLocalStorage();
  const tabPlanning = document.getElementById("tabPlanning");
  const tabInStore = document.getElementById("tabInStore");
  const finishBar = document.getElementById("finishTripBar");
  const addItemSection = document.getElementById("addItemSection");
  const smartQuickSection = document.getElementById("smartQuickSection");

  if (phase === "PLANNING") {
    if (tabPlanning) {
      tabPlanning.className =
        "px-3 py-1 rounded-lg transition-all bg-emerald-600 text-white shadow-sm";
    }
    if (tabInStore) {
      tabInStore.className =
        "px-3 py-1 rounded-lg transition-all text-slate-400 hover:text-slate-200";
    }
    const hasChecked =
      memoryState &&
      memoryState.activeList &&
      Array.isArray(memoryState.activeList.items) &&
      memoryState.activeList.items.some((i) => i.checked);
    if (finishBar) {
      if (hasChecked) {
        finishBar.classList.remove("hidden");
      } else {
        finishBar.classList.add("hidden");
      }
    }
    const tripSummaryPrompt = document.getElementById("tripSummaryPrompt");
    if (tripSummaryPrompt) {
      const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
      tripSummaryPrompt.textContent =
        t.trip_planning_prompt || "Ready to Complete Trip";
    }
    if (smartQuickSection) smartQuickSection.classList.remove("hidden");
  } else {
    if (tabPlanning) {
      tabPlanning.className =
        "px-3 py-1 rounded-lg transition-all text-slate-400 hover:text-slate-200";
    }
    if (tabInStore) {
      tabInStore.className =
        "px-3 py-1 rounded-lg transition-all bg-emerald-600 text-white shadow-sm";
    }
    const hasChecked =
      memoryState &&
      memoryState.activeList &&
      Array.isArray(memoryState.activeList.items) &&
      memoryState.activeList.items.some((i) => i.checked);
    if (finishBar) {
      if (hasChecked) {
        finishBar.classList.remove("hidden");
      } else {
        finishBar.classList.add("hidden");
      }
    }
    const tripSummaryPrompt = document.getElementById("tripSummaryPrompt");
    if (tripSummaryPrompt) {
      const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
      tripSummaryPrompt.textContent =
        t.trip_active || "In-Store Shopping Active";
    }
    if (smartQuickSection) smartQuickSection.classList.add("hidden");
    if (addItemSection) addItemSection.classList.add("hidden");
  }
  updateBottomNavPills();
  renderApp();
}

function setGrouping(grouping) {
  currentGrouping = grouping;
  if (memoryState && memoryState.settings) {
    memoryState.settings.grouping = grouping;
  }
  saveToLocalStorage();
  const btnAisle = document.getElementById("btnGroupByAisle");
  const btnStore = document.getElementById("btnGroupByStore");
  const settingsSelect = document.getElementById("settingsGroupingSelect");
  if (settingsSelect) settingsSelect.value = grouping;

  if (grouping === "AISLE") {
    if (btnAisle)
      btnAisle.className =
        "px-2.5 py-1 rounded-md transition-all bg-emerald-600 text-white font-medium";
    if (btnStore)
      btnStore.className =
        "px-2.5 py-1 rounded-md transition-all text-slate-400 hover:text-slate-200";
  } else {
    if (btnAisle)
      btnAisle.className =
        "px-2.5 py-1 rounded-md transition-all text-slate-400 hover:text-slate-200";
    if (btnStore)
      btnStore.className =
        "px-2.5 py-1 rounded-md transition-all bg-emerald-600 text-white font-medium";
  }
  renderApp();
}

let currentCategoryFilter = "ALL";

function onStoreFilterChange(store) {
  if (store === "MANAGE_STORES") {
    openStoreManagerModal();
    const select = document.getElementById("storeFilterSelect");
    if (select) select.value = currentStoreFilter;
    return;
  }
  currentStoreFilter = store;
  const quickStoreSelect = document.getElementById("smartQuickStoreSelect");
  if (quickStoreSelect && store !== "ALL") {
    quickStoreSelect.value = store;
  }
  renderApp();
}

function onSmartQuickStoreSelectChange(val) {
  if (val === "MANAGE_STORES") {
    openStoreManagerModal();
    const quickStoreSelect = document.getElementById("smartQuickStoreSelect");
    if (quickStoreSelect) {
      const stores = memoryState.stores || DEFAULT_STORES;
      quickStoreSelect.value =
        currentStoreFilter !== "ALL" && stores.includes(currentStoreFilter)
          ? currentStoreFilter
          : stores[0] || "WinMart";
    }
  } else {
    const input = document.getElementById("smartQuickInput");
    if (input && input.value) {
      handleSmartQuickInputChange(input.value);
    }
  }
}

function filterByCategory(category) {
  currentCategoryFilter = category;
  renderCategoryFilterChips();
  renderItemList();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TAB_ORDER,
    setActiveTab,
    setTripPhase,
    setGrouping,
    onStoreFilterChange,
    filterByCategory,
  };
}
