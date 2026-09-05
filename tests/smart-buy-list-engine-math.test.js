#!/usr/bin/env node

/**
 * Smart Buy-List Engine Math, Comparator, Parser & Deal Scoring Test Suite
 *
 * Domain: Core Math & Deal Intelligence
 * Covers:
 * - Measurement Unit Normalization (Weight, Volume, Count) & Dimension Safety
 * - Deal Scoring Intelligence & Chronological lastPrice Invariants
 * - In-Aisle Package Comparator, Custom Discounts & Sparklines
 * - Smart Omnibox NLP Parser Hardening, Multipliers & Store Aliases
 */

const {
  createTrackerSandbox,
  createAssertions,
} = require("./helpers/smart-buy-list-harness");

const { assert, assertEqual, printSummary } = createAssertions(
  "Smart Buy-List Engine Math Test Suite"
);

function assertClose(actual, expected, tolerance = 0.001, message) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    assert(
      true,
      `${message} (Actual: ${actual.toFixed(4)}, Expected: ${expected.toFixed(4)})`
    );
  } else {
    assert(
      false,
      `${message} (Actual: ${actual.toFixed(4)}, Expected: ${expected.toFixed(4)}, Diff: ${diff.toFixed(4)})`
    );
  }
}

console.log("\n🧪 Running Smart Buy-List Engine Math Test Suite...\n");

