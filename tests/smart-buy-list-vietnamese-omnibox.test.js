const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListEngine(options = {}) {
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

  const domElements = {};

  function getMockEl(id) {
    if (!domElements[id]) {
      const classSet = new Set(["hidden"]);
      domElements[id] = {
        id,
        classList: {
          classes: classSet,
          add(c) {
            classSet.add(c);
          },
          remove(c) {
            classSet.delete(c);
          },
          contains(c) {
            return classSet.has(c);
          },
          toggle(c, force) {
            if (force === undefined) {
              if (classSet.has(c)) classSet.delete(c);
              else classSet.add(c);
            } else if (force) classSet.add(c);
            else classSet.delete(c);
          },
        },
        textContent: "",
        innerHTML: "",
        value: "",
        title: "",
        placeholder: "",
        style: {},
        appendChild() {},
        focus() {},
        scrollIntoView() {},
        setAttribute(k, v) {
          this[k] = v;
        },
        getAttribute(k) {
          return this[k];
        },
      };
    }
    return domElements[id];
  }

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
    RegExp,
    Promise,
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    encodeURIComponent,
    decodeURIComponent,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(""),
      },
      vibrate: () => true,
    },
    document: {
      getElementById: (id) => getMockEl(id),
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: (tag) => {
        const el = getMockEl(
          "created-" + Math.random().toString(36).substr(2, 9)
        );
        el.tagName = tag.toUpperCase();
        return el;
      },
      documentElement: { classList: { add() {}, remove() {}, toggle() {} } },
      body: { appendChild() {} },
    },
    window: {},
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
  };

  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(combinedScripts, context);

  return { sandbox, htmlContent, domElements, getMockEl };
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
  "\n🧪 Running Smart Buy-List Vietnamese-First Defaults, Smart Omnibox & Currency Ergonomics Test Suite..."
);

// --- Section 1: Vietnam-First Baseline Defaults & Banner Removal ---
console.log(
  "\n--- Section 1: Vietnam-First Baseline Defaults & Banner Removal ---"
);
{
  const { sandbox, htmlContent } = loadBuyListEngine();
  const state = sandbox.memoryState;

  assert(
    state.settings.language === "vi",
    `VN-DEF-01a: settings.language defaults to 'vi' (Got: '${state.settings.language}')`
  );
  assert(
    state.settings.currency === "VND",
    `VN-DEF-01b: settings.currency defaults to 'VND' (Got: '${state.settings.currency}')`
  );
  assert(
    Array.isArray(state.activeList.items) &&
      state.activeList.items.length === 0,
    `VN-DEF-01c: activeList.items initializes clean and empty (Got: ${state.activeList.items.length})`
  );
  assert(
    Array.isArray(state.purchaseLedger) && state.purchaseLedger.length === 0,
    `VN-DEF-01d: purchaseLedger initializes clean and empty (Got: ${state.purchaseLedger.length})`
  );

  const defaultStores = sandbox.DEFAULT_STORES || state.stores;
  assert(
    defaultStores.includes("WinMart"),
    "VN-DEF-02a: DEFAULT_STORES includes 'WinMart'"
  );
  assert(
    defaultStores.includes("Bách Hoá Xanh"),
    "VN-DEF-02b: DEFAULT_STORES includes 'Bách Hoá Xanh'"
  );
  assert(
    defaultStores.includes("Co.opmart"),
    "VN-DEF-02c: DEFAULT_STORES includes 'Co.opmart'"
  );
  assert(
    defaultStores.includes("Big C / GO!"),
    "VN-DEF-02d: DEFAULT_STORES includes 'Big C / GO!'"
  );
  assert(
    defaultStores.includes("Lotte Mart"),
    "VN-DEF-02e: DEFAULT_STORES includes 'Lotte Mart'"
  );
  assert(
    defaultStores.includes("Chợ truyền thống"),
    "VN-DEF-02f: DEFAULT_STORES includes 'Chợ truyền thống'"
  );
  assert(
    defaultStores.includes("Cửa hàng tiện lợi"),
    "VN-DEF-02g: DEFAULT_STORES includes 'Cửa hàng tiện lợi'"
  );

  assert(
    !htmlContent.includes('id="sampleDataBanner"'),
    "VN-DEF-03: #sampleDataBanner is decommissioned from HTML"
  );
}

