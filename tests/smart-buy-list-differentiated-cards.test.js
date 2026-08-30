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
  "\n🧪 Running Smart Buy-List Differentiated Card UX Test Suite...\n"
);

const indexPath = path.join(
  __dirname,
  "../smart-buy-list-price-tracker/index.html"
);
const htmlContent = fs.readFileSync(indexPath, "utf-8");

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
        textContent: "",
        innerHTML: "",
        className: "",
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
        focus: () => {},
        scrollIntoView: () => {},
        appendChild: () => {},
        setAttribute: () => {},
        removeAttribute: () => {},
        remove: () => {},
      };
    }
    return elements[id];
  }

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
    "btnGroupByAisle",
    "btnGroupByStore",
    "settingsGroupingSelect",
    "settingsModal",
    "storeManagerModal",
  ].forEach((id) => getOrCreateElement(id));

  let vibrateCalls = [];
  const mockNavigator = {
    clipboard: { writeText: async () => {} },
    share: async () => {},
    vibrate: (pattern) => {
      vibrateCalls.push(pattern);
      return true;
    },
  };

  const storageMock = {};
  const sandbox = {
    console,
    Math,
    Date,
    parseFloat,
    parseInt,
    isNaN,
    isFinite,
    Intl,
    Array,
    Object,
    Set,
    Map,
    String,
    RegExp,
    JSON,
    encodeURIComponent,
    decodeURIComponent,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: mockNavigator,
    document: {
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => getOrCreateElement(sel.replace("#", "")),
      querySelectorAll: () => [],
      createElement: (tag) => {
        const el = getOrCreateElement(`dyn_${Date.now()}_${Math.random()}`);
        el.tagName = tag.toUpperCase();
        return el;
      },
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
    getVibrateCalls: () => vibrateCalls,
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  try {
    vm.runInContext(combinedScripts, sandbox);
  } catch (e) {
    console.error("Script execution error:", e);
  }

  return sandbox;
}

// -------------------------------------------------------------------------
// SECTION 1: Buy Mode Minimalist Card Rendering (Issue #159)
// -------------------------------------------------------------------------
console.log("--- Section 1: Buy Mode Minimalist Card Rendering ---");
const sb1 = createMockSandbox();
sb1.loadSampleData();
sb1.setTripPhase("IN_STORE");

const itemMilk = sb1.memoryState.activeList.items[0]; // Fresh Whole Milk
const buyCardHtml = sb1.renderItemCard(itemMilk);

assert(
  typeof buyCardHtml === "string" && buyCardHtml.length > 0,
  "DIFF-BUY-01: renderItemCard returns HTML string in IN_STORE mode"
);

assert(
  buyCardHtml.includes("Fresh Whole Milk"),
  "DIFF-BUY-02: Buy Mode card includes item name ('Fresh Whole Milk')"
);

assert(
  buyCardHtml.includes("toggleItemCheck"),
  "DIFF-BUY-03: Buy Mode card includes big checkbox trigger"
);

assert(
  buyCardHtml.includes("openQuickPriceEdit") && buyCardHtml.includes("$3.50"),
  "DIFF-BUY-04: Buy Mode card includes clickable shelf price ($3.50)"
);

assert(
  !buyCardHtml.includes("openItemComparator"),
  "DIFF-BUY-05: Buy Mode card hides inline comparator button (⚖️)"
);

assert(
  !buyCardHtml.includes("deleteItem"),
  "DIFF-BUY-06: Buy Mode card hides remove/delete button"
);

assert(
  !buyCardHtml.includes("Fair Price") && !buyCardHtml.includes("Great Deal"),
  "DIFF-BUY-07: Buy Mode card hides deal rating badges"
);

assert(
  !buyCardHtml.includes("/l") && !buyCardHtml.includes("/kg"),
  "DIFF-BUY-08: Buy Mode card hides normalized unit price"
);

assert(
  !buyCardHtml.includes("Costco"),
  "DIFF-BUY-09: Buy Mode card hides store name badge"
);

assert(
  buyCardHtml.includes("handleTouchStart") &&
    buyCardHtml.includes("swipeRightReveal") &&
    buyCardHtml.includes("swipeLeftReveal"),
  "DIFF-BUY-10: Buy Mode card retains touch swipe containers"
);

// -------------------------------------------------------------------------
// SECTION 2: Buy Mode Interactions & Swipes
// -------------------------------------------------------------------------
console.log("\n--- Section 2: Buy Mode Interactions & Swipes ---");
const initialChecked = itemMilk.checked;
sb1.toggleItemCheck(itemMilk.id);
assert(
  itemMilk.checked !== initialChecked,
  "DIFF-INT-01: toggleItemCheck toggles item checked status"
);

const vibrateCalls = sb1.getVibrateCalls();
assert(
  vibrateCalls.length > 0,
  "DIFF-INT-02: Checking item in Buy Mode triggers tactile haptic vibration"
);

// Test Swipe Right
sb1.handleItemSwipeAction(itemMilk.id, "RIGHT");
assert(
  itemMilk.checked === initialChecked,
  "DIFF-INT-03: Swipe Right toggles item check state"
);

// -------------------------------------------------------------------------
// Summary
// -------------------------------------------------------------------------
console.log(`\n==================================================`);
console.log(
  `📊 Differentiated Card UX Test Summary: ${passCount} Passed, ${failCount} Failed`
);
console.log(`==================================================\n`);

if (failCount > 0) {
  process.exit(1);
}
