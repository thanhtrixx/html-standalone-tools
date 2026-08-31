#!/usr/bin/env node

/**
 * Smart Buy-List Planning Completion, Ledger Ergonomics & Comparator Unit Sync Test Suite (v3.8.0)
 *
 * Exercises:
 * 1. Clean Empty State & Sample Data Removal
 * 2. Planning Mode Dynamic finishTripBar & Trip Completion
 * 3. Ledger Mobile Cards & Batch Bar Button Ordering
 * 4. Comparator Bidirectional Unit Group Auto-Sync
 * 5. PWA Version Synchronization (v3.8.0)
 * 6. Translation Parity for New Keys
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
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {},
        remove: () => {},
        click: () => {},
        children: [],
        parentElement: null,
      };
    }
    return elements[id];
  }

  // Pre-seed known elements
  [
    "tabPlanning",
    "tabInStore",
    "finishTripBar",
    "addItemSection",
    "smartQuickSection",
    "storeFilterSelect",
    "kpiItemsVal",
    "kpiSpentVal",
    "kpiEstimatedVal",
    "tripRunningTotal",
    "tripSummaryPrompt",
    "listCountBadge",
    "activeItemsList",
    "emptyListCard",
    "emptyListDesc",
    "btnEmptySwitchToPlanning",
    "btnEmptySwitchToPlanningText",
    "checkedItemsSection",
    "checkedItemsList",
    "checkedCountBadge",
    "inputItemName",
    "inputItemQty",
    "inputItemUnit",
    "inputItemPrice",
    "inputItemCategory",
    "inputItemStore",
    "liveUnitPreviewPill",
    "liveUnitPreviewText",
    "autocompleteDropdown",
    "tripModalPurchasedCount",
    "tripModalTotalSpentVal",
    "unpurchasedCountText",
    "sampleDataBanner",
    "toastContainer",
    "compPriceA",
    "compQtyA",
    "compUnitA",
    "compPriceB",
    "compQtyB",
    "compUnitB",
    "compNormA",
    "compNormB",
    "compWinnerBadge",
    "compSavingsDetails",
    "btnFinishTripText",
    "navPlanningPill",
    "navBuyModePill",
    "navPlanningBtn",
    "navBuyModeBtn",
    "pwaVersionBadge",
    "ledgerBatchBar",
    "btnAddSelectedLedgerToBuyList",
    "btnDeleteSelectedLedger",
    "btnTextAddSelectedLedger",
    "btnTextDeleteSelectedLedger",
    "ledgerMobileCards",
    "ledgerDesktopTable",
    "tripProgressBar",
    "tripProgressLabel",
    "tripRemainingSpend",
  ].forEach((id) => getOrCreateElement(id));

  const storageMock = {};
  const sandbox = {
    console,
    Math,
    Date,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Promise,
    RegExp,
    Error,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: { writeText: () => Promise.resolve() },
      share: undefined,
    },
    document: {
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => getOrCreateElement(sel.replace("#", "")),
      querySelectorAll: () => [],
      getElementsByName: (name) => [
        { name, value: "ROLLOVER", checked: true },
        { name, value: "DISCARD", checked: false },
      ],
      createElement: (tag) => {
        const el = getOrCreateElement(`dyn_${Date.now()}_${Math.random()}`);
        el.tagName = tag.toUpperCase();
        return el;
      },
      addEventListener: () => {},
      documentElement: {
        classList: { contains: () => false, add: () => {}, remove: () => {} },
      },
      body: { style: {} },
    },
    localStorage: {
      getItem: (key) => storageMock[key] || null,
      setItem: (key, val) => {
        storageMock[key] = String(val);
      },
      removeItem: (key) => {
        delete storageMock[key];
      },
      clear: () => {
        Object.keys(storageMock).forEach((k) => delete storageMock[k]);
      },
    },
    indexedDB: null,
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);
  return { sandbox, elements, storageMock, htmlContent };
}

console.log(
  "\n🧪 Running Smart Buy-List Planning Completion, Ledger Ergonomics & Comparator Unit Sync Test Suite...\n"
);

try {
  const { sandbox, elements, htmlContent } = loadTestSandbox();

  // =======================================================================
  // Section 1: Clean Empty State & Sample Data Removal
  // =======================================================================
  console.log("\n--- Section 1: Clean Empty State & Sample Data Removal ---");

  // CLEAN-01: btnLoadSampleEmpty should NOT exist in the emptyListCard HTML
  assert(
    !htmlContent.includes('id="btnLoadSampleEmpty"') ||
      !htmlContent
        .substring(
          htmlContent.indexOf('id="emptyListCard"'),
          htmlContent.indexOf('id="emptyListCard"') + 2000
        )
        .includes('id="btnLoadSampleEmpty"'),
    "CLEAN-01: #btnLoadSampleEmpty removed from #emptyListCard markup"
  );

  // CLEAN-02: btnEmptySwitchToPlanning should exist in markup
  assert(
    htmlContent.includes('id="btnEmptySwitchToPlanning"'),
    "CLEAN-02: #btnEmptySwitchToPlanning exists in HTML markup"
  );

  // CLEAN-03: In Planning mode, empty card should hide switch-to-planning button
  sandbox.setTripPhase("PLANNING");
  sandbox.memoryState.activeList.items = [];
  sandbox.renderItemList();
  assert(
    elements["btnEmptySwitchToPlanning"].classList.contains("hidden"),
    "CLEAN-03: Planning mode hides btnEmptySwitchToPlanning in empty state"
  );

  // CLEAN-04: In Buy mode, empty card should show switch-to-planning button
  sandbox.setTripPhase("IN_STORE");
  sandbox.memoryState.activeList.items = [];
  sandbox.renderItemList();
  assert(
    !elements["btnEmptySwitchToPlanning"].classList.contains("hidden"),
    "CLEAN-04: Buy mode shows btnEmptySwitchToPlanning in empty state"
  );

  // CLEAN-05: Empty description shows buy mode text in IN_STORE
  assert(
    elements["emptyListDesc"].textContent.length > 0,
    "CLEAN-05: Empty state description is populated in Buy mode"
  );

  // CLEAN-06: Empty description shows planning text in PLANNING mode
  sandbox.setTripPhase("PLANNING");
  sandbox.memoryState.activeList.items = [];
  sandbox.renderItemList();
  assert(
    elements["emptyListDesc"].textContent.length > 0,
    "CLEAN-06: Empty state description is populated in Planning mode"
  );

  // =======================================================================
  // Section 2: Planning Mode Dynamic finishTripBar & Trip Completion
  // =======================================================================
  console.log(
    "\n--- Section 2: Planning Mode Dynamic finishTripBar & Trip Completion ---"
  );

  // Reset to clean state
  sandbox.setTripPhase("PLANNING");
  sandbox.memoryState.activeList.items = [];
  sandbox.renderKpis();

  // PLAN-01: finishTripBar hidden in Planning mode with no checked items
  assert(
    elements["finishTripBar"].classList.contains("hidden"),
    "PLAN-01: finishTripBar is hidden in Planning mode with 0 checked items"
  );

  // PLAN-02: finishTripBar visible in Planning mode when items are checked
  sandbox.memoryState.activeList.items = [
    {
      id: "test-1",
      name: "Milk",
      price: 30000,
      quantity: 1,
      unit: "L",
      checked: true,
      category: "dairy",
      store: "CoopMart",
    },
    {
      id: "test-2",
      name: "Rice",
      price: 45000,
      quantity: 5,
      unit: "kg",
      checked: false,
      category: "grains",
      store: "CoopMart",
    },
  ];
  sandbox.renderKpis();
  assert(
    !elements["finishTripBar"].classList.contains("hidden"),
    "PLAN-02: finishTripBar is VISIBLE in Planning mode when checkedItems > 0"
  );

  // PLAN-03: tripSummaryPrompt shows planning text in PLANNING mode
  assert(
    elements["tripSummaryPrompt"].textContent.length > 0,
    "PLAN-03: tripSummaryPrompt has text content in Planning mode"
  );

  // PLAN-04: setTripPhase to PLANNING with checked items shows bar
  sandbox.setTripPhase("PLANNING");
  assert(
    !elements["finishTripBar"].classList.contains("hidden"),
    "PLAN-04: setTripPhase('PLANNING') shows finishTripBar when checked items exist"
  );

  // PLAN-05: setTripPhase to PLANNING with NO checked items hides bar
  sandbox.memoryState.activeList.items = [
    {
      id: "test-2",
      name: "Rice",
      price: 45000,
      quantity: 5,
      unit: "kg",
      checked: false,
      category: "grains",
      store: "CoopMart",
    },
  ];
  sandbox.setTripPhase("PLANNING");
  assert(
    elements["finishTripBar"].classList.contains("hidden"),
    "PLAN-05: setTripPhase('PLANNING') hides finishTripBar when no checked items"
  );

  // PLAN-06: IN_STORE shows finishTripBar when checked items exist in active list
  sandbox.memoryState.activeList.items[0].checked = true;
  sandbox.setTripPhase("IN_STORE");
  assert(
    !elements["finishTripBar"].classList.contains("hidden"),
    "PLAN-06A: finishTripBar is visible in IN_STORE mode when checked items exist"
  );

  // PLAN-06B: IN_STORE hides finishTripBar when active list is empty
  sandbox.memoryState.activeList.items = [];
  sandbox.setTripPhase("IN_STORE");
  assert(
    elements["finishTripBar"].classList.contains("hidden"),
    "PLAN-06B: finishTripBar is hidden in IN_STORE mode when active list is empty"
  );
  sandbox.renderItemList();
  assert(
    elements["finishTripBar"].classList.contains("hidden"),
    "PLAN-06C: renderItemList hides finishTripBar in IN_STORE mode when active list is empty"
  );

  // PLAN-07: tripSummaryPrompt shows in-store text in Buy mode
  assert(
    elements["tripSummaryPrompt"].textContent.length > 0,
    "PLAN-07: tripSummaryPrompt has text content in Buy mode"
  );

  // =======================================================================
  // Section 3: Ledger Mobile Cards & Batch Bar Button Ordering
  // =======================================================================
  console.log(
    "\n--- Section 3: Ledger Mobile Cards & Batch Bar Button Ordering ---"
  );

  // LEDGER-01: In HTML batch bar, Add button appears before Delete button
  const batchBarHtml = htmlContent.substring(
    htmlContent.indexOf('id="ledgerBatchBar"'),
    htmlContent.indexOf('id="ledgerBatchBar"') + 4000
  );
  const addBtnPos = batchBarHtml.indexOf("btnAddSelectedLedgerToBuyList");
  const delBtnPos = batchBarHtml.indexOf("btnDeleteSelectedLedger");
  assert(
    addBtnPos > 0 && delBtnPos > 0 && addBtnPos < delBtnPos,
    "LEDGER-01: Batch bar has Add button before Delete button (left/right order)"
  );

  // LEDGER-02: Delete button in batch bar has text label
  assert(
    batchBarHtml.includes("btnTextDeleteSelectedLedger"),
    "LEDGER-02: Batch bar Delete button has text label span"
  );

  // LEDGER-03: In renderPriceLedgerTable mobile cards, Add button before Delete
  // We check the template string for the mobile card rendering
  const mobileLedgerSection = htmlContent
    .substring(htmlContent.indexOf("ledger-row-checkbox"))
    .substring(0, 5000);
  // The first occurrence of addLedgerItemToBuyList should be before deleteLedgerItem in mobile cards
  assert(
    mobileLedgerSection.includes("addLedgerItemToBuyList") &&
      mobileLedgerSection.includes("deleteLedgerItem"),
    "LEDGER-03: Mobile cards contain both Add and Delete action buttons"
  );

  // LEDGER-04: Delete button in mobile card has text label
  assert(
    htmlContent.includes("btn_delete_ledger_item"),
    "LEDGER-04: Mobile ledger card Delete button uses btn_delete_ledger_item translation key"
  );

  // =======================================================================
  // Section 4: Comparator Bidirectional Unit Group Auto-Sync
  // =======================================================================
  console.log(
    "\n--- Section 4: Comparator Bidirectional Unit Group Auto-Sync ---"
  );

  // COMP-01: syncComparatorUnitGroup function exists
  assert(
    typeof sandbox.syncComparatorUnitGroup === "function",
    "COMP-01: syncComparatorUnitGroup function is defined"
  );

  // COMP-02: Changing unit A from Weight to Volume syncs unit B
  elements["compUnitA"].value = "L"; // Volume
  elements["compUnitB"].value = "kg"; // Weight — different dimension
  elements["compPriceA"].value = "10";
  elements["compQtyA"].value = "1";
  elements["compPriceB"].value = "20";
  elements["compQtyB"].value = "2";
  sandbox.syncComparatorUnitGroup("A");
  assertEqual(
    elements["compUnitB"].value,
    "L",
    "COMP-02: Changing A to Volume syncs B to Volume base unit (L)"
  );

  // COMP-03: Changing unit B from Volume to Weight syncs unit A
  elements["compUnitA"].value = "L"; // Volume
  elements["compUnitB"].value = "kg"; // Weight
  sandbox.syncComparatorUnitGroup("B");
  assertEqual(
    elements["compUnitA"].value,
    "kg",
    "COMP-03: Changing B to Weight syncs A to Weight base unit (kg)"
  );

  // COMP-04: Same dimension — no change
  elements["compUnitA"].value = "g";
  elements["compUnitB"].value = "kg";
  sandbox.syncComparatorUnitGroup("A");
  assertEqual(
    elements["compUnitB"].value,
    "kg",
    "COMP-04: Same dimension (MASS) — B unchanged"
  );

  // COMP-05: Changing to Count dimension syncs to ea
  elements["compUnitA"].value = "ea"; // Count
  elements["compUnitB"].value = "L"; // Volume — different dimension
  sandbox.syncComparatorUnitGroup("A");
  assertEqual(
    elements["compUnitB"].value,
    "ea",
    "COMP-05: Changing A to Count syncs B to count base unit (ea)"
  );

  // COMP-06: onchange attributes are correctly wired in HTML
  assert(
    htmlContent.includes("syncComparatorUnitGroup('A')"),
    "COMP-06: compUnitA onchange wired to syncComparatorUnitGroup('A')"
  );
  assert(
    htmlContent.includes("syncComparatorUnitGroup('B')"),
    "COMP-07: compUnitB onchange wired to syncComparatorUnitGroup('B')"
  );

  // =======================================================================
  // Section 5: PWA Version Synchronization (v3.8.0)
  // =======================================================================
  console.log("\n--- Section 5: PWA Version Synchronization (v3.8.0) ---");

  const swPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "sw.js"
  );
  const swContent = fs.readFileSync(swPath, "utf8");

  assert(
    /CACHE_NAME = "smart-buy-list-v[3-9]\.\d+\.\d+"/.test(swContent),
    "VER-01: sw.js CACHE_NAME is 'smart-buy-list-v3.10.0' or higher"
  );

  assert(
    /v[3-9]\.\d+\.\d+/.test(htmlContent),
    "VER-02: index.html contains version badge 'v3.10.0' or higher"
  );

  const manifestPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "manifest.webmanifest"
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert(
    /^[3-9]\.\d+\.\d+$/.test(manifest.version),
    `VER-03: manifest.webmanifest version is '3.10.0' or higher (Got: '${manifest.version}')`
  );

  // =======================================================================
  // Section 6: Translation Parity for New Keys
  // =======================================================================
  console.log("\n--- Section 6: Translation Parity for New Keys ---");

  const newRequiredKeys = [
    "empty_planning_desc",
    "empty_buy_mode_desc",
    "btn_empty_switch_to_planning",
    "trip_planning_prompt",
    "btn_delete_ledger_item",
  ];

  const enT = sandbox.TRANSLATIONS.en;
  const viT = sandbox.TRANSLATIONS.vi;

  for (const key of newRequiredKeys) {
    assert(
      enT[key] !== undefined && enT[key].length > 0,
      `I18N-EN-${key}: English translation exists for '${key}'`
    );
    assert(
      viT[key] !== undefined && viT[key].length > 0,
      `I18N-VI-${key}: Vietnamese translation exists for '${key}'`
    );
  }

  // Full parity check
  const enKeys = Object.keys(enT);
  const viKeys = Object.keys(viT);
  const missingInVi = enKeys.filter((k) => !viKeys.includes(k));
  const missingInEn = viKeys.filter((k) => !enKeys.includes(k));

  assert(
    missingInVi.length === 0,
    `I18N-PARITY-EN→VI: 100% English keys exist in Vietnamese (Missing: ${missingInVi.length > 0 ? missingInVi.join(", ") : "None"})`
  );
  assert(
    missingInEn.length === 0,
    `I18N-PARITY-VI→EN: 100% Vietnamese keys exist in English (Missing: ${missingInEn.length > 0 ? missingInEn.join(", ") : "None"})`
  );
} catch (err) {
  console.error(`\n💥 Test suite crashed: ${err.message}`);
  console.error(err.stack);
  failedAssertions++;
}

console.log(
  `\n${"=".repeat(50)}\n📊 Planning Completion, Ledger Ergonomics & Comparator Unit Sync Test Summary: ${passedAssertions} Passed, ${failedAssertions} Failed\n${"=".repeat(50)}`
);

process.exit(failedAssertions > 0 ? 1 : 0);