// --- Section 2: Flag Emoji Language Switcher ---
console.log("\n--- Section 2: Flag Emoji Language Switcher ---");
{
  const { sandbox, getMockEl } = loadBuyListEngine();
  const langBtn = getMockEl("langToggleBtn");

  sandbox.setLanguage("vi");
  assert(
    langBtn.textContent.includes("🇻🇳") || langBtn.innerHTML.includes("🇻🇳"),
    `VN-FLAG-01a: Language button renders 🇻🇳 in Vietnamese mode (Got: '${langBtn.textContent}')`
  );

  sandbox.toggleLanguage();
  assert(
    sandbox.currentLanguage === "en",
    "VN-FLAG-01b: toggleLanguage switches active language to 'en'"
  );
  assert(
    langBtn.textContent.includes("🇺🇸") || langBtn.innerHTML.includes("🇺🇸"),
    `VN-FLAG-01c: Language button renders 🇺🇸 in English mode (Got: '${langBtn.textContent}')`
  );

  sandbox.toggleLanguage();
  assert(
    sandbox.currentLanguage === "vi",
    "VN-FLAG-01d: toggleLanguage switches back to 'vi'"
  );
}

// --- Section 3: Currency-Aware Quick Price Adjustment Chips ---
console.log("\n--- Section 3: Currency-Aware Quick Price Adjustment Chips ---");
{
  const { sandbox, getMockEl } = loadBuyListEngine();
  const input = getMockEl("quickPriceInput");
  const container = getMockEl("quickPriceAdjustChipsContainer");

  sandbox.currentCurrency = "VND";
  if (typeof sandbox.renderQuickPriceAdjustmentChips === "function") {
    sandbox.renderQuickPriceAdjustmentChips();
  }

  input.value = "35000";
  sandbox.stepQuickPrice(5000);
  assert(
    parseFloat(input.value) === 40000,
    `VND-CHIP-01a: stepQuickPrice(+5000) increments 35,000 to 40,000 (Got: ${input.value})`
  );

  sandbox.stepQuickPrice(-10000);
  assert(
    parseFloat(input.value) === 30000,
    `VND-CHIP-01b: stepQuickPrice(-10000) decrements 40,000 to 30,000 (Got: ${input.value})`
  );

  sandbox.stepQuickPrice(-50000);
  assert(
    parseFloat(input.value) === 0,
    `VND-CHIP-01c: stepQuickPrice clamps safely at >= 0 (Got: ${input.value})`
  );

  sandbox.currentCurrency = "USD";
  if (typeof sandbox.renderQuickPriceAdjustmentChips === "function") {
    sandbox.renderQuickPriceAdjustmentChips();
  }
  input.value = "3.50";
  sandbox.stepQuickPrice(0.5);
  assert(
    parseFloat(input.value) === 4.0,
    `VND-CHIP-02: USD mode stepQuickPrice(+0.50) increments 3.50 to 4.00 (Got: ${input.value})`
  );
}

