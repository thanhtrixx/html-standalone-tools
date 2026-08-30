const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListComparatorEngine() {
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
      getElementById: () => ({
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        textContent: "",
        innerHTML: "",
        style: {},
        appendChild: () => {},
      }),
      createElement: () => ({
        className: "",
        textContent: "",
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        remove: () => {},
      }),
      querySelector: () => null,
      querySelectorAll: () => [],
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
  return sandbox;
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

function assertClose(actual, expected, tolerance = 0.001, message) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(
      `  ✅ PASS: ${message} (Actual: ${actual.toFixed(4)}, Expected: ${expected.toFixed(4)})`
    );
    passed++;
  } else {
    console.error(
      `  ❌ FAIL: ${message} (Actual: ${actual.toFixed(4)}, Expected: ${expected.toFixed(4)}, Diff: ${diff.toFixed(4)})`
    );
    failed++;
  }
}

console.log(
  "\n🧪 Running Smart Buy-List Package Comparator & Sparklines Test Suite...\n"
);

try {
  const engine = loadBuyListComparatorEngine();

  // 1. COMPARATOR WITH DISCOUNTS & COUPONS
  console.log(
    "--- Section 1: In-Aisle Comparator with Custom Discounts/Coupons ---"
  );

  assert(
    typeof engine.comparePackages === "function",
    "comparePackages exists globally"
  );

  // Discount test: Package A ($5.00 with 20% discount = $4.00 for 500g -> $8.00/kg) vs Package B ($9.00 for 1kg -> $9.00/kg)
  const compDiscount = engine.comparePackages(
    {
      price: 5.0,
      quantity: 500,
      unit: "g",
      discountPercent: 20,
      name: "Brand A (20% off)",
    },
    { price: 9.0, quantity: 1, unit: "kg", name: "Brand B" }
  );

  assert(
    compDiscount.winner === "A",
    "COMP-DISC-01a: Package A with 20% coupon is correctly identified as cheaper"
  );
  assertClose(
    compDiscount.unitPriceA,
    8.0,
    0.01,
    "COMP-DISC-01b: Package A effective unit price is $8.00/kg"
  );
  assertClose(
    compDiscount.unitPriceB,
    9.0,
    0.01,
    "COMP-DISC-01c: Package B unit price is $9.00/kg"
  );
  assertClose(
    compDiscount.savingsPercent,
    11.111,
    0.05,
    "COMP-DISC-01d: Savings percentage is accurately calculated (~11.11%)"
  );

  // 2. SVG SPARKLINES GENERATION
  console.log("\n--- Section 2: SVG Price Trend Sparklines Engine ---");

  assert(
    typeof engine.renderSparklineSvg === "function",
    "renderSparklineSvg function is exported globally"
  );

  const testPrices = [2.1, 1.95, 1.8, 1.7];
  const sparklineSvg = engine.renderSparklineSvg(testPrices, 100, 30);

  assert(
    typeof sparklineSvg === "string" && sparklineSvg.includes("<svg"),
    "SPARK-01: renderSparklineSvg returns valid SVG markup string"
  );
  assert(
    sparklineSvg.includes("<polyline") || sparklineSvg.includes("<path"),
    "SPARK-02: SVG contains path/polyline coordinate rendering"
  );

  // Downward trend price drop should use green accent
  assert(
    sparklineSvg.includes("#10b981") || sparklineSvg.includes("emerald"),
    "SPARK-03: Downward price trend renders in emerald/green color"
  );

  // Single price point handles gracefully without division by zero
  const singlePointSvg = engine.renderSparklineSvg([2.5], 100, 30);
  assert(
    typeof singlePointSvg === "string" && !singlePointSvg.includes("NaN"),
    "SPARK-04: Single price point renders flat baseline without NaN coordinates"
  );

  // 3. ITEM HISTORICAL STORE PRICE CHIPS
  console.log(
    "\n--- Section 3: Item Store Comparison & Multi-Store Insights ---"
  );

  assert(
    typeof engine.getItemStoreComparison === "function",
    "getItemStoreComparison function is exported globally"
  );

  engine.loadSampleData();
  const milkStoreComparison = engine.getItemStoreComparison("Fresh Whole Milk");

  assert(
    Array.isArray(milkStoreComparison) && milkStoreComparison.length >= 2,
    "STORE-COMP-01: Returns store comparison array for Fresh Whole Milk"
  );
  const costcoEntry = milkStoreComparison.find((s) => s.store === "Costco");
  const tjEntry = milkStoreComparison.find((s) => s.store === "Trader Joe's");

  assert(
    costcoEntry && costcoEntry.lowestUnitPrice === 1.7,
    "STORE-COMP-02: Accurately identifies Costco lowest unit price as $1.70/L"
  );
  assert(
    tjEntry && tjEntry.lowestUnitPrice === 1.95,
    "STORE-COMP-03: Accurately identifies Trader Joe's lowest unit price as $1.95/L"
  );
} catch (err) {
  console.error("❌ Test Execution Error:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Comparator & Sparklines Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
