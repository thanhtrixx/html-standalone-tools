const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadEngine() {
  const htmlPath = path.join(
    __dirname,
    "../..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

  const storageMock = {};
  const docElementClasses = new Set(["dark"]);
  const listeners = {};
  const elementStore = {};

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
    Intl,
    crypto: {
      randomUUID: () => "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      getRandomValues: (buf) => {
        for (let i = 0; i < buf.length; i++) buf[i] = (i * 17) % 256;
        return buf;
      },
    },
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    encodeURIComponent,
    decodeURIComponent,
    escape,
    unescape,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    tailwind: {},
    addEventListener: (type, fn) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(""),
      },
      share: () => Promise.resolve(),
    },
    document: {
      getElementById: (id) => {
        if (!elementStore[id]) {
          elementStore[id] = {
            id,
            classList: {
              add: () => {},
              remove: () => {},
              contains: () => false,
              toggle: () => {},
            },
            textContent: "",
            innerHTML: "",
            style: {},
            value: "",
            appendChild: () => {},
            setAttribute: () => {},
            getAttribute: () => null,
            focus: () => {},
          };
        }
        return elementStore[id];
      },
      createElement: () => ({
        className: "",
        textContent: "",
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        remove: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
      }),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: (type, fn) => {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(fn);
      },
      documentElement: {
        lang: "vi",
        classList: {
          contains: (c) => docElementClasses.has(c),
          add: (c) => docElementClasses.add(c),
          remove: (c) => docElementClasses.delete(c),
        },
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
  return { sandbox, htmlContent, listeners, elementStore };
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

console.log("\n==================================================");
console.log("🧪 Smart Buy-List v4.3.0 Feature Verification (Issue #293)");
console.log("==================================================\n");

try {
  const { sandbox, htmlContent, elementStore } = loadEngine();

  // Test 1: normalizeItemKey function exists and works
  assert(
    typeof sandbox.normalizeItemKey === "function",
    "NORM-01: normalizeItemKey is exposed on global sandbox window"
  );
  assert(
    sandbox.normalizeItemKey("  Gạo ST25  ") === "gạo st25",
    "NORM-02: normalizeItemKey trims whitespace and lowercases string"
  );
  assert(
    sandbox.normalizeItemKey("") === "" &&
      sandbox.normalizeItemKey(null) === "" &&
      sandbox.normalizeItemKey(undefined) === "",
    "NORM-03: normalizeItemKey handles empty, null, and undefined safely"
  );

  // Test 2: Case-insensitive item matching in deal evaluation
  sandbox.memoryState.purchaseLedger = [
    {
      id: "log-1",
      itemName: "gạo st25",
      price: 150000,
      quantity: 5,
      unit: "kg",
      unitPrice: 30000,
      date: "2026-03-01",
      store: "WinMart",
    },
    {
      id: "log-2",
      itemName: "GẠO ST25",
      price: 160000,
      quantity: 5,
      unit: "kg",
      unitPrice: 32000,
      date: "2026-03-15",
      store: "Co.opmart",
    },
  ];

  // Render an item with mixed case "Gạo ST25" at cheaper price (25,000 / kg) -> GREAT_DEAL
  sandbox.currentPhase = "PLANNING";
  const itemGreatDeal = {
    id: "item-g1",
    name: "Gạo ST25",
    quantity: 5,
    unit: "kg",
    price: 125000,
    category: "pantry",
    store: "WinMart",
    checked: false,
  };
  const cardHtml = sandbox.renderItemCard(itemGreatDeal);
  assert(
    cardHtml.includes("🟢"),
    "DEAL-01: Case-insensitive matching associates 'Gạo ST25' with lowercase history to produce Great Deal"
  );
  assert(
    !cardHtml.includes("🟢 🟢"),
    "DEAL-02: Deal badge does not double-prefix the emoji icon"
  );

  // Test 3: Unmatched new item yields NEW_ITEM badge
  const itemNew = {
    id: "item-new-1",
    name: "Sữa Chua Hy Lạp",
    quantity: 1,
    unit: "hộp",
    price: 45000,
    category: "dairy",
    store: "WinMart",
    checked: false,
  };
  const newCardHtml = sandbox.renderItemCard(itemNew);
  assert(
    newCardHtml.includes("⚪"),
    "DEAL-03: First-time / unmatched item renders ⚪ New Item badge in Planning Mode"
  );

  // Test 4: Buy Mode item card includes deal badge on tablet/desktop (sm:flex)
  sandbox.currentPhase = "IN_STORE";
  const buyCardHtml = sandbox.renderItemCard(itemGreatDeal);
  assert(
    buyCardHtml.includes("sm:flex") && buyCardHtml.includes("🟢"),
    "DEAL-04: Buy Mode item card renders deal badge with responsive sm:flex wrapper for tablet/desktop"
  );

  // Test 5: Desktop Price Ledger Table Header contains thDealRating
  assert(
    htmlContent.includes('id="thDealRating"') &&
      htmlContent.includes("Deal Rating"),
    "LEDGER-01: Desktop price ledger thead contains #thDealRating column header"
  );

  // Test 6: Desktop Price Ledger renders Deal Rating cell for rows and empty colspan is 9
  sandbox.currentLanguage = "en";
  sandbox.renderPriceLedgerTable("");
  const ledgerBody = elementStore["ledgerTableBody"];
  assert(
    ledgerBody &&
      ledgerBody.innerHTML.includes("text-center whitespace-nowrap"),
    "LEDGER-02: renderPriceLedgerTable renders Deal Rating td cell for historical rows"
  );

  // Test empty state colspan
  sandbox.memoryState.purchaseLedger = [];
  sandbox.renderPriceLedgerTable("");
  assert(
    ledgerBody && ledgerBody.innerHTML.includes('colspan="9"'),
    "LEDGER-03: Empty price ledger displays empty row with colspan='9'"
  );

  // Test 7: applyTranslations applies th_deal_rating
  sandbox.currentLanguage = "vi";
  sandbox.applyTranslations();
  const thDealEl = elementStore["thDealRating"];
  assert(
    thDealEl && thDealEl.textContent === "Đánh Giá Giá",
    "I18N-01: applyTranslations populates #thDealRating with localized string in Vietnamese"
  );

  sandbox.currentLanguage = "en";
  sandbox.applyTranslations();
  assert(
    thDealEl && thDealEl.textContent === "Deal Rating",
    "I18N-02: applyTranslations populates #thDealRating with localized string in English"
  );
} catch (err) {
  console.error("❌ Test Execution Exception:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Smart Buy-List v4.3.0 Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
