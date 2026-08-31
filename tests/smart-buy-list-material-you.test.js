const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListMaterialYouDOM() {
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
      };
    }
    return elements[id];
  }

  // Pre-seed DOM element IDs
  [
    "tabPlanning",
    "tabInStore",
    "navPlanningBtn",
    "navBuyModeBtn",
    "navLedgerBtn",
    "navCompareBtn",
    "navPlanningPill",
    "navBuyModePill",
    "finishTripBar",
    "addItemSection",
    "storeFilterSelect",
    "kpiItemsVal",
    "kpiSpentVal",
    "kpiEstimatedVal",
    "tripRunningTotal",
    "listCountBadge",
    "activeItemsList",
    "emptyListCard",
    "checkedItemsSection",
    "checkedItemsList",
    "checkedCountBadge",
    "inputItemName",
    "inputItemQty",
    "inputItemUnit",
    "inputItemPrice",
    "inputItemCategory",
    "inputItemStore",
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
    "compComparingItemBanner",
    "btnApplyWinnerToList",
    "comparatorModal",
    "priceLedgerModal",
    "shareModal",
    "quickPriceModal",
    "quickPriceItemId",
    "quickPriceInput",
    "quickQtyInput",
    "toastContainer",
    "fabAddItem",
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
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
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
  return { sandbox, elements, htmlContent };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log(
  "\n🧪 Running Smart Buy-List Material You (MD3) & Buy Mode Test Suite...\n"
);

try {
  const { sandbox, elements, htmlContent } = loadBuyListMaterialYouDOM();

  // 1. MD3 CSS THEME TOKENS
  console.log("--- Section 1: MD3 CSS Custom Properties & Zero-Runtime ---");
  assert(
    htmlContent.includes("--md-sys-color-primary") &&
      htmlContent.includes("--md-sys-color-surface-container"),
    "MD3-01: index.html defines standard MD3 CSS custom property tokens"
  );
  assert(
    htmlContent.includes("--md-sys-color-on-primary-container") &&
      htmlContent.includes("--md-sys-color-surface"),
    "MD3-02: index.html includes tonal container and surface tokens"
  );

  // 2. MD3 4-DESTINATION BOTTOM NAVIGATION BAR
  console.log(
    "\n--- Section 2: MD3 4-Destination Bottom Navigation Bar & Mode Switching ---"
  );
  sandbox.loadSampleData();
  sandbox.renderApp();

  // Switch to Buy Mode via setTripPhase('IN_STORE')
  sandbox.setTripPhase("IN_STORE");
  assert(
    sandbox.currentPhase === "IN_STORE",
    "MD3-03: currentPhase updates to IN_STORE"
  );
  assert(
    !elements["finishTripBar"].classList.contains("hidden"),
    "MD3-04: Buy Mode unhides sticky finishTripBar"
  );
  assert(
    elements["addItemSection"].classList.contains("hidden"),
    "MD3-05: Buy Mode collapses addItemSection for zero in-aisle distraction"
  );

  // Switch back to Planning Mode
  sandbox.setTripPhase("PLANNING");
  assert(
    sandbox.currentPhase === "PLANNING",
    "MD3-06: currentPhase switches cleanly to PLANNING"
  );
  assert(
    !elements["smartQuickSection"].classList.contains("hidden") ||
      !elements["addItemSection"].classList.contains("hidden"),
    "MD3-07: Planning Mode reveals smartQuickSection or addItemSection"
  );
  assert(
    elements["finishTripBar"].classList.contains("hidden"),
    "MD3-08: Planning Mode hides finishTripBar"
  );

  // 3. ITEM-CENTRIC IN-AISLE COMPARATOR PRE-FILL
  console.log(
    "\n--- Section 3: Item-Centric In-Aisle Comparator Pre-fill & Winner Apply ---"
  );

  const testItem = sandbox.memoryState.activeList.items[2];
  sandbox.openItemComparator(testItem.id);
  assert(
    sandbox.activeComparingItemId === testItem.id,
    `MD3-09: openItemComparator tracks active comparing item ID '${testItem.id}'`
  );
  assert(
    parseFloat(elements["compPriceA"].value) === testItem.price,
    `MD3-10: Pre-fills Package A price with item price (${testItem.price})`
  );
  assert(
    parseFloat(elements["compQtyA"].value) === testItem.quantity,
    `MD3-11: Pre-fills Package A quantity with item quantity (${testItem.quantity})`
  );
  assert(
    elements["compUnitA"].value === testItem.unit,
    `MD3-12: Pre-fills Package A unit with item unit ('${testItem.unit}')`
  );

  // Simulate entering Package B (Bulk Package: 10 units @ winning price)
  const expectedPrice = testItem.price * 1.5;
  const expectedQuantity = testItem.quantity * 2;
  elements["compPriceB"].value = String(expectedPrice);
  elements["compQtyB"].value = String(expectedQuantity);
  elements["compUnitB"].value = testItem.unit;
  sandbox.runComparatorCalc();

  // Apply Winner to Active Item
  sandbox.applyWinnerToActiveItem();
  const updatedItem = sandbox.memoryState.activeList.items.find(
    (i) => i.id === testItem.id
  );
  assert(
    updatedItem && updatedItem.price === expectedPrice,
    "MD3-13: Applying winner updates active item price"
  );
  assert(
    updatedItem && updatedItem.quantity === expectedQuantity,
    "MD3-14: Applying winner updates active item quantity"
  );
  assert(
    updatedItem && updatedItem.unit === testItem.unit,
    "MD3-15: Applying winner maintains correct unit"
  );

  // 4. QUICK IN-STORE PRICE ADJUSTMENT
  console.log("\n--- Section 4: Quick In-Store Price Adjustment ---");

  // Adjust Milk (item '1') from $3.50 to $3.29 in-store sticker price
  sandbox.quickUpdateItemPrice("1", 3.29, 2);
  const updatedMilk = sandbox.memoryState.activeList.items.find(
    (i) => i.id === "1"
  );
  assert(
    updatedMilk.price === 3.29,
    "MD3-16: quickUpdateItemPrice updates shelf price to $3.29"
  );

  // 5. TOP APP BAR SHARE & UTILITY PLACEMENT
  console.log("\n--- Section 5: Top App Bar Share Placement ---");
  assert(
    htmlContent.includes("openShareModal()") &&
      htmlContent.includes("headerTitle"),
    "MD3-17: Share button is placed in top header bar"
  );
  assert(
    typeof sandbox.openShareModal === "function",
    "MD3-18: openShareModal function is globally available"
  );
} catch (err) {
  console.error("❌ Test Execution Error:", err);
  failed++;
}

console.log("\n==================================================");
console.log(`📊 MD3 Test Summary: ${passed} Passed, ${failed} Failed`);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
