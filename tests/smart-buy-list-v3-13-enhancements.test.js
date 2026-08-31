#!/usr/bin/env node

/**
 * Smart Buy-List v3.13.0 Enhancements Test Suite
 *
 * Exercises:
 * Section 1: Full Item Edit Modal (#editItemModal) in Planning Mode
 * Section 2: Dual-Modal Architecture (Planning Full Edit vs Buy Mode Quick Price Update)
 * Section 3: Streamlined 3-Row Planning Card Layout & Responsive Deal Badge
 * Section 4: Standardized Red-Tinted Delete Button & Unified Vocabulary
 * Section 5: Full-Width Quick Add Omnibox & Store Dropdown Removal
 * Section 6: Clean Store Typography & Emoji Purge
 * Section 7: PWA Version Synchronization (v3.13.0)
 * Section 8: Bilingual Translation Parity
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

function loadTestSandbox(mockFetch = null) {
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
        options: [],
        children: [],
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
        focus: function () {},
      };
    }
    return elements[id];
  }

  const localStorageData = {};
  const mockLocalStorage = {
    getItem: (key) => localStorageData[key] || null,
    setItem: (key, val) => {
      localStorageData[key] = String(val);
    },
    removeItem: (key) => {
      delete localStorageData[key];
    },
    clear: () => {
      Object.keys(localStorageData).forEach((k) => delete localStorageData[k]);
    },
  };

  const toastsShown = [];
  const modalsOpened = [];
  const modalsClosed = [];

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Promise,
    Error,
    tailwind: {},
    RegExp,
    Set,
    Map,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    fetch:
      mockFetch ||
      (async () => ({
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => "{}",
      })),
    localStorage: mockLocalStorage,
    window: {},
    document: {
      getElementById: (id) => getOrCreateElement(id),
      createElement: (tag) => {
        const el = getOrCreateElement("anon-" + Math.random());
        el.tagName = tag.toUpperCase();
        return el;
      },
      querySelectorAll: (sel) => [],
      querySelector: (sel) => null,
      addEventListener: () => {},
      documentElement: {
        classList: {
          add: () => {},
          remove: () => {},
          toggle: () => {},
          contains: () => false,
        },
      },
      body: {
        style: {},
        classList: {
          add: () => {},
          remove: () => {},
          toggle: () => {},
          contains: () => false,
        },
      },
    },
    navigator: {
      onLine: true,
      serviceWorker: {
        register: async () => ({ addEventListener: () => {} }),
        addEventListener: () => {},
        ready: Promise.resolve({ active: { postMessage: () => {} } }),
      },
      clipboard: {
        writeText: async () => {},
        readText: async () => "",
      },
      vibrate: () => true,
      share: async () => {},
      canShare: () => true,
    },
    location: {
      hash: "",
      reload: () => {},
      origin: "https://example.com",
      pathname: "/",
      search: "",
    },
    history: {
      replaceState: () => {},
    },
    CustomEvent: function (event, params) {
      this.event = event;
      this.params = params;
    },
    Event: function (type) {
      this.type = type;
    },
    alert: (msg) => {},
    confirm: (msg) => true,
    prompt: (msg, def) => def,
    _testHelpers: {
      toastsShown,
      modalsOpened,
      modalsClosed,
      elements,
    },
  };

  sandbox.window = sandbox;

  try {
    vm.createContext(sandbox);
    vm.runInContext(combinedScripts, sandbox);
  } catch (err) {
    console.error("Sandbox initialization error:", err);
  }

  return sandbox;
}

async function runTestSuite() {
  console.log(
    "================================================================================"
  );
  console.log("🧪 RUNNING SMART BUY-LIST v3.13.0 ENHANCEMENTS TEST SUITE");
  console.log(
    "================================================================================\n"
  );

  const htmlPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  // ==================== SECTION 1: Full Item Edit Modal in HTML & JS ====================
  console.log(
    "--- SECTION 1: Dedicated Full Edit Item Modal (#editItemModal) ---"
  );
  assert(
    htmlContent.includes('id="editItemModal"'),
    "EDIT-01: #editItemModal markup exists in HTML"
  );
  assert(
    htmlContent.includes('id="editItemName"'),
    "EDIT-02: #editItemName input exists in modal"
  );
  assert(
    htmlContent.includes('id="editItemCategory"'),
    "EDIT-03: #editItemCategory select exists in modal"
  );
  assert(
    htmlContent.includes('id="editItemStore"'),
    "EDIT-04: #editItemStore select exists in modal"
  );
  assert(
    htmlContent.includes('id="editItemQty"'),
    "EDIT-05: #editItemQty input exists in modal"
  );
  assert(
    htmlContent.includes('id="editItemUnit"'),
    "EDIT-06: #editItemUnit select exists in modal"
  );
  assert(
    htmlContent.includes('id="editItemPrice"'),
    "EDIT-07: #editItemPrice input exists in modal"
  );
  assert(
    htmlContent.includes('id="editItemLivePreview"'),
    "EDIT-08: #editItemLivePreview intelligence preview container exists in modal"
  );
  assert(
    htmlContent.includes("openFullItemEdit"),
    "EDIT-09: openFullItemEdit function is declared in scripts"
  );
  assert(
    htmlContent.includes("submitFullItemEdit"),
    "EDIT-10: submitFullItemEdit function is declared in scripts"
  );

  // Functional test for openFullItemEdit and submitFullItemEdit
  const sb = loadTestSandbox();
  sb.memoryState.activeList.items = [
    {
      id: "item-edit-1",
      name: "Sữa tươi hữu cơ",
      category: "dairy_eggs",
      store: "WinMart",
      quantity: 2,
      unit: "L",
      price: 70000,
      checked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  if (typeof sb.openFullItemEdit === "function") {
    sb.openFullItemEdit("item-edit-1");
    const nameEl = sb.document.getElementById("editItemName");
    const catEl = sb.document.getElementById("editItemCategory");
    const storeEl = sb.document.getElementById("editItemStore");
    const qtyEl = sb.document.getElementById("editItemQty");
    const unitEl = sb.document.getElementById("editItemUnit");
    const priceEl = sb.document.getElementById("editItemPrice");

    assertEqual(
      nameEl.value,
      "Sữa tươi hữu cơ",
      "EDIT-11: openFullItemEdit pre-fills item name"
    );
    assertEqual(
      catEl.value,
      "dairy_eggs",
      "EDIT-12: openFullItemEdit pre-fills category"
    );
    assertEqual(
      storeEl.value,
      "WinMart",
      "EDIT-13: openFullItemEdit pre-fills store"
    );
    assertEqual(qtyEl.value, 2, "EDIT-14: openFullItemEdit pre-fills quantity");
    assertEqual(unitEl.value, "L", "EDIT-15: openFullItemEdit pre-fills unit");
    assertEqual(
      priceEl.value,
      70000,
      "EDIT-16: openFullItemEdit pre-fills price"
    );

    // Simulate modifying all attributes and submitting
    nameEl.value = "Sữa tươi TH True Milk";
    catEl.value = "dairy_eggs";
    storeEl.value = "Bach Hoa Xanh";
    qtyEl.value = 3;
    unitEl.value = "L";
    priceEl.value = 105000;

    sb.submitFullItemEdit();

    const updated = sb.memoryState.activeList.items.find(
      (i) => i.id === "item-edit-1"
    );
    assert(Boolean(updated), "EDIT-17: Item exists after edit");
    assertEqual(
      updated.name,
      "Sữa tươi TH True Milk",
      "EDIT-18: Item name updated"
    );
    assertEqual(updated.store, "Bach Hoa Xanh", "EDIT-19: Item store updated");
    assertEqual(updated.quantity, 3, "EDIT-20: Item quantity updated");
    assertEqual(updated.price, 105000, "EDIT-21: Item price updated");
  }

  // ==================== SECTION 2: Dual Modal Architecture ====================
  console.log("\n--- SECTION 2: Dual Modal Architecture ---");
  const planningCardHtml = sb.renderItemCard({
    id: "test-card-1",
    name: "Gạo Jasmine",
    category: "pantry",
    store: "Costco",
    quantity: 5,
    unit: "kg",
    price: 150000,
    checked: false,
  });

  assert(
    planningCardHtml.includes("openFullItemEdit('test-card-1')"),
    "DUAL-01: Planning card 'Edit' button calls openFullItemEdit()"
  );

  sb.setTripPhase("IN_STORE");
  const buyModeCardHtml = sb.renderItemCard({
    id: "test-card-2",
    name: "Trứng gà",
    category: "dairy_eggs",
    store: "WinMart",
    quantity: 10,
    unit: "ea",
    price: 35000,
    checked: false,
  });

  assert(
    buyModeCardHtml.includes("openQuickPriceEdit('test-card-2')"),
    "DUAL-02: In-Store Buy Mode price button calls openQuickPriceEdit()"
  );

  // ==================== SECTION 3: Streamlined 3-Row Planning Card Layout ====================
  console.log("\n--- SECTION 3: Streamlined 3-Row Planning Card Layout ---");
  sb.setTripPhase("PLANNING");
  sb.memoryState.purchaseLedger = [
    {
      id: "ledger-test-1",
      itemName: "Thịt ba chỉ",
      unitPrice: 120000,
      price: 120000,
      quantity: 1,
      unit: "kg",
      store: "WinMart",
      date: new Date().toISOString(),
    },
  ];
  const pCard = sb.renderItemCard({
    id: "plan-card-1",
    name: "Thịt ba chỉ",
    category: "meat_seafood",
    store: "WinMart",
    quantity: 1,
    unit: "kg",
    price: 120000,
    checked: false,
  });

  // Check that Store Name is NOT rendered in Planning Card top row
  assert(
    !pCard.includes("🏪 WinMart") && !pCard.includes("🏪 ${item.store"),
    "CARD-01: Planning Card does not display redundant store badge in top header row"
  );

  // Check that Deal Badge is present and has responsive mobile icon-only + desktop full badge classes
  assert(
    pCard.includes("sm:hidden") || pCard.includes("hidden sm:inline"),
    "CARD-02: Planning Card includes responsive deal indicator badge classes (mobile icon vs desktop text)"
  );

  assert(
    pCard.includes("ATL:") || pCard.includes("Giá thấp nhất:"),
    "CARD-03: Planning Card Row 2 displays ATL baseline pricing intelligence"
  );

  // ==================== SECTION 4: Standardized Red-Tinted Delete Button & Vocabulary ====================
  console.log(
    "\n--- SECTION 4: Standardized Red-Tinted Delete Button & Vocabulary ---"
  );
  assert(
    pCard.includes("deleteItem('plan-card-1')"),
    "DEL-01: Planning Card action button invokes deleteItem()"
  );
  assert(
    pCard.includes("bg-red-500/20") ||
      pCard.includes("bg-red-950/40") ||
      pCard.includes("text-red-300"),
    "DEL-02: Planning Card delete button uses red-accented styling matching Historical Ledger"
  );
  assert(
    pCard.includes("🗑️"),
    "DEL-03: Planning Card delete button features 🗑️ trash icon"
  );

  // ==================== SECTION 5: Full-Width Quick Add Omnibox & Store Dropdown Removal ====================
  console.log(
    "\n--- SECTION 5: Full-Width Quick Add Omnibox & Store Dropdown Removal ---"
  );
  assert(
    !htmlContent.includes('id="smartQuickStoreSelect"'),
    "QADD-01: #smartQuickStoreSelect is removed from Quick Add form markup"
  );

  const smartFormMatch = htmlContent.match(
    /<form[^>]*id="smartQuickForm"[^>]*>([\s\S]*?)<\/form>/i
  );
  assert(
    smartFormMatch && !smartFormMatch[1].includes("<select"),
    "QADD-02: Quick Add form markup contains zero embedded select dropdowns"
  );

  // Verify that Omnibox automatically inherits active store filter
  sb.currentStoreFilter = "Costco";
  sb.memoryState.stores = ["Costco", "Trader Joe's", "WinMart"];
  sb.document.getElementById("smartQuickInput").value = "Sữa chua 45k 4 ea";
  sb.handleSmartQuickInputSubmit();

  const addedItem =
    sb.memoryState.activeList.items[sb.memoryState.activeList.items.length - 1];
  assertEqual(
    addedItem.store,
    "Costco",
    "QADD-03: Quick Add inherits active store filter chip context ('Costco')"
  );

  // Verify that Omnibox parses natural language @store shorthand
  sb.currentStoreFilter = "ALL";
  sb.document.getElementById("smartQuickInput").value =
    "Bánh mì 25k @Trader Joe's";
  sb.handleSmartQuickInputSubmit();

  const addedItem2 =
    sb.memoryState.activeList.items[sb.memoryState.activeList.items.length - 1];
  assertEqual(
    addedItem2.store,
    "Trader Joe's",
    "QADD-04: Quick Add parses natural language @store shorthand ('Trader Joe\\'s')"
  );

  // ==================== SECTION 6: Clean Store Typography & Emoji Purge ====================
  console.log("\n--- SECTION 6: Clean Store Typography & Emoji Purge ---");
  // Check Group By Store header in renderItemList
  sb.currentGrouping = "BY_STORE";
  sb.renderItemList();
  const itemListEl = sb.document.getElementById("itemListContainer");
  assert(
    !itemListEl.innerHTML.includes("<span>🏪</span>"),
    "STORE-01: 'By Store' group headers do not contain 🏪 store emoji"
  );

  assert(
    htmlContent.includes("Manage Stores") ||
      htmlContent.includes("Quản lý cửa hàng"),
    "STORE-02: Store Manager modal has clean descriptive header"
  );

  // ==================== SECTION 7: PWA Version Synchronization (v3.13.0) ====================
  console.log("\n--- SECTION 7: PWA Version Synchronization (v3.13.0) ---");
  const manifestPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "manifest.webmanifest"
  );
  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assertEqual(
    manifestContent.version,
    "3.13.0",
    "VER-01: manifest.webmanifest version is 3.13.0"
  );

  const swPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "sw.js"
  );
  const swContent = fs.readFileSync(swPath, "utf8");
  assert(
    swContent.includes("smart-buy-list-v3.13.0"),
    "VER-02: sw.js CACHE_NAME is smart-buy-list-v3.13.0"
  );

  assert(
    htmlContent.includes("v3.13.0"),
    "VER-03: index.html references v3.13.0"
  );

  // ==================== SECTION 8: Bilingual Translation Parity ====================
  console.log("\n--- SECTION 8: Bilingual Translation Parity ---");
  assert(Boolean(sb.TRANSLATIONS), "I18N-01: TRANSLATIONS object is loaded");
  const requiredKeys = [
    "edit_modal_title",
    "edit_item_name_label",
    "edit_item_cat_label",
    "edit_item_store_label",
    "edit_item_qty_label",
    "edit_item_unit_label",
    "edit_item_price_label",
    "btn_save_edit_item",
    "toast_item_updated",
    "delete_btn",
    "delete_item_title",
  ];

  requiredKeys.forEach((key) => {
    assert(
      sb.TRANSLATIONS.en && key in sb.TRANSLATIONS.en,
      `I18N-KEY-EN: TRANSLATIONS.en contains key '${key}'`
    );
    assert(
      sb.TRANSLATIONS.vi && key in sb.TRANSLATIONS.vi,
      `I18N-KEY-VI: TRANSLATIONS.vi contains key '${key}'`
    );
  });

  // Check 100% parity across all keys
  const enKeys = Object.keys(sb.TRANSLATIONS.en || {});
  const viKeys = Object.keys(sb.TRANSLATIONS.vi || {});
  const missingInVi = enKeys.filter((k) => !viKeys.includes(k));
  const missingInEn = viKeys.filter((k) => !enKeys.includes(k));

  assertEqual(
    missingInVi.length,
    0,
    `I18N-PARITY-EN→VI: 100% English keys exist in Vietnamese (Missing: ${missingInVi.join(", ") || "None"})`
  );
  assertEqual(
    missingInEn.length,
    0,
    `I18N-PARITY-VI→EN: 100% Vietnamese keys exist in English (Missing: ${missingInEn.join(", ") || "None"})`
  );

  console.log(
    "\n================================================================================"
  );
  console.log(
    `🏁 RESULTS: ${passedAssertions} passed, ${failedAssertions} failed.`
  );
  console.log(
    "================================================================================"
  );

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
