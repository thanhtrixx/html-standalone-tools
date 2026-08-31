const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadParserEngine() {
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
  const docElementClasses = new Set(["dark"]);

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
    RegExp,
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    encodeURIComponent,
    decodeURIComponent,
    escape,
    unescape,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: { writeText: () => Promise.resolve() },
      share: () => Promise.resolve(),
    },
    document: {
      getElementById: (id) => ({
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
      }),
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
      addEventListener: () => {},
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
  return { sandbox, htmlContent };
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
  "\n🧪 Running Smart Buy-List Parser Hardening & Store Aliases Test Suite...\n"
);

try {
  const { sandbox } = loadParserEngine();

  // SECTION 1: @store Tag Extraction Across Positions
  console.log("--- Section 1: @store Tag Position-Agnostic Extraction ---");

  const leadingStore = sandbox.parseSmartGroceryInput("@winmart Sữa 35k/l");
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

  const inlineStore = sandbox.parseSmartGroceryInput("Sữa @bhx 35k/l");
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

  const trailingStore = sandbox.parseSmartGroceryInput("Sữa 35k/l @winmart");
  assert(
    trailingStore.store === "WinMart",
    `PARSE-STORE-08: Trailing @winmart resolves store="WinMart" (Got: ${trailingStore.store})`
  );
  assert(
    trailingStore.name === "Sữa",
    `PARSE-STORE-09: Trailing @winmart leaves clean name="Sữa" (Got: ${trailingStore.name})`
  );

  // SECTION 2: User-Defined Store Aliases & Store Manager CRUD
  console.log("\n--- Section 2: Store Aliases & Store Manager CRUD ---");

  assert(
    typeof sandbox.getStoreAliases === "function",
    "ALIAS-01: getStoreAliases is exported"
  );
  assert(
    typeof sandbox.setStoreAliases === "function",
    "ALIAS-02: setStoreAliases is exported"
  );

  const defaultWmAliases = sandbox.getStoreAliases("WinMart");
  assert(
    Array.isArray(defaultWmAliases) && defaultWmAliases.includes("wm"),
    "ALIAS-03: Default aliases for WinMart include 'wm'"
  );

  sandbox.setStoreAliases("WinMart", "wm, vinmart, sieuthiwm, mywin");
  const updatedWmAliases = sandbox.getStoreAliases("WinMart");
  assert(
    updatedWmAliases.includes("mywin") &&
      updatedWmAliases.includes("sieuthiwm"),
    "ALIAS-04: Custom alias setStoreAliases updates alias array"
  );

  const customAliasParse = sandbox.parseSmartGroceryInput("Bánh mì 15k @mywin");
  assert(
    customAliasParse.store === "WinMart",
    `ALIAS-05: Custom alias @mywin resolves to WinMart (Got: ${customAliasParse.store})`
  );

  // Rename store migrates aliases
  sandbox.renameStore("WinMart", "WinMart Mega");
  const migratedAliases = sandbox.getStoreAliases("WinMart Mega");
  assert(
    migratedAliases.includes("mywin"),
    "ALIAS-06: Renaming store migrates alias dictionary to new store name"
  );
  assert(
    sandbox.getStoreAliases("WinMart").length === 0,
    "ALIAS-07: Old store name aliases are cleaned up after rename"
  );

  // SECTION 3: Thousands Separator in Multiplier Paths
  console.log("\n--- Section 3: Thousands Grouping in Multiplier Paths ---");

  const thousandK1 = sandbox.parseSmartGroceryInput("Bò Wagyu 1,234k/kg");
  assert(
    thousandK1.price === 1234000,
    `PARSE-THOUSAND-01: '1,234k/kg' parses to price=1234000 (Got: ${thousandK1.price})`
  );

  const thousandK2 = sandbox.parseSmartGroceryInput("Laptop 15.500k");
  assert(
    thousandK2.price === 15500000,
    `PARSE-THOUSAND-02: '15.500k' parses to price=15500000 (Got: ${thousandK2.price})`
  );

  const decimalMultiplier = sandbox.parseSmartGroceryInput("Sữa chua 1.5k");
  assert(
    decimalMultiplier.price === 1500,
    `PARSE-DECIMAL-01: '1.5k' parses decimal fraction to price=1500 (Got: ${decimalMultiplier.price})`
  );

  const millionParse = sandbox.parseSmartGroceryInput("Tivi 2.5tr");
  assert(
    millionParse.price === 2500000,
    `PARSE-MILLION-01: '2.5tr' parses to price=2500000 (Got: ${millionParse.price})`
  );

  // SECTION 4: Negative Price & Trailing Number Guards
  console.log("\n--- Section 4: Negative Price & Trailing Number Guards ---");

  const negPrice = sandbox.parseSmartGroceryInput("Sữa tươi -35k");
  assert(
    negPrice.price === 35000,
    `PARSE-NEG-01: '-35k' negative price stripped to positive 35000 (Got: ${negPrice.price})`
  );
  assert(
    negPrice.name === "Sữa tươi",
    `PARSE-NEG-02: Negative sign does not corrupt item name (Got: ${negPrice.name})`
  );

  const trailingNum = sandbox.parseSmartGroceryInput("Thức ăn 100k 10 cái 5");
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

  // SECTION 5: Emoji Stripping & Category Classification
  console.log("\n--- Section 5: Emoji Stripping & Category Classification ---");

  const emojiItem = sandbox.parseSmartGroceryInput("Milk 🥛 35k/l");
  assert(
    emojiItem.name === "Milk",
    `PARSE-EMOJI-01: Emoji 🥛 is stripped from item name (Got: ${emojiItem.name})`
  );
  assert(
    emojiItem.price === 35000,
    `PARSE-EMOJI-02: Price parsed after emoji (Got: ${emojiItem.price})`
  );

  const waterItem = sandbox.parseSmartGroceryInput("Nước 20k/l");
  assert(
    waterItem.category === "beverages",
    `PARSE-CAT-01: 'Nước 20k/l' classified into category='beverages' (Got: ${waterItem.category})`
  );
  assert(
    waterItem.name === "Nước",
    `PARSE-CAT-02: Name is 'Nước' (Got: ${waterItem.name})`
  );

  const fishSauce = sandbox.parseSmartGroceryInput("Nước mắm Nam Ngư 35k");
  assert(
    fishSauce.category === "pantry",
    `PARSE-CAT-03: 'Nước mắm Nam Ngư' classified into category='pantry' (Got: ${fishSauce.category})`
  );

  const dishSoap = sandbox.parseSmartGroceryInput("Nước rửa chén Sunlight 25k");
  assert(
    dishSoap.category === "household",
    `PARSE-CAT-04: 'Nước rửa chén Sunlight' classified into category='household' (Got: ${dishSoap.category})`
  );

  const plainItem = sandbox.parseSmartGroceryInput("abc");
  assert(
    plainItem.name === "Abc",
    `PARSE-PLAIN-01: Plain text 'abc' capitalized to 'Abc' (Got: ${plainItem.name})`
  );
  assert(
    plainItem.price === 0,
    `PARSE-PLAIN-02: Plain text 'abc' sets price=0 (Got: ${plainItem.price})`
  );
} catch (err) {
  console.error("❌ Test Execution Error:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Parser Hardening Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