// --- Section 4: Smart Quick-Entry Omnibox NLP Parser Engine ---
console.log("\n--- Section 4: Smart Quick-Entry Omnibox NLP Parser Engine ---");
{
  const { sandbox } = loadBuyListEngine();
  const parse = sandbox.parseSmartGroceryInput;

  assert(
    typeof parse === "function",
    "SMART-00: parseSmartGroceryInput is defined and exported globally"
  );

  if (typeof parse === "function") {
    const res1 = parse("Sữa tươi 35k/l");
    assert(
      res1.name === "Sữa tươi",
      `SMART-01a: Extracted item name 'Sữa tươi' (Got: '${res1.name}')`
    );
    assert(
      res1.price === 35000,
      `SMART-01b: Parsed '35k' as 35000 VND (Got: ${res1.price})`
    );
    assert(
      res1.quantity === 1 && (res1.unit === "L" || res1.unit === "l"),
      `SMART-01c: Parsed quantity 1 and unit 'L' (Got: ${res1.quantity} ${res1.unit})`
    );
    assert(
      res1.category === "dairy_eggs",
      `SMART-01d: Auto-categorized 'Sữa tươi' as dairy_eggs (Got: '${res1.category}')`
    );

    const res2 = parse("Thịt ba chỉ 120k 500g WinMart");
    assert(
      res2.name === "Thịt ba chỉ",
      `SMART-02a: Extracted item name 'Thịt ba chỉ' (Got: '${res2.name}')`
    );
    assert(
      res2.price === 120000,
      `SMART-02b: Parsed '120k' as 120000 VND (Got: ${res2.price})`
    );
    assert(
      res2.quantity === 500 && res2.unit === "g",
      `SMART-02c: Parsed quantity 500 and unit 'g' (Got: ${res2.quantity} ${res2.unit})`
    );
    assert(
      res2.store === "WinMart",
      `SMART-02d: Extracted store 'WinMart' (Got: '${res2.store}')`
    );
    assert(
      res2.category === "meat_seafood",
      `SMART-02e: Auto-categorized 'Thịt ba chỉ' as meat_seafood (Got: '${res2.category}')`
    );

    const res3 = parse("Trứng gà 30.000 10 quả");
    assert(
      res3.name === "Trứng gà",
      `SMART-03a: Extracted item name 'Trứng gà' (Got: '${res3.name}')`
    );
    assert(
      res3.price === 30000,
      `SMART-03b: Parsed '30.000' as 30000 VND (Got: ${res3.price})`
    );
    assert(
      res3.quantity === 10 && res3.unit === "ea",
      `SMART-03c: Parsed quantity 10 and unit 'ea' for '10 quả' (Got: ${res3.quantity} ${res3.unit})`
    );

    const res4 = parse("Rau muống 10k 1 bó @bachhoaxanh");
    assert(
      res4.name === "Rau muống",
      `SMART-04a: Extracted item name 'Rau muống' (Got: '${res4.name}')`
    );
    assert(
      res4.price === 10000,
      `SMART-04b: Parsed price 10000 VND (Got: ${res4.price})`
    );
    assert(
      res4.quantity === 1 && res4.unit === "bunch",
      `SMART-04c: Parsed '1 bó' as unit bunch (Got: ${res4.quantity} ${res4.unit})`
    );
    assert(
      res4.store === "Bách Hoá Xanh",
      `SMART-04d: Extracted store 'Bách Hoá Xanh' from '@bachhoaxanh' (Got: '${res4.store}')`
    );
    assert(
      res4.category === "produce",
      `SMART-04e: Auto-categorized 'Rau muống' as produce (Got: '${res4.category}')`
    );

    const res5 = parse("1 lốc sữa chua 28k");
    assert(
      res5.quantity === 1 && res5.unit === "loc",
      `SMART-05a: Parsed '1 lốc' as quantity 1 and unit 'loc' (Got: ${res5.quantity} ${res5.unit})`
    );
    assert(
      res5.price === 28000,
      `SMART-05b: Parsed price 28000 (Got: ${res5.price})`
    );

    const res6 = parse("2 chai dầu ăn 90k");
    assert(
      res6.quantity === 2 && res6.unit === "can",
      `SMART-06a: Parsed '2 chai' as quantity 2 and unit 'can' (Got: ${res6.quantity} ${res6.unit})`
    );
    assert(
      res6.price === 90000,
      `SMART-06b: Parsed price 90000 (Got: ${res6.price})`
    );
    assert(
      res6.category === "pantry",
      `SMART-06c: Auto-categorized 'Dầu ăn' as pantry (Got: '${res6.category}')`
    );

    const res7 = parse("1 thùng mì Hảo Hảo 115k");
    assert(
      res7.quantity === 1 && res7.unit === "thung",
      `SMART-07a: Parsed '1 thùng' as unit 'thung' (Got: ${res7.quantity} ${res7.unit})`
    );
    assert(
      res7.price === 115000,
      `SMART-07b: Parsed price 115000 (Got: ${res7.price})`
    );
  }
}

// --- Section 5: Smart Omnibox DOM Submission & Batch Paste ---
console.log("\n--- Section 5: Smart Omnibox DOM Submission & Batch Paste ---");
{
  const { sandbox, getMockEl } = loadBuyListEngine();
  const input = getMockEl("smartQuickInput");

  input.value = "Sữa tươi Vinamilk 35k/l";
  if (typeof sandbox.handleSmartQuickInputSubmit === "function") {
    sandbox.handleSmartQuickInputSubmit();
    assert(
      sandbox.memoryState.activeList.items.length === 1,
      `SMART-DOM-01: handleSmartQuickInputSubmit added 1 item (Got: ${sandbox.memoryState.activeList.items.length})`
    );
    assert(
      sandbox.memoryState.activeList.items[0].name === "Sữa tươi Vinamilk",
      `SMART-DOM-02: Added item name is 'Sữa tươi Vinamilk' (Got: '${sandbox.memoryState.activeList.items[0].name}')`
    );
    assert(
      sandbox.memoryState.activeList.items[0].price === 35000,
      `SMART-DOM-03: Added item price is 35000 (Got: ${sandbox.memoryState.activeList.items[0].price})`
    );
  }

  // Multi-line batch paste
  const multiLineList = `Thịt ba chỉ 120k 500g\nTrứng gà 30k 10 quả\nRau muống 10k 1 bó`;
  if (typeof sandbox.processBatchQuickInput === "function") {
    sandbox.processBatchQuickInput(multiLineList);
    assert(
      sandbox.memoryState.activeList.items.length === 4,
      `SMART-BATCH-01: Batch paste added 3 more items (Total: ${sandbox.memoryState.activeList.items.length})`
    );
  }
}

