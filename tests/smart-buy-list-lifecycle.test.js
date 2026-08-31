const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListLifecycleDOM() {
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

  // Pre-seed known elements from index.html
  [
    "tabPlanning",
    "tabInStore",
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
    "liveUnitPreviewPill",
    "liveUnitPreviewText",
    "autocompleteDropdown",
    "tripModalPurchasedCount",
    "tripModalTotalSpentVal",
    "unpurchasedCountText",
    "sampleDataBanner",
    "toastContainer",
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
  return { sandbox, elements, storageMock };
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

console.log("\n🧪 Running Smart Buy-List Trip Lifecycle Test Suite...\n");

try {
  const { sandbox, elements } = loadBuyListLifecycleDOM();

  // 1. TRIP PHASE SWITCHING
  console.log("--- Section 1: 3-State Trip Lifecycle Phase Switching ---");

  sandbox.setTripPhase("IN_STORE");
  assert(
    elements["finishTripBar"].classList.contains("hidden"),
    "LIFE-01a: In-Store mode hides finishTripBar when active list is empty"
  );
  assert(
    elements["addItemSection"].classList.contains("hidden"),
    "LIFE-02: In-Store mode collapses addItemSection to focus on shopping"
  );

  sandbox.memoryState.activeList.items = [
    { id: "1", name: "Apple", price: 2, checked: true },
  ];
  sandbox.setTripPhase("IN_STORE");
  assert(
    !elements["finishTripBar"].classList.contains("hidden"),
    "LIFE-01b: In-Store mode reveals sticky finishTripBar when active list has checked items"
  );

  sandbox.memoryState.activeList.items = [];
  sandbox.setTripPhase("PLANNING");
  assert(
    elements["finishTripBar"].classList.contains("hidden"),
    "LIFE-03: Planning mode hides finishTripBar"
  );
  assert(
    !elements["smartQuickSection"].classList.contains("hidden") ||
      !elements["addItemSection"].classList.contains("hidden"),
    "LIFE-04: Planning mode reveals smartQuickSection or addItemSection"
  );

  // 2. RUNNING TOTAL & CHECKBOX LOGIC
  console.log(
    "\n--- Section 2: Live In-Store Spend Calculation & Checkbox ---"
  );

  sandbox.loadSampleData();
  sandbox.renderApp();
  const totalCount = sandbox.memoryState.activeList.items.length;

  assert(
    elements["kpiItemsVal"].textContent === `0 / ${totalCount}`,
    `LIFE-05: Initial check state shows 0 / ${totalCount} items checked`
  );
  assert(
    elements["kpiSpentVal"].textContent.includes("0"),
    "LIFE-06: Initial checked spend starts at 0"
  );

  // Check off first item
  const firstItem = sandbox.memoryState.activeList.items[0];
  sandbox.toggleItemCheck(firstItem.id);
  assert(
    elements["kpiItemsVal"].textContent === `1 / ${totalCount}`,
    `LIFE-07: Toggling item '${firstItem.id}' updates checked count to 1 / ${totalCount}`
  );
  assert(
    elements["kpiSpentVal"].textContent !== "0",
    "LIFE-08: Checked spend updates from 0"
  );

  // Check off second item
  const secondItem = sandbox.memoryState.activeList.items[1];
  sandbox.toggleItemCheck(secondItem.id);
  assert(
    elements["kpiItemsVal"].textContent === `2 / ${totalCount}`,
    `LIFE-09: Toggling item '${secondItem.id}' updates checked count to 2 / ${totalCount}`
  );
  assert(
    elements["kpiSpentVal"].textContent !== "0",
    "LIFE-10: Checked spend re-sums for 2 checked items"
  );

  // 3. TRIP FINALIZATION & UNPURCHASED ROLLOVER
  console.log("\n--- Section 3: Trip Finalization & Unpurchased Rollover ---");

  const preLedgerCount = sandbox.memoryState.purchaseLedger.length;
  sandbox.finalizeTripCompletion(); // 2 items were checked, (totalCount - 2) items unchecked

  assert(
    sandbox.memoryState.purchaseLedger.length === preLedgerCount + 2,
    "LIFE-11: Finalizing trip appends 2 checked items to purchaseLedger"
  );
  assert(
    sandbox.memoryState.activeList.items.length === totalCount - 2,
    `LIFE-12: Unchecked ${totalCount - 2} items are rolled over into a new draft list`
  );
  assert(
    sandbox.memoryState.activeList.items.every((i) => i.checked === false),
    "LIFE-13: Rolled over items are reset to unchecked (checked: false)"
  );

  // 4. AUTOCOMPLETE SUGGESTIONS
  console.log("\n--- Section 4: Item Autocomplete ---");

  sandbox.handleItemAutocomplete("sữa");
  assert(
    !elements["autocompleteDropdown"].classList.contains("hidden"),
    "LIFE-14: Searching 'sữa' reveals autocomplete dropdown"
  );
  assert(
    elements["autocompleteDropdown"].innerHTML.toLowerCase().includes("sữa") ||
      elements["autocompleteDropdown"].innerHTML
        .toLowerCase()
        .includes("vinamilk"),
    "LIFE-15: Autocomplete suggests 'Sữa' from historical purchases"
  );
} catch (err) {
  console.error("❌ Test Execution Error:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Trip Lifecycle Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
