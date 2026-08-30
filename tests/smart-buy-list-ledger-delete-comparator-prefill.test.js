const fs = require("fs");
const path = require("path");
const vm = require("vm");

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failCount++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log(
  "\n🧪 Running Smart Buy-List Ledger Deletion & Comparator Prefill Test Suite (v3.2.0)...\n"
);

const indexPath = path.join(
  __dirname,
  "../smart-buy-list-price-tracker/index.html"
);
const htmlContent = fs.readFileSync(indexPath, "utf-8");

const swPath = path.join(__dirname, "../smart-buy-list-price-tracker/sw.js");
const swContent = fs.readFileSync(swPath, "utf-8");

function createMockSandbox() {
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
        checked: false,
        textContent: "",
        innerHTML: "",
        className: "",
        children: [],
        style: {},
        placeholder: "",
        options: [],
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
        appendChild: function (child) {
          this.children.push(child);
        },
        addEventListener: function () {},
        removeEventListener: function () {},
        setAttribute: function (k, v) {
          this[k] = v;
        },
        getAttribute: function (k) {
          return this[k];
        },
        remove: function () {},
        focus: function () {},
        scrollIntoView: function () {},
      };
    }
    return elements[id];
  }

  // Pre-seed known DOM element IDs
  [
    "priceLedgerModal",
    "ledgerModalTitle",
    "ledgerModalTitleText",
    "ledgerSearchInput",
    "ledgerTableContainer",
    "ledgerTableBody",
    "thSelect",
    "thDate",
    "thItem",
    "thStore",
    "thSize",
    "thPaid",
    "thUnitPrice",
    "thAction",
    "ledgerSelectAllCheckbox",
    "ledgerBatchBar",
    "btnLedgerSelectAllToggle",
    "ledgerSelectedCountText",
    "ledgerSelectedTotalText",
    "btnAddSelectedLedgerToBuyList",
    "btnTextAddSelectedLedger",
    "btnDeleteSelectedLedger",
    "btnTextDeleteSelectedLedger",
    "toastContainer",
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
    "compItemNameLabel",
    "compItemCurrentUnitLabel",
    "btnApplyWinnerToList",
    "btnApplyWinner",
    "comparatorModal",
    "appVersionBadge",
    "liveUnitPreviewText",
    "activeItemsList",
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
    addEventListener: () => {},
    scrollTo: () => {},
    tailwind: { config: {} },
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(""),
      },
      vibrate: () => true,
    },
    document: {
      getElementById: (id) => getOrCreateElement(id),
      getElementsByName: () => [],
      querySelectorAll: (sel) => [],
      querySelector: (sel) => null,
      createElement: (tag) => {
        const el = getOrCreateElement("mock-" + Math.random());
        el.tagName = tag.toUpperCase();
        return el;
      },
      body: { style: {} },
      documentElement: {
        classList: { contains: () => false, add: () => {}, remove: () => {} },
      },
    },
    localStorage: {
      getItem: (k) => storageMock[k] || null,
      setItem: (k, v) => {
        storageMock[k] = String(v);
      },
      removeItem: (k) => {
        delete storageMock[k];
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
  return sandbox;
}

// ==========================================
// Section 1: DOM Elements & Markup Verification
// ==========================================
console.log("--- Section 1: DOM Elements & Markup Verification ---");
assert(
  htmlContent.includes('id="btnDeleteSelectedLedger"'),
  "LEDGER-DOM-01: #btnDeleteSelectedLedger batch delete button exists in DOM"
);
assert(
  htmlContent.includes("deleteLedgerItem("),
  "LEDGER-DOM-02: Row deletion handler deleteLedgerItem exists in script / table markup"
);
assert(
  htmlContent.includes("deleteSelectedLedgerItems()"),
  "LEDGER-DOM-03: Batch deletion handler deleteSelectedLedgerItems exists in markup"
);

// Verify Comparator has all 13 units
const compSelectMatches = [
  ...htmlContent.matchAll(
    /<select[^>]*id="compUnit[AB]"[^>]*>([\s\S]*?)<\/select>/gi
  ),
];
assert(
  compSelectMatches.length >= 2,
  "COMP-DOM-01: Found both compUnitA and compUnitB select dropdowns in HTML"
);
const unitKeys = [
  "kg",
  "g",
  "lb",
  "oz",
  "L",
  "ml",
  "gal",
  "fl oz",
  "ea",
  "pk",
  "box",
  "can",
  "bunch",
];
const allUnitsPresent = unitKeys.every(
  (u) =>
    compSelectMatches[0][1].includes(`value="${u}"`) &&
    compSelectMatches[1][1].includes(`value="${u}"`)
);
assert(
  allUnitsPresent,
  "COMP-DOM-02: compUnitA and compUnitB statically contain all 13 supported units across Weight, Volume, and Count"
);

// ==========================================
// Section 2: Historical Purchase Ledger Row-Level Deletion
// ==========================================
console.log("--- Section 2: Historical Purchase Ledger Row-Level Deletion ---");
const sb = createMockSandbox();
assert(
  typeof sb.deleteLedgerItem === "function",
  "LEDGER-FN-01: deleteLedgerItem is exported globally on window"
);

sb.memoryState.purchaseLedger = [
  {
    id: "rec-1",
    itemName: "Whole Milk",
    store: "Costco",
    price: 3.5,
    quantity: 1,
    unit: "gal",
    unitPrice: 0.92,
  },
  {
    id: "rec-2",
    itemName: "Jasmine Rice",
    store: "WinMart",
    price: 12.0,
    quantity: 5,
    unit: "kg",
    unitPrice: 2.4,
  },
  {
    id: "rec-3",
    itemName: "Olive Oil",
    store: "Target",
    price: 15.0,
    quantity: 1,
    unit: "L",
    unitPrice: 15.0,
  },
];

sb.deleteLedgerItem("rec-2");
assert(
  sb.memoryState.purchaseLedger.length === 2,
  "LEDGER-DEL-01a: deleteLedgerItem removes target entry by ID"
);
assert(
  !sb.memoryState.purchaseLedger.some((r) => r.id === "rec-2"),
  "LEDGER-DEL-01b: Removed record is no longer present in memoryState.purchaseLedger"
);

// Non-existent ID is safe no-op
sb.deleteLedgerItem("rec-999");
assert(
  sb.memoryState.purchaseLedger.length === 2,
  "LEDGER-DEL-01c: Deleting non-existent ID executes safely without altering state"
);

// ==========================================
// Section 3: Multi-Select Batch Deletion
// ==========================================
console.log("--- Section 3: Multi-Select Batch Deletion ---");
assert(
  typeof sb.deleteSelectedLedgerItems === "function",
  "LEDGER-FN-02: deleteSelectedLedgerItems is exported globally on window"
);

sb.memoryState.purchaseLedger = [
  {
    id: "b-1",
    itemName: "Eggs",
    store: "Costco",
    price: 4.0,
    quantity: 12,
    unit: "ea",
    unitPrice: 0.33,
  },
  {
    id: "b-2",
    itemName: "Bread",
    store: "Target",
    price: 2.5,
    quantity: 1,
    unit: "ea",
    unitPrice: 2.5,
  },
  {
    id: "b-3",
    itemName: "Apples",
    store: "Trader Joe's",
    price: 5.0,
    quantity: 2,
    unit: "kg",
    unitPrice: 2.5,
  },
  {
    id: "b-4",
    itemName: "Chicken",
    store: "Costco",
    price: 18.0,
    quantity: 3,
    unit: "kg",
    unitPrice: 6.0,
  },
];

sb.toggleLedgerRowSelect("b-1", true);
sb.toggleLedgerRowSelect("b-3", true);
sb.deleteSelectedLedgerItems();

assert(
  sb.memoryState.purchaseLedger.length === 2,
  "LEDGER-BATCH-01a: deleteSelectedLedgerItems deletes all selected entries in bulk"
);
assert(
  sb.memoryState.purchaseLedger.some((r) => r.id === "b-2") &&
    sb.memoryState.purchaseLedger.some((r) => r.id === "b-4"),
  "LEDGER-BATCH-01b: Preserves unselected entries accurately"
);
assert(
  sb.selectedLedgerIds.size === 0,
  "LEDGER-BATCH-01c: selectedLedgerIds is reset after batch deletion"
);

// ==========================================
// Section 4: Dynamic Deal Scoring & All-Time Low Recalculation
// ==========================================
console.log(
  "--- Section 4: Dynamic Deal Scoring & All-Time Low Recalculation ---"
);
sb.memoryState.purchaseLedger = [
  {
    id: "d-1",
    itemName: "Whole Milk",
    unitPrice: 1.0,
    quantity: 1,
    unit: "L",
    price: 1.0,
  }, // Historical record low
  {
    id: "d-2",
    itemName: "Whole Milk",
    unitPrice: 2.0,
    quantity: 1,
    unit: "L",
    price: 2.0,
  },
];

const dealBefore = sb.evaluateDealScore(
  1.5,
  sb.memoryState.purchaseLedger.filter((r) => r.itemName === "Whole Milk")
);
assert(
  dealBefore.minPrice === 1.0,
  "DEAL-RECALC-01a: Initial ATL reflects minPrice = 1.0"
);

// Delete the record low
sb.deleteLedgerItem("d-1");

const dealAfter = sb.evaluateDealScore(
  1.5,
  sb.memoryState.purchaseLedger.filter((r) => r.itemName === "Whole Milk")
);
assert(
  dealAfter.minPrice === 2.0,
  "DEAL-RECALC-01b: Deleting lowest price record dynamically recomputes minPrice ATL to 2.0"
);
assert(
  dealAfter.score === "GREAT_DEAL",
  "DEAL-RECALC-01c: Candidate price 1.5 is now lower than remaining record (2.0) -> GREAT_DEAL"
);

// ==========================================
// Section 5: Comparator Unit Normalization & Dimension Auto-Alignment
// ==========================================
console.log(
  "--- Section 5: Comparator Unit Normalization & Dimension Auto-Alignment ---"
);
sb.memoryState.activeList.items = [
  {
    id: "item-oil",
    name: "Olive Oil",
    category: "pantry",
    store: "Costco",
    price: 14.5,
    quantity: 1,
    unit: "L",
    checked: false,
  },
  {
    id: "item-rice",
    name: "Jasmine Rice",
    category: "pantry",
    store: "Target",
    price: 8.99,
    quantity: 5,
    unit: "lb",
    checked: false,
  },
  {
    id: "item-eggs",
    name: "Eggs",
    category: "dairy_eggs",
    store: "Trader Joe's",
    price: 4.29,
    quantity: 12,
    unit: "ea",
    checked: false,
  },
];

// Open comparator for item with uppercase unit 'L'
sb.openItemComparator("item-oil");
const compUnitA = sb.document.getElementById("compUnitA");
const compUnitB = sb.document.getElementById("compUnitB");

assert(
  compUnitA.value === "L",
  "COMP-UNIT-01: compUnitA is populated with item's exact unit 'L' without falling back to 'g'"
);
assert(
  compUnitB.value === "L" || compUnitB.value === "ml",
  "COMP-UNIT-02: compUnitB is auto-aligned to matching Volume dimension"
);

// Open comparator for item with imperial unit 'lb'
sb.openItemComparator("item-rice");
assert(
  compUnitA.value === "lb",
  "COMP-UNIT-03: compUnitA is populated with imperial unit 'lb'"
);
assert(
  compUnitB.value === "kg" ||
    compUnitB.value === "g" ||
    compUnitB.value === "lb",
  "COMP-UNIT-04: compUnitB is auto-aligned to matching Mass dimension"
);

// ==========================================
// Section 6: Apply Winner to Form Full Context Pre-fill
// ==========================================
console.log("--- Section 6: Apply Winner to Form Full Context Pre-fill ---");
sb.openItemComparator("item-oil");

// Set Winner to Package B (e.g. 2L bulk container for $24.00)
sb.document.getElementById("compPriceA").value = 14.5;
sb.document.getElementById("compQtyA").value = 1;
sb.document.getElementById("compUnitA").value = "L";

sb.document.getElementById("compPriceB").value = 24.0;
sb.document.getElementById("compQtyB").value = 2;
sb.document.getElementById("compUnitB").value = "L";

sb.applyComparatorWinner();

const formName = sb.document.getElementById("inputItemName");
const formAisle = sb.document.getElementById("inputItemCategory");
const formStore = sb.document.getElementById("inputItemStore");
const formPrice = sb.document.getElementById("inputItemPrice");
const formQty = sb.document.getElementById("inputItemQty");
const formUnit = sb.document.getElementById("inputItemUnit");

assert(
  formName.value === "Olive Oil",
  "PREFILL-01: Item Name is pre-filled from active comparing item"
);
assert(
  formAisle.value === "pantry",
  "PREFILL-02: Aisle/Category is pre-filled from active comparing item"
);
assert(
  formStore.value === "Costco",
  "PREFILL-03: Store is pre-filled from active comparing item"
);
assert(
  parseFloat(formPrice.value) === 24.0,
  "PREFILL-04: Winning price ($24.00) is transferred to form"
);
assert(
  parseFloat(formQty.value) === 2.0,
  "PREFILL-05: Winning quantity (2) is transferred to form"
);
assert(
  formUnit.value === "L",
  "PREFILL-06: Winning unit ('L') is transferred to form"
);
assert(
  sb.memoryState.settings.tripPhase === "PLANNING",
  "PREFILL-07: Automatically switches tripPhase to PLANNING"
);

// ==========================================
// Section 7: PWA Version Bump Synchronization
// ==========================================
console.log("--- Section 7: PWA Version Bump Synchronization ---");
assert(
  swContent.includes('const CACHE_NAME = "smart-buy-list-v3.2.0";') ||
    swContent.includes('const CACHE_NAME = "smart-buy-list-v3.3.0";') ||
    /CACHE_NAME = "smart-buy-list-v3\.[23]\.0"/.test(swContent),
  "PWA-01: sw.js CACHE_NAME incremented to smart-buy-list-v3.2.0 or higher"
);
assert(
  (htmlContent.includes("v3.2.0") || htmlContent.includes("v3.3.0")) &&
    htmlContent.includes('id="pwaVersionBadge"'),
  "PWA-02: index.html displays synchronized version badge v3.2.0 or higher"
);

// ==========================================
// Section 8: Bilingual Translation Parity
// ==========================================
console.log("--- Section 8: Bilingual Translation Parity ---");
const enKeys = Object.keys(sb.TRANSLATIONS.en);
const viKeys = Object.keys(sb.TRANSLATIONS.vi);

const newExpectedKeys = [
  "ledger_delete_item",
  "ledger_delete_selected",
  "toast_ledger_item_deleted",
  "toast_ledger_selected_deleted",
];

newExpectedKeys.forEach((k) => {
  assert(
    enKeys.includes(k),
    `I18N-PARITY-EN: English translation exists for '${k}'`
  );
  assert(
    viKeys.includes(k),
    `I18N-PARITY-VI: Vietnamese translation exists for '${k}'`
  );
});

console.log("\n==================================================");
console.log(
  `📊 Ledger & Comparator Test Summary: ${passCount} Passed, ${failCount} Failed`
);
console.log("==================================================");

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