// --- Section 6: Expanded Vietnamese Packaging Units & Normalization ---
console.log(
  "\n--- Section 6: Expanded Vietnamese Packaging Units & Normalization ---"
);
{
  const { sandbox } = loadBuyListEngine();
  const norm = sandbox.normalizeQuantity;

  if (typeof norm === "function") {
    assert(
      (norm(1, "loc").baseUnit === "ea" ||
        norm(1, "loc").baseUnit === "unit") &&
        norm(1, "loc").baseQuantity === 1,
      "UNIT-VN-01: 'loc' normalizes to discrete unit"
    );
    assert(
      (norm(1, "thung").baseUnit === "ea" ||
        norm(1, "thung").baseUnit === "unit") &&
        norm(1, "thung").baseQuantity === 1,
      "UNIT-VN-02: 'thung' normalizes to discrete unit"
    );
    assert(
      (norm(1, "khay").baseUnit === "ea" ||
        norm(1, "khay").baseUnit === "unit") &&
        norm(1, "khay").baseQuantity === 1,
      "UNIT-VN-03: 'khay' normalizes to discrete unit"
    );
    assert(
      (norm(1, "tui").baseUnit === "ea" ||
        norm(1, "tui").baseUnit === "unit") &&
        norm(1, "tui").baseQuantity === 1,
      "UNIT-VN-04: 'tui' normalizes to discrete unit"
    );
    assert(
      (norm(1, "hu").baseUnit === "ea" || norm(1, "hu").baseUnit === "unit") &&
        norm(1, "hu").baseQuantity === 1,
      "UNIT-VN-05: 'hu' normalizes to discrete unit"
    );
  }
}

// --- Section 7: Icon Polish, PWA Version Bump & Bilingual Parity ---
console.log(
  "\n--- Section 7: Icon Polish, PWA Version Bump & Bilingual Parity ---"
);
{
  const { sandbox, htmlContent } = loadBuyListEngine();
  const swPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "sw.js"
  );
  const swContent = fs.readFileSync(swPath, "utf8");

  assert(
    swContent.includes("smart-buy-list-v3.4.0") ||
      swContent.includes("smart-buy-list-v3.5.0") ||
      swContent.includes("smart-buy-list-v3.6.0"),
    "PWA-01: sw.js CACHE_NAME is incremented to 'smart-buy-list-v3.4.0', 'smart-buy-list-v3.5.0' or 'smart-buy-list-v3.6.0'"
  );
  assert(
    htmlContent.includes("v3.4.0") ||
      htmlContent.includes("v3.5.0") ||
      htmlContent.includes("v3.6.0"),
    "PWA-02: index.html displays synchronized version badge 'v3.4.0', 'v3.5.0' or 'v3.6.0'"
  );

  const enKeys = Object.keys(sandbox.TRANSLATIONS.en);
  const viKeys = Object.keys(sandbox.TRANSLATIONS.vi);

  const missingInVi = enKeys.filter((k) => !viKeys.includes(k));
  const missingInEn = viKeys.filter((k) => !enKeys.includes(k));

  assert(
    missingInVi.length === 0,
    `I18N-PARITY-01: 100% English keys exist in Vietnamese (Missing: ${missingInVi.join(", ") || "None"})`
  );
  assert(
    missingInEn.length === 0,
    `I18N-PARITY-02: 100% Vietnamese keys exist in English (Missing: ${missingInEn.join(", ") || "None"})`
  );
}

console.log("\n==================================================");
console.log(
  `📊 Vietnamese-First & Smart Omnibox Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
}
