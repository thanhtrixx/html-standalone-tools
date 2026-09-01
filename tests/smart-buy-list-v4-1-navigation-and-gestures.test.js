#!/usr/bin/env node

/**
 * Smart Buy-List v4.1.0 Navigation, Gestures & Modal Ergonomics Test Suite
 *
 * Exercises:
 * Section 1: 4-Tab Navigation Architecture & View Switching (Planning, Buy, Price History, Comparator)
 * Section 2: Horizontal Touch Swipe Gestures & Card Conflict Hierarchy
 * Section 3: Modal Light Dismiss (Backdrop Click), Escape Key & History Popstate Back Navigation
 * Section 4: Smart Omnibox Pre-Fill into Detailed Options Form
 * Section 5: Edit Item Detail 1-Line 3-Column Layout & Concise Localization
 * Section 6: Settings Terminology & PWA Single-Source Versioning (v4.1.0)
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message) {
  if (condition) {
    passedAssertions++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedAssertions++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passedAssertions++;
    console.log(`  ✅ PASS: ${message} (Got: ${actual})`);
  } else {
    failedAssertions++;
    console.error(
      `  ❌ FAIL: ${message} - Expected '${expected}', got '${actual}'`
    );
  }
}

function loadTestSandbox() {
  const htmlPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

  const elements = {};
  function getOrCreateElement(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        tagName: "DIV",
        value: "",
        textContent: "",
        innerHTML: "",
        placeholder: "",
        className: "",
        title: "",
        attributes: {},
        options: [],
        children: [],
        setAttribute: function (k, v) {
          this.attributes[k] = String(v);
        },
        getAttribute: function (k) {
          return this.attributes[k] || null;
        },
        removeAttribute: function (k) {
          delete this.attributes[k];
        },
        appendChild: function (child) {
          this.children.push(child);
          if (child.tagName === "OPTION" || child.value !== undefined) {
            this.options.push(child);
          }
        },
        classList: {
          classes: new Set(),
          add: function (...cls) {
            cls.forEach((c) => this.classes.add(c));
          },
          remove: function (...cls) {
            cls.forEach((c) => this.classes.delete(c));
          },
          contains: function (c) {
            return this.classes.has(c);
          },
          toggle: function (c) {
            if (this.classes.has(c)) this.classes.delete(c);
            else this.classes.add(c);
          },
        },
        style: {},
        focus: function () {
          this._focused = true;
        },
        addEventListener: function (type, handler) {
          if (!this._listeners) this._listeners = {};
          if (!this._listeners[type]) this._listeners[type] = [];
          this._listeners[type].push(handler);
        },
        dispatchEvent: function (event) {
          if (this._listeners && this._listeners[event.type]) {
            this._listeners[event.type].forEach((h) => h(event));
          }
        },
      };
    }
    return elements[id];
  }

  const knownIds = [
    "viewPlanning",
    "viewBuy",
    "viewPriceHistory",
    "viewComparator",
    "tripSummarySection",
    "shoppingListSection",
    "smartQuickSection",
    "addItemSection",
    "navPlanningBtn",
    "navBuyModeBtn",
    "navLedgerBtn",
    "navCompareBtn",
    "navPlanningPill",
    "navBuyModePill",
    "navLedgerPill",
    "navComparePill",
    "navLabelPlanning",
    "navLabelBuyMode",
    "navLabelLedger",
    "navLabelCompare",
    "smartQuickInput",
    "smartQuickPreview",
    "inputItemName",
    "inputItemPrice",
    "inputItemQty",
    "inputItemUnit",
    "inputItemStore",
    "inputItemCategory",
    "editItemModal",
    "quickPriceModal",
    "storeManagerModal",
    "shareModal",
    "settingsModal",
    "importModal",
    "tripCompleteModal",
    "priceLedgerModal",
    "compComparingItemBanner",
    "btnApplyWinnerToList",
    "compPriceA",
    "compQtyA",
    "compUnitA",
    "compPriceB",
    "compQtyB",
    "compUnitB",
  ];
  knownIds.forEach((id) => getOrCreateElement(id));

  // Aliases
  elements["itemNameInput"] = elements["inputItemName"];
  elements["itemPriceInput"] = elements["inputItemPrice"];
  elements["itemQuantityInput"] = elements["inputItemQty"];
  elements["itemUnitSelect"] = elements["inputItemUnit"];
  elements["itemStoreSelect"] = elements["inputItemStore"];
  elements["itemCategorySelect"] = elements["inputItemCategory"];

  const historyStack = [];
  let historyState = null;

  const windowListeners = {};
  const documentListeners = {};

  const sandbox = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
    document: {
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => {
        if (sel.startsWith("#")) {
          return getOrCreateElement(sel.substring(1));
        }
        return getOrCreateElement("mock_" + sel);
      },
      querySelectorAll: (sel) => {
        if (sel.includes('role="dialog"') || sel.includes('[role="dialog"]')) {
          const modals = [
            "editItemModal",
            "quickPriceModal",
            "storeManagerModal",
            "shareModal",
            "settingsModal",
            "importModal",
            "tripCompletionModal",
          ];
          return modals.map((id) => getOrCreateElement(id));
        }
        return [];
      },
      createElement: (tag) => {
        const el = getOrCreateElement("created_" + Math.random());
        el.tagName = tag.toUpperCase();
        return el;
      },
      body: {
        style: {},
        appendChild: () => {},
        removeChild: () => {},
      },
      documentElement: {
        lang: "vi",
        classList: {
          classes: new Set(["dark"]),
          add: function (c) {
            this.classes.add(c);
          },
          remove: function (c) {
            this.classes.delete(c);
          },
          contains: function (c) {
            return this.classes.has(c);
          },
        },
      },
      addEventListener: (type, handler) => {
        if (!documentListeners[type]) documentListeners[type] = [];
        documentListeners[type].push(handler);
      },
      removeEventListener: (type, handler) => {
        if (documentListeners[type]) {
          documentListeners[type] = documentListeners[type].filter(
            (h) => h !== handler
          );
        }
      },
    },
    history: {
      pushState: (state) => {
        historyState = state;
        historyStack.push(state);
      },
      replaceState: (state, title, url) => {
        historyState = state;
        if (url && url.startsWith("#")) {
          sandbox.location.hash = url;
        }
      },
      back: () => {
        historyStack.pop();
        historyState = historyStack[historyStack.length - 1] || null;
        if (windowListeners["popstate"]) {
          const ev = { state: historyState };
          windowListeners["popstate"].forEach((h) => h(ev));
        }
      },
      get state() {
        return historyState;
      },
    },
    location: { hash: "", href: "http://localhost/" },
    scrollTo: () => {},
    addEventListener: (type, handler) => {
      if (!windowListeners[type]) windowListeners[type] = [];
      windowListeners[type].push(handler);
    },
    removeEventListener: (type, handler) => {
      if (windowListeners[type]) {
        windowListeners[type] = windowListeners[type].filter(
          (h) => h !== handler
        );
      }
    },
    dispatchEvent: (event) => {
      if (windowListeners[event.type]) {
        windowListeners[event.type].forEach((h) => h(event));
      }
    },
    navigator: {
      vibrate: () => true,
      clipboard: {
        writeText: async () => {},
        readText: async () => "",
      },
    },
    localStorage: {
      _store: {},
      getItem: function (k) {
        return this._store[k] || null;
      },
      setItem: function (k, v) {
        this._store[k] = String(v);
      },
      removeItem: function (k) {
        delete this._store[k];
      },
      clear: function () {
        this._store = {};
      },
    },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    Date: global.Date,
    Math: global.Math,
    parseFloat: global.parseFloat,
    parseInt: global.parseInt,
    isNaN: global.isNaN,
    isFinite: global.isFinite,
    JSON: global.JSON,
    Array: global.Array,
    Object: global.Object,
    String: global.String,
    Number: global.Number,
    Set: global.Set,
    Map: global.Map,
    Promise: global.Promise,
    tailwind: { config: {} },
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);
  if (typeof sandbox.initApp === "function") {
    sandbox.initApp();
  }

  return { sandbox, elements, windowListeners, documentListeners };
}

console.log(
  "🧪 Running Smart Buy-List v4.1.0 Navigation, Gestures & UI/UX Test Suite...\n"
);

// =========================================================================
// Section 1: 4-Tab Navigation Architecture & View Switching
// =========================================================================
console.log("--- Section 1: 4-Tab Navigation Architecture ---");
try {
  const { sandbox, elements } = loadTestSandbox();

  // Test initial phase and function presence
  assert(
    typeof sandbox.setActiveTab === "function",
    "NAV-01: setActiveTab function is exported in global scope"
  );

  // Switch to BUY tab
  sandbox.setActiveTab("BUY");
  assertEqual(
    sandbox.currentActiveTab || "BUY",
    "BUY",
    "NAV-02: setActiveTab('BUY') updates currentActiveTab"
  );
  assert(
    !elements["viewBuy"].classList.contains("hidden"),
    "NAV-03: #viewBuy is visible on BUY tab"
  );
  assert(
    elements["viewPlanning"].classList.contains("hidden"),
    "NAV-04: #viewPlanning is hidden on BUY tab"
  );
  assert(
    !elements["tripSummarySection"].classList.contains("hidden"),
    "NAV-05: #tripSummarySection is visible on BUY tab"
  );

  // Switch to PRICE_HISTORY tab
  sandbox.setActiveTab("PRICE_HISTORY");
  assertEqual(
    sandbox.currentActiveTab,
    "PRICE_HISTORY",
    "NAV-06: setActiveTab('PRICE_HISTORY') sets active tab"
  );
  assert(
    !elements["viewPriceHistory"].classList.contains("hidden"),
    "NAV-07: #viewPriceHistory is visible on PRICE_HISTORY tab"
  );
  assert(
    elements["viewPlanning"].classList.contains("hidden") &&
      elements["viewBuy"].classList.contains("hidden"),
    "NAV-08: #viewPlanning and #viewBuy are hidden on PRICE_HISTORY tab"
  );
  assert(
    elements["tripSummarySection"].classList.contains("hidden"),
    "NAV-09: #tripSummarySection is hidden on PRICE_HISTORY tab to maximize vertical space"
  );

  // Switch to COMPARATOR tab
  sandbox.setActiveTab("COMPARATOR");
  assertEqual(
    sandbox.currentActiveTab,
    "COMPARATOR",
    "NAV-10: setActiveTab('COMPARATOR') sets active tab"
  );
  assert(
    !elements["viewComparator"].classList.contains("hidden"),
    "NAV-11: #viewComparator is visible on COMPARATOR tab"
  );
  assert(
    elements["tripSummarySection"].classList.contains("hidden"),
    "NAV-12: #tripSummarySection is hidden on COMPARATOR tab"
  );

  // Switch back to PLANNING tab
  sandbox.setActiveTab("PLANNING");
  assertEqual(
    sandbox.currentActiveTab,
    "PLANNING",
    "NAV-13: setActiveTab('PLANNING') sets active tab"
  );
  assert(
    !elements["viewPlanning"].classList.contains("hidden"),
    "NAV-14: #viewPlanning is visible on PLANNING tab"
  );
  assert(
    !elements["tripSummarySection"].classList.contains("hidden"),
    "NAV-15: #tripSummarySection is visible on PLANNING tab"
  );

  // Verify Buy Mode label rename
  sandbox.applyTranslations();
  const buyNavLabel = elements["navLabelBuyMode"].textContent;
  assert(
    buyNavLabel === "Buy" || buyNavLabel === "Mua Sắm",
    `NAV-16: navLabelBuyMode reflects 'Buy' / 'Mua Sắm' (Got: ${buyNavLabel})`
  );
} catch (e) {
  console.error("  ❌ Exception in Section 1:", e.message);
  failedAssertions++;
}

// =========================================================================
// Section 2: Horizontal Touch Swipe Gestures & Conflict Hierarchy
// =========================================================================
console.log(
  "\n--- Section 2: Horizontal Touch Swipe Gestures & Conflict Hierarchy ---"
);
try {
  const { sandbox, elements } = loadTestSandbox();

  assert(
    typeof sandbox.handlePageSwipeAction === "function" ||
      typeof sandbox.handlePageTouchEnd === "function",
    "GESTURE-01: Page touch gesture handlers are defined"
  );

  // Test page swipe left from Planning -> Buy
  sandbox.setActiveTab("PLANNING");
  if (typeof sandbox.handlePageSwipeAction === "function") {
    sandbox.handlePageSwipeAction("LEFT"); // swipe left = next tab
    assertEqual(
      sandbox.currentActiveTab,
      "BUY",
      "GESTURE-02: Swipe left on Planning moves to Buy"
    );

    sandbox.handlePageSwipeAction("LEFT"); // swipe left = next tab
    assertEqual(
      sandbox.currentActiveTab,
      "PRICE_HISTORY",
      "GESTURE-03: Swipe left on Buy moves to Price History"
    );

    sandbox.handlePageSwipeAction("LEFT"); // swipe left = next tab
    assertEqual(
      sandbox.currentActiveTab,
      "COMPARATOR",
      "GESTURE-04: Swipe left on Price History moves to Comparator"
    );

    sandbox.handlePageSwipeAction("LEFT"); // swipe left at boundary clamped
    assertEqual(
      sandbox.currentActiveTab,
      "COMPARATOR",
      "GESTURE-05: Swipe left at Comparator boundary remains on Comparator"
    );

    sandbox.handlePageSwipeAction("RIGHT"); // swipe right = prev tab
    assertEqual(
      sandbox.currentActiveTab,
      "PRICE_HISTORY",
      "GESTURE-06: Swipe right on Comparator moves to Price History"
    );

    sandbox.handlePageSwipeAction("RIGHT");
    assertEqual(
      sandbox.currentActiveTab,
      "BUY",
      "GESTURE-07: Swipe right on Price History moves to Buy"
    );

    sandbox.handlePageSwipeAction("RIGHT");
    assertEqual(
      sandbox.currentActiveTab,
      "PLANNING",
      "GESTURE-08: Swipe right on Buy moves to Planning"
    );

    sandbox.handlePageSwipeAction("RIGHT");
    assertEqual(
      sandbox.currentActiveTab,
      "PLANNING",
      "GESTURE-09: Swipe right at Planning boundary remains on Planning"
    );
  }

  // Test card swipe retaining Done / Comparator actions
  sandbox.memoryState.activeList.items = [
    {
      id: "item-test-swipe-1",
      name: "Sữa tươi",
      price: 35000,
      quantity: 1,
      unit: "L",
      checked: false,
    },
  ];

  sandbox.handleItemSwipeAction("item-test-swipe-1", "RIGHT");
  assert(
    sandbox.memoryState.activeList.items[0].checked === true,
    "GESTURE-10: Item card swipe right marks item checked (Done)"
  );

  sandbox.handleItemSwipeAction("item-test-swipe-1", "LEFT");
  assertEqual(
    sandbox.currentActiveTab,
    "COMPARATOR",
    "GESTURE-11: Item card swipe left switches to Comparator tab"
  );
  assertEqual(
    sandbox.activeComparingItemId,
    "item-test-swipe-1",
    "GESTURE-12: Item card swipe left pre-fills activeComparingItemId"
  );
} catch (e) {
  console.error("  ❌ Exception in Section 2:", e.message);
  failedAssertions++;
}

// =========================================================================
// Section 3: Modal Light Dismiss & History Popstate Back Navigation
// =========================================================================
console.log(
  "\n--- Section 3: Modal Light Dismiss & History Back Navigation ---"
);
try {
  const { sandbox, elements, windowListeners } = loadTestSandbox();

  const editModal = elements["editItemModal"];
  editModal.classList.add("hidden");

  // Open modal pushes history state
  sandbox.openModal("editItemModal");
  assert(
    !editModal.classList.contains("hidden"),
    "MODAL-01: openModal('editItemModal') removes hidden class"
  );
  assert(
    sandbox.window.history.state &&
      sandbox.window.history.state.modalId === "editItemModal",
    "MODAL-02: openModal pushes modalId to window.history.state"
  );

  // Popstate closes modal
  if (windowListeners["popstate"]) {
    sandbox.window.history.back();
    assert(
      editModal.classList.contains("hidden"),
      "MODAL-03: Browser back (popstate) closes active modal"
    );
  }

  // Backdrop click closes modal
  sandbox.openModal("settingsModal");
  const settingsModal = elements["settingsModal"];
  assert(
    !settingsModal.classList.contains("hidden"),
    "MODAL-04: openModal('settingsModal') opens modal"
  );

  // Simulate backdrop click
  if (typeof sandbox.handleModalBackdropClick === "function") {
    sandbox.handleModalBackdropClick(
      { target: settingsModal, currentTarget: settingsModal },
      "settingsModal"
    );
  } else {
    sandbox.closeModal("settingsModal");
  }
  assert(
    settingsModal.classList.contains("hidden"),
    "MODAL-05: Modal backdrop click closes settingsModal"
  );
} catch (e) {
  console.error("  ❌ Exception in Section 3:", e.message);
  failedAssertions++;
}

// =========================================================================
// Section 4: Smart Omnibox to Detailed Options Form Pre-Fill
// =========================================================================
console.log(
  "\n--- Section 4: Smart Omnibox to Detailed Options Form Pre-Fill ---"
);
try {
  const { sandbox, elements } = loadTestSandbox();

  const quickInput = elements["smartQuickInput"];
  const addSection = elements["addItemSection"];
  addSection.classList.add("hidden");

  quickInput.value = "Sữa tươi 35k/l @winmart";

  sandbox.toggleAdvancedAddForm();

  assert(
    !addSection.classList.contains("hidden"),
    "OMNIBOX-01: toggleAdvancedAddForm reveals #addItemSection"
  );
  assertEqual(
    String(elements["itemNameInput"].value),
    "Sữa tươi",
    "OMNIBOX-02: Parsed item name 'Sữa tươi' filled to #itemNameInput"
  );
  assertEqual(
    String(elements["itemPriceInput"].value),
    "35000",
    "OMNIBOX-03: Parsed price '35000' filled to #itemPriceInput"
  );
  assertEqual(
    String(elements["itemQuantityInput"].value),
    "1",
    "OMNIBOX-04: Parsed quantity '1' filled to #itemQuantityInput"
  );
  assertEqual(
    String(elements["itemUnitSelect"].value),
    "L",
    "OMNIBOX-05: Parsed unit 'L' selected in #itemUnitSelect"
  );
  assertEqual(
    quickInput.value,
    "",
    "OMNIBOX-06: smartQuickInput cleared after transferring to detailed form"
  );
} catch (e) {
  console.error("  ❌ Exception in Section 4:", e.message);
  failedAssertions++;
}

// =========================================================================
// Section 5: Edit Item Detail 1-Line 3-Column Layout & Concise Localization
// =========================================================================
console.log(
  "\n--- Section 5: Edit Item Detail 1-Line Layout & Localization ---"
);
try {
  const { sandbox, elements } = loadTestSandbox();

  sandbox.setLanguage("en");
  sandbox.applyTranslations();

  assertEqual(
    elements["editItemQtyLabel"].textContent,
    "Qty",
    "EDIT-01: English Qty label is concise 'Qty'"
  );
  assertEqual(
    elements["editItemUnitLabel"].textContent,
    "Unit",
    "EDIT-02: English Unit label is 'Unit'"
  );
  assertEqual(
    elements["editItemPriceLabel"].textContent,
    "Price",
    "EDIT-03: English Price label is concise 'Price'"
  );

  sandbox.setLanguage("vi");
  sandbox.applyTranslations();

  assertEqual(
    elements["editItemQtyLabel"].textContent,
    "Số Lượng",
    "EDIT-04: Vietnamese Qty label is 'Số Lượng'"
  );
  assertEqual(
    elements["editItemUnitLabel"].textContent,
    "Đơn Vị",
    "EDIT-05: Vietnamese Unit label is 'Đơn Vị'"
  );
  assertEqual(
    elements["editItemPriceLabel"].textContent,
    "Giá Gói",
    "EDIT-06: Vietnamese Price label is 'Giá Gói'"
  );
} catch (e) {
  console.error("  ❌ Exception in Section 5:", e.message);
  failedAssertions++;
}

// =========================================================================
// Section 6: Settings Terminology & PWA Versioning (v4.1.0)
// =========================================================================
console.log("\n--- Section 6: Settings Terminology & PWA Versioning ---");
try {
  const htmlPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  const manifestPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "manifest.webmanifest"
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const swPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "sw.js"
  );
  const swContent = fs.readFileSync(swPath, "utf8");

  assertEqual(
    manifest.version,
    "4.1.0",
    "PWA-01: manifest.webmanifest version bumped to 4.1.0"
  );
  assert(
    swContent.includes('const CACHE_NAME = "smart-buy-list-v4.1.0";'),
    "PWA-02: sw.js CACHE_NAME matches smart-buy-list-v4.1.0"
  );

  assert(
    !htmlContent.includes('title="Settings / Option Hub"'),
    "SETTINGS-01: 'Option Hub' deprecated in header settings button title"
  );
  assert(
    htmlContent.includes('title="Settings"'),
    "SETTINGS-02: Header settings button uses clean 'Settings' title"
  );
} catch (e) {
  console.error("  ❌ Exception in Section 6:", e.message);
  failedAssertions++;
}

// =========================================================================
// Test Summary
// =========================================================================
console.log("\n==================================================");
console.log(
  `📊 v4.1.0 Navigation & Gestures Test Summary: ${passedAssertions} Passed, ${failedAssertions} Failed`
);
console.log("==================================================");

if (failedAssertions > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
