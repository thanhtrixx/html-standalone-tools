const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyVsRentApp() {
  const htmlPath = path.join(
    __dirname,
    "..",
    "buy-vs-rent-home-comparison",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

  const domElements = {};
  function makeElementStub(id = "") {
    return {
      id,
      value: "",
      innerText: "",
      innerHTML: "",
      className: "",
      style: {},
      children: [],
      classList: {
        classes: new Set(),
        add(c) {
          this.classes.add(c);
        },
        remove(c) {
          this.classes.delete(c);
        },
        toggle(c) {
          if (this.classes.has(c)) this.classes.delete(c);
          else this.classes.add(c);
        },
        contains(c) {
          return this.classes.has(c);
        },
      },
      appendChild(child) {
        this.children.push(child);
      },
      removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) this.children.splice(idx, 1);
      },
      getAttribute: () => null,
      setAttribute: () => {},
      addEventListener: () => {},
    };
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
    tailwind: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    document: {
      activeElement: null,
      documentElement: makeElementStub("html"),
      getElementById: (id) => {
        if (!domElements[id]) domElements[id] = makeElementStub(id);
        return domElements[id];
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: (tag) => makeElementStub(tag),
      addEventListener: () => {},
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
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

console.log("\n🌐 Running Buy vs. Rent UI & i18n Verification Tests...\n");

try {
  const app = loadBuyVsRentApp();

  // Test 1: Translation dictionaries exist
  assert(
    app.TRANSLATIONS && typeof app.TRANSLATIONS === "object",
    "TRANSLATIONS object is exported"
  );
  assert(
    app.TRANSLATIONS.vi && typeof app.TRANSLATIONS.vi === "object",
    "Vietnamese dictionary (vi) exists"
  );
  assert(
    app.TRANSLATIONS.en && typeof app.TRANSLATIONS.en === "object",
    "English dictionary (en) exists"
  );

  // Test 2: Complete 1-to-1 Translation Key Parity
  const viKeys = Object.keys(app.TRANSLATIONS.vi).sort();
  const enKeys = Object.keys(app.TRANSLATIONS.en).sort();

  assert(
    viKeys.length > 0,
    `Vietnamese dictionary contains ${viKeys.length} translation keys`
  );
  assert(
    enKeys.length > 0,
    `English dictionary contains ${enKeys.length} translation keys`
  );

  const missingInEn = viKeys.filter((k) => !enKeys.includes(k));
  const missingInVi = enKeys.filter((k) => !viKeys.includes(k));

  assert(
    missingInEn.length === 0,
    `All Vietnamese keys exist in English (Missing in EN: ${missingInEn.join(", ") || "None"})`
  );
  assert(
    missingInVi.length === 0,
    `All English keys exist in Vietnamese (Missing in VI: ${missingInVi.join(", ") || "None"})`
  );

  // Test 3: Currency & Number Masking
  assert(
    typeof app.formatCurrency === "function",
    "formatCurrency helper is defined"
  );
  assert(
    typeof app.formatNumberMask === "function",
    "formatNumberMask helper is defined"
  );
  assert(
    typeof app.parseMaskedNumber === "function",
    "parseMaskedNumber helper is defined"
  );

  const maskedStr = app.formatNumberMask(3500000000);
  assert(
    maskedStr.includes("3.500.000.000") || maskedStr.includes("3,500,000,000"),
    `Number mask formats with thousand separators: "${maskedStr}"`
  );

  const parsedNum = app.parseMaskedNumber("3.500.000.000");
  assert(
    parsedNum === 3500000000,
    `parseMaskedNumber accurately parses "3.500.000.000" to 3500000000`
  );

  // Test 4: Vietnamese Verbal Amount Helpers
  assert(
    typeof app.getSpelledOutAmount === "function",
    "getSpelledOutAmount helper is defined"
  );

  const spelled35B = app.getSpelledOutAmount(3500000000, "vi");
  assert(
    spelled35B.includes("3.5 Tỷ VND"),
    `3,500,000,000 spelled out in VI is "3.5 Tỷ VND": "${spelled35B}"`
  );

  const spelled14M = app.getSpelledOutAmount(14000000, "vi");
  assert(
    spelled14M.includes("14 Triệu VND"),
    `14,000,000 spelled out in VI is "14 Triệu VND": "${spelled14M}"`
  );

  const spelledEn35B = app.getSpelledOutAmount(3500000000, "en");
  assert(
    spelledEn35B.includes("3.5 Billion VND"),
    `3,500,000,000 spelled out in EN is "3.5 Billion VND": "${spelledEn35B}"`
  );

  // Test 5: Property Type Toggle
  assert(
    typeof app.setPropertyType === "function",
    "setPropertyType function is defined"
  );

  app.setPropertyType("landed");
  assert(
    app.currentParams.propertyType === "landed",
    "setPropertyType('landed') sets propertyType to landed"
  );
  assert(
    app.currentParams.monthlyBuildingManagementHOA === 0,
    "Landed house sets HOA fee to 0 VND"
  );
  assert(
    app.currentParams.propertyAppreciationRate === 9.0,
    "Landed house sets appreciation rate to 9.0%"
  );
  assert(
    app.currentParams.homePrice === 6000000000,
    "Landed house sets home price to 6.0B VND"
  );

  app.setPropertyType("apartment");
  assert(
    app.currentParams.propertyType === "apartment",
    "setPropertyType('apartment') sets propertyType to apartment"
  );
  assert(
    app.currentParams.monthlyBuildingManagementHOA === 1500000,
    "Apartment sets HOA fee to 1.5M VND"
  );
  assert(
    app.currentParams.propertyAppreciationRate === 6.0,
    "Apartment sets appreciation rate to 6.0%"
  );

  // Test 6: Persona Presets Loading
  assert(
    typeof app.loadPersona === "function",
    "loadPersona function is defined"
  );

  app.loadPersona("fire");
  assert(
    app.currentParams.rentInvestmentYield === 10.5,
    "FIRE persona sets investment yield to 10.5%"
  );
  assert(
    app.currentParams.monthlyRent === 12000000,
    "FIRE persona sets monthly rent to 12M VND"
  );

  app.loadPersona("expat");
  assert(
    app.currentParams.horizonYears === 5,
    "Expat persona sets horizon to 5 years"
  );
  assert(
    app.currentParams.sellingFrictionRate === 3.0,
    "Expat persona sets selling friction to 3.0%"
  );

  // Test 7: Language Switcher
  assert(
    typeof app.toggleLanguage === "function",
    "toggleLanguage function is defined"
  );

  // Test 8: Theme Switcher
  assert(
    typeof app.toggleTheme === "function",
    "toggleTheme function is defined"
  );
} catch (err) {
  console.error("❌ Test suite encountered runtime exception:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Buy vs. Rent UI & i18n Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
