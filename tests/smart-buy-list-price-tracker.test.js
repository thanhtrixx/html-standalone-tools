const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListEngine() {
  const htmlPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Target file not found: ${htmlPath}`);
  }
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

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
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: { writeText: () => Promise.resolve() },
      share: undefined,
    },
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      documentElement: {
        classList: { contains: () => false, add: () => {}, remove: () => {} },
      },
      body: { style: {} },
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
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

function assertClose(actual, expected, tolerance = 0.0001, message) {
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

console.log("\n🧪 Running Smart Buy-List & Unit Price Tracker Test Suite...\n");

try {
  const engine = loadBuyListEngine();

  // 1. DIMENSIONS & UNIT CONVERSION TESTS
  console.log("--- Section 1: Measurement Unit Normalization Engine ---");

  assert(
    typeof engine.normalizeUnitPrice === "function",
    "normalizeUnitPrice function is exported globally"
  );
  assert(
    typeof engine.normalizeQuantity === "function",
    "normalizeQuantity function is exported globally"
  );
  assert(
    typeof engine.comparePackages === "function",
    "comparePackages function is exported globally"
  );
  assert(
    typeof engine.evaluateDealScore === "function",
    "evaluateDealScore function is exported globally"
  );

  // UNIT-01: Mass - Grams to Kilograms (450g @ $3.20 -> $7.1111/kg)
  const normGrams = engine.normalizeQuantity(450, "g");
  assertClose(
    normGrams.baseQuantity,
    0.45,
    0.0001,
    "UNIT-01a: 450g converts to 0.45 kg"
  );
  assert(
    normGrams.baseUnit === "kg",
    "UNIT-01b: Mass dimension base unit is 'kg'"
  );
  const unitPriceGrams = engine.normalizeUnitPrice(3.2, 450, "g");
  assertClose(
    unitPriceGrams,
    7.1111,
    0.001,
    "UNIT-01c: 450g @ $3.20 normalizes to $7.1111/kg"
  );

  // UNIT-02: Mass - Pounds to Kilograms (2 lb @ $8.99 -> $9.9098/kg)
  const normLb = engine.normalizeQuantity(2, "lb");
  assertClose(
    normLb.baseQuantity,
    0.907184,
    0.0001,
    "UNIT-02a: 2 lb converts to 0.9072 kg"
  );
  const unitPriceLb = engine.normalizeUnitPrice(8.99, 2, "lb");
  assertClose(
    unitPriceLb,
    9.9098,
    0.001,
    "UNIT-02b: 2 lb @ $8.99 normalizes to $9.9098/kg"
  );

  // UNIT-03: Volume - Millilitres to Litres (750 ml @ $4.50 -> $6.00/L)
  const normMl = engine.normalizeQuantity(750, "ml");
  assertClose(
    normMl.baseQuantity,
    0.75,
    0.0001,
    "UNIT-03a: 750ml converts to 0.75 L"
  );
  assert(
    normMl.baseUnit === "l",
    "UNIT-03b: Volume dimension base unit is 'l'"
  );
  const unitPriceMl = engine.normalizeUnitPrice(4.5, 750, "ml");
  assertClose(
    unitPriceMl,
    6.0,
    0.001,
    "UNIT-03c: 750ml @ $4.50 normalizes to $6.00/L"
  );

  // UNIT-04: Volume - Gallons to Litres (1 gal @ $5.29 -> $1.3975/L)
  const normGal = engine.normalizeQuantity(1, "gal");
  assertClose(
    normGal.baseQuantity,
    3.78541,
    0.0001,
    "UNIT-04a: 1 gal converts to 3.7854 L"
  );
  const unitPriceGal = engine.normalizeUnitPrice(5.29, 1, "gal");
  assertClose(
    unitPriceGal,
    1.3975,
    0.001,
    "UNIT-04b: 1 gal @ $5.29 normalizes to $1.3975/L"
  );

  // UNIT-05: Count - Multi-pack / Cans (24 cans @ $12.00 -> $0.50/ea)
  const normCount = engine.normalizeQuantity(24, "can");
  assertClose(
    normCount.baseQuantity,
    24,
    0.0001,
    "UNIT-05a: 24 cans converts to 24 ea"
  );
  assert(
    normCount.baseUnit === "ea",
    "UNIT-05b: Count dimension base unit is 'ea'"
  );
  const unitPriceCount = engine.normalizeUnitPrice(12.0, 24, "can");
  assertClose(
    unitPriceCount,
    0.5,
    0.0001,
    "UNIT-05c: 24 cans @ $12.00 normalizes to $0.50/ea"
  );

  // UNIT-06: Extreme & Negative Number Guards
  assert(
    engine.normalizeUnitPrice(0, 0, "g") === 0,
    "UNIT-06a: Zero price and zero quantity returns 0 safely"
  );
  assert(
    engine.normalizeUnitPrice(10, 0, "kg") === 0,
    "UNIT-06b: Zero quantity with positive price returns 0 without Infinity"
  );
  assert(
    engine.normalizeUnitPrice(-5, 10, "kg") === 0,
    "UNIT-06c: Negative price returns 0 safely"
  );
  assert(
    engine.normalizeUnitPrice(10, -5, "kg") === 0,
    "UNIT-06d: Negative quantity returns 0 safely"
  );

  // UNIT-07: Unknown Unit Fallback
  const normCustom = engine.normalizeQuantity(2, "custom_box");
  assert(
    normCustom.dimension === "COUNT" && normCustom.baseUnit === "ea",
    "UNIT-07: Unknown unit defaults to COUNT dimension (ea)"
  );

  // 2. DEAL SCORING & PRICE INDICATOR ENGINE TESTS
  console.log("\n--- Section 2: Deal Scoring & Historical Evaluation ---");

  const sampleLedger = [
    { unitPrice: 2.0, date: "2026-01-10", store: "Store A" },
    { unitPrice: 2.1, date: "2026-02-15", store: "Store B" },
    { unitPrice: 1.9, date: "2026-03-20", store: "Store A" }, // ATL = 1.90, Avg = 2.00, Last = 1.90
  ];

  // DEAL-01: All-Time Low Match
  const dealATL = engine.evaluateDealScore(1.85, sampleLedger);
  assert(
    dealATL.score === "GREAT_DEAL",
    "DEAL-01a: Price <= All-Time Low is evaluated as GREAT_DEAL"
  );
  assert(
    dealATL.isAllTimeLow === true,
    "DEAL-01b: isAllTimeLow flag is true when price is below previous minimum"
  );

  // DEAL-02: Substantial Discount (>10% below average)
  const dealDiscount = engine.evaluateDealScore(1.75, sampleLedger);
  assert(
    dealDiscount.score === "GREAT_DEAL",
    "DEAL-02: Price >10% below average is evaluated as GREAT_DEAL"
  );

  // DEAL-03: Fair Market Price
  const dealFair = engine.evaluateDealScore(2.02, sampleLedger);
  assert(
    dealFair.score === "FAIR_PRICE",
    "DEAL-03: Price near historical average is evaluated as FAIR_PRICE"
  );

  // DEAL-04: Price Spike
  const dealSpike = engine.evaluateDealScore(2.4, sampleLedger);
  assert(
    dealSpike.score === "PRICE_SPIKE",
    "DEAL-04: Price >10% above average is evaluated as PRICE_SPIKE"
  );

  // DEAL-05: Empty Ledger (First Purchase)
  const dealNew = engine.evaluateDealScore(3.5, []);
  assert(
    dealNew.score === "NEW_ITEM",
    "DEAL-05: Empty historical ledger evaluates as NEW_ITEM"
  );

  // 3. IN-AISLE PACKAGE COMPARATOR TESTS
  console.log("\n--- Section 3: In-Aisle Package Comparator ---");

  // COMP-01: Weight comparison (Brand A: 450g @ $3.20 vs Brand B: 1.2kg @ $7.80)
  // A = $7.1111/kg, B = $6.5000/kg -> B wins, savings = (7.1111 - 6.5000)/7.1111 = 8.594%
  const compWeight = engine.comparePackages(
    { name: "Brand A", price: 3.2, quantity: 450, unit: "g" },
    { name: "Brand B", price: 7.8, quantity: 1.2, unit: "kg" }
  );
  assert(
    compWeight.winner === "B",
    "COMP-01a: Brand B is correctly identified as the cheaper package"
  );
  assertClose(
    compWeight.savingsPercent,
    8.594,
    0.05,
    "COMP-01b: Savings percentage is accurately computed (~8.59%)"
  );
  assertClose(
    compWeight.savingsPerUnit,
    0.6111,
    0.01,
    "COMP-01c: Unit price savings per kg is accurately computed ($0.61/kg)"
  );

  // COMP-02: Volume comparison (1L @ $2.50 vs 2L @ $4.80)
  const compVolume = engine.comparePackages(
    { name: "1L Bottle", price: 2.5, quantity: 1, unit: "l" },
    { name: "2L Jug", price: 4.8, quantity: 2, unit: "l" }
  );
  assert(
    compVolume.winner === "B",
    "COMP-02a: 2L Jug is correctly identified as cheaper"
  );
  assertClose(
    compVolume.savingsPercent,
    4.0,
    0.01,
    "COMP-02b: Savings is exactly 4.0%"
  );

  // COMP-03: Tie scenario
  const compTie = engine.comparePackages(
    { name: "Small", price: 2.5, quantity: 500, unit: "g" },
    { name: "Large", price: 5.0, quantity: 1000, unit: "g" }
  );
  assert(
    compTie.winner === "TIE",
    "COMP-03: Equal unit prices result in TIE evaluation"
  );

  // COMP-04: Cross-dimension mismatch guard
  const compMismatch = engine.comparePackages(
    { name: "Solid", price: 2.0, quantity: 500, unit: "g" },
    { name: "Liquid", price: 2.0, quantity: 500, unit: "ml" }
  );
  assert(
    compMismatch.error === "DIMENSION_MISMATCH",
    "COMP-04: Cross-dimension comparison returns DIMENSION_MISMATCH error safely"
  );
} catch (err) {
  console.error("❌ Test Execution Error:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Buy-List Engine Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