try {
  const { sandbox: engine } = createTrackerSandbox();

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
    { unitPrice: 1.9, date: "2026-03-20", store: "Store A" },
  ];

  const dealATL = engine.evaluateDealScore(1.85, sampleLedger);
  assert(
    dealATL.score === "GREAT_DEAL",
    "DEAL-01a: Price <= All-Time Low is evaluated as GREAT_DEAL"
  );
  assert(
    dealATL.isAllTimeLow === true,
    "DEAL-01b: isAllTimeLow flag is true when price is below previous minimum"
  );

  const dealGood = engine.evaluateDealScore(1.7, sampleLedger);
  assert(
    dealGood.score === "GREAT_DEAL",
    "DEAL-02: Price >10% below average is evaluated as GREAT_DEAL"
  );

  const dealFair = engine.evaluateDealScore(2.0, sampleLedger);
  assert(
    dealFair.score === "FAIR_PRICE",
    "DEAL-03: Price near historical average is evaluated as FAIR_PRICE"
  );

  const dealHigh = engine.evaluateDealScore(2.4, sampleLedger);
  assert(
    dealHigh.score === "PRICE_SPIKE",
    "DEAL-04: Price >10% above average is evaluated as PRICE_SPIKE"
  );

  const dealNew = engine.evaluateDealScore(5.0, []);
  assert(
    dealNew.score === "NEW_ITEM",
    "DEAL-05: Empty historical ledger evaluates as NEW_ITEM"
  );

  // 3. IN-AISLE PACKAGE COMPARATOR TESTS
  console.log("\n--- Section 3: In-Aisle Package Comparator ---");

  // COMP-01: Weight comparison (Brand A: 450g @ $3.20 vs Brand B: 1.2kg @ $7.80)
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

  // 4. COMPARATOR WITH DISCOUNTS & SVG SPARKLINES
  console.log(
    "\n--- Section 4: Comparator Discounts, Sparklines & Store Insights ---"
  );

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
  assert(
    sparklineSvg.includes("#10b981") || sparklineSvg.includes("emerald"),
    "SPARK-03: Downward price trend renders in emerald/green color"
  );
  const singlePointSvg = engine.renderSparklineSvg([2.5], 100, 30);
  assert(
    typeof singlePointSvg === "string" && !singlePointSvg.includes("NaN"),
    "SPARK-04: Single price point renders flat baseline without NaN coordinates"
  );

  assert(
    typeof engine.getItemStoreComparison === "function",
    "getItemStoreComparison function is exported globally"
  );

  engine.memoryState.purchaseLedger = [
    {
      id: "comp-1",
      itemName: "Fresh Whole Milk",
      store: "Costco",
      unitPrice: 1.7,
      unit: "L",
      date: "2026-08-01",
    },
    {
      id: "comp-2",
      itemName: "Fresh Whole Milk",
      store: "Trader Joe's",
      unitPrice: 1.95,
      unit: "L",
      date: "2026-08-05",
    },
  ];
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

  // 5. OMNIBOX NLP PARSER HARDENING & STORE ALIASES
  console.log(
    "\n--- Section 5: Smart Omnibox NLP Parser Hardening & Aliases ---"
  );

  assert(
    typeof engine.parseSmartGroceryInput === "function",
    "PARSE-01: parseSmartGroceryInput is exported globally"
  );

  const leadingStore = engine.parseSmartGroceryInput("@winmart Sữa 35k/l");
  assert(
    leadingStore.store === "WinMart",
    `PARSE-STORE-01: Leading @winmart resolves store="WinMart" (Got: ${leadingStore.store})`
  );
  assert(
    leadingStore.name === "Sữa",
    `PARSE-STORE-02: Leading @winmart leaves clean name="Sữa" (Got: ${leadingStore.name})`
  );
  assert(
    leadingStore.price === 35000,
    `PARSE-STORE-03: Leading @winmart parses price=35000 (Got: ${leadingStore.price})`
  );
  assert(
    leadingStore.unit === "L",
    `PARSE-STORE-04: Leading @winmart parses unit="L" (Got: ${leadingStore.unit})`
  );

  const inlineStore = engine.parseSmartGroceryInput("Sữa @bhx 35k/l");
  assert(
    inlineStore.store === "Bách Hoá Xanh",
    `PARSE-STORE-05: Inline @bhx alias resolves store="Bách Hoá Xanh" (Got: ${inlineStore.store})`
  );
  assert(
    inlineStore.name === "Sữa",
    `PARSE-STORE-06: Inline @bhx leaves clean name="Sữa" (Got: ${inlineStore.name})`
  );
  assert(
    inlineStore.price === 35000,
    `PARSE-STORE-07: Inline @bhx parses price=35000 (Got: ${inlineStore.price})`
  );

  const trailingStore = engine.parseSmartGroceryInput("Sữa 35k/l @winmart");
  assert(
    trailingStore.store === "WinMart",
    `PARSE-STORE-08: Trailing @winmart resolves store="WinMart" (Got: ${trailingStore.store})`
  );
  assert(
    trailingStore.name === "Sữa",
    `PARSE-STORE-09: Trailing @winmart leaves clean name="Sữa" (Got: ${trailingStore.name})`
  );

  assert(
    typeof engine.getStoreAliases === "function",
    "ALIAS-01: getStoreAliases is exported"
  );
  assert(
    typeof engine.setStoreAliases === "function",
    "ALIAS-02: setStoreAliases is exported"
  );

  const defaultWmAliases = engine.getStoreAliases("WinMart");
  assert(
    Array.isArray(defaultWmAliases) && defaultWmAliases.includes("wm"),
    "ALIAS-03: Default aliases for WinMart include 'wm'"
  );

  engine.setStoreAliases("WinMart", "wm, vinmart, sieuthiwm, mywin");
  const updatedWmAliases = engine.getStoreAliases("WinMart");
  assert(
    updatedWmAliases.includes("mywin") &&
      updatedWmAliases.includes("sieuthiwm"),
    "ALIAS-04: Custom alias setStoreAliases updates alias array"
  );

  const customAliasParse = engine.parseSmartGroceryInput("Bánh mì 15k @mywin");
  assert(
    customAliasParse.store === "WinMart",
    `ALIAS-05: Custom alias @mywin resolves to WinMart (Got: ${customAliasParse.store})`
  );

  engine.renameStore("WinMart", "WinMart Mega");
  const migratedAliases = engine.getStoreAliases("WinMart Mega");
  assert(
    migratedAliases.includes("mywin"),
    "ALIAS-06: Renaming store migrates alias dictionary to new store name"
  );
  assert(
    engine.getStoreAliases("WinMart").length === 0,
    "ALIAS-07: Old store name aliases are cleaned up after rename"
  );

  const thousandK1 = engine.parseSmartGroceryInput("Bò Wagyu 1,234k/kg");
  assert(
    thousandK1.price === 1234000,
    `PARSE-THOUSAND-01: '1,234k/kg' parses to price=1234000 (Got: ${thousandK1.price})`
  );
  const thousandK2 = engine.parseSmartGroceryInput("Laptop 15.500k");
  assert(
    thousandK2.price === 15500000,
    `PARSE-THOUSAND-02: '15.500k' parses to price=15500000 (Got: ${thousandK2.price})`
  );
  const decimalMultiplier = engine.parseSmartGroceryInput("Sữa chua 1.5k");
  assert(
    decimalMultiplier.price === 1500,
    `PARSE-DECIMAL-01: '1.5k' parses decimal fraction to price=1500 (Got: ${decimalMultiplier.price})`
  );
  const millionParse = engine.parseSmartGroceryInput("Tivi 2.5tr");
  assert(
    millionParse.price === 2500000,
    `PARSE-MILLION-01: '2.5tr' parses to price=2500000 (Got: ${millionParse.price})`
  );

  const negPrice = engine.parseSmartGroceryInput("Sữa tươi -35k");
  assert(
    negPrice.price === 35000,
    `PARSE-NEG-01: '-35k' negative price stripped to positive 35000 (Got: ${negPrice.price})`
  );
  assert(
    negPrice.name === "Sữa tươi",
    `PARSE-NEG-02: Negative sign does not corrupt item name (Got: ${negPrice.name})`
  );

  const trailingNum = engine.parseSmartGroceryInput("Thức ăn 100k 10 cái 5");
  assert(
    trailingNum.name === "Thức ăn",
    `PARSE-TRAIL-01: Unmatched trailing number '5' is dropped from name (Got: ${trailingNum.name})`
  );
  assert(
    trailingNum.quantity === 10,
    `PARSE-TRAIL-02: Quantity correctly parsed as 10 (Got: ${trailingNum.quantity})`
  );
  assert(
    trailingNum.price === 100000,
    `PARSE-TRAIL-03: Price correctly parsed as 100000 (Got: ${trailingNum.price})`
  );

  const emojiItem = engine.parseSmartGroceryInput("Milk 🥛 35k/l");
  assert(
    emojiItem.name === "Milk",
    `PARSE-EMOJI-01: Emoji 🥛 is stripped from item name (Got: ${emojiItem.name})`
  );
  assert(
    emojiItem.price === 35000,
    `PARSE-EMOJI-02: Price parsed after emoji (Got: ${emojiItem.price})`
  );

  const waterItem = engine.parseSmartGroceryInput("Nước 20k/l");
  assert(
    waterItem.category === "beverages",
    `PARSE-CAT-01: 'Nước 20k/l' classified into category='beverages' (Got: ${waterItem.category})`
  );
  assert(
    waterItem.name === "Nước",
    `PARSE-CAT-02: Name is 'Nước' (Got: ${waterItem.name})`
  );

  const fishSauce = engine.parseSmartGroceryInput("Nước mắm Nam Ngư 35k");
  assert(
    fishSauce.category === "pantry",
    `PARSE-CAT-03: 'Nước mắm Nam Ngư' classified into category='pantry' (Got: ${fishSauce.category})`
  );

  const dishSoap = engine.parseSmartGroceryInput("Nước rửa chén Sunlight 25k");
  assert(
    dishSoap.category === "household",
    `PARSE-CAT-04: 'Nước rửa chén Sunlight' classified into category='household' (Got: ${dishSoap.category})`
  );

  const plainItem = engine.parseSmartGroceryInput("abc");
  assert(
    plainItem.name === "Abc",
    `PARSE-PLAIN-01: Plain text 'abc' capitalized to 'Abc' (Got: ${plainItem.name})`
  );
  assert(
    plainItem.price === 0,
    `PARSE-PLAIN-02: Plain text 'abc' sets price=0 (Got: ${plainItem.price})`
  );

  // 6. DEAL-SCORING MATH & CHRONOLOGICAL LASTPRICE
  console.log("\n--- Section 6: Math Reduction & Chronological lastPrice ---");

  const nonChronologicalLedger = [
    { date: "2026-08-20", itemName: "Milk", unitPrice: 30000 },
    { date: "2026-08-30", itemName: "Milk", unitPrice: 38000 },
    { date: "2026-08-10", itemName: "Milk", unitPrice: 28000 },
    { date: "2026-08-25", itemName: "Milk", unitPrice: NaN },
  ];

  const scoreResult = engine.evaluateDealScore(35000, nonChronologicalLedger);
  assert(
    scoreResult.lastPrice === 38000,
    `MATH-01: evaluateDealScore correctly derives lastPrice from the chronologically newest valid entry (Expected 38000, got: ${scoreResult.lastPrice})`
  );

  const avg = 100000;
  const last = 100000;
  const standardLedger = [
    { date: "2026-08-01", unitPrice: avg },
    { date: "2026-08-15", unitPrice: last },
  ];

  const dealGreat = engine.evaluateDealScore(90000, standardLedger);
  assert(
    dealGreat.score === "GREAT_DEAL",
    `MATH-02: Price at 0.90 * avg qualifies as GREAT_DEAL (Got: ${dealGreat.score})`
  );

  const dealFair2 = engine.evaluateDealScore(105000, standardLedger);
  assert(
    dealFair2.score === "FAIR_PRICE",
    `MATH-03: Price within [-10%, +10%] avg qualifies as FAIR_PRICE (Got: ${dealFair2.score})`
  );

  const dealSpike = engine.evaluateDealScore(120000, standardLedger);
  assert(
    dealSpike.score === "PRICE_SPIKE",
    `MATH-04: Price > 1.10 * avg qualifies as PRICE_SPIKE (Got: ${dealSpike.score})`
  );

  const dealSpikeRecent = engine.evaluateDealScore(108000, [
    { date: "2026-08-01", unitPrice: 120000 },
    { date: "2026-08-15", unitPrice: 90000 },
  ]);
  assert(
    dealSpikeRecent.score === "PRICE_SPIKE",
    `MATH-05: Price > 1.15 * lastPrice triggers PRICE_SPIKE even if near average (Got: ${dealSpikeRecent.score})`
  );

  const dealNewItem = engine.evaluateDealScore(50000, []);
  assert(
    dealNewItem.score === "NEW_ITEM",
    `MATH-06: Empty ledger returns NEW_ITEM (Got: ${dealNewItem.score})`
  );
} catch (err) {
  console.error("❌ Exception during engine math test execution:", err);
  process.exit(1);
}

printSummary();
