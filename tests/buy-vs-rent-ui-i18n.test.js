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
      _innerHTML: "",
      get innerHTML() {
        return this._innerHTML;
      },
      set innerHTML(v) {
        this._innerHTML = v;
      },
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
      getAttribute(attr) {
        return this[attr] || null;
      },
      setAttribute(attr, val) {
        this[attr] = val;
      },
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
      querySelector: (sel) => {
        const id = sel.replace(/^[#.]/, "");
        if (!domElements[id]) domElements[id] = makeElementStub(id);
        return domElements[id];
      },
      querySelectorAll: (sel) => {
        if (sel === "[data-i18n]") {
          const matches = [
            ...htmlContent.matchAll(/data-i18n=["']([^"']+)["']/g),
          ];
          return matches.map((m) => {
            const el = makeElementStub();
            el.getAttribute = (attr) => (attr === "data-i18n" ? m[1] : null);
            return el;
          });
        }
        if (sel === "[data-tooltip-key]") {
          const matches = [
            ...htmlContent.matchAll(/data-tooltip-key=["']([^"']+)["']/g),
          ];
          return matches.map((m) => {
            const el = makeElementStub();
            el.getAttribute = (attr) =>
              attr === "data-tooltip-key" ? m[1] : null;
            return el;
          });
        }
        return [];
      },
      createElement: (tag) => makeElementStub(tag),
      addEventListener: () => {},
    },
    localStorage: {
      store: {},
      getItem(k) {
        return this.store[k] !== undefined ? this.store[k] : null;
      },
      setItem(k, v) {
        this.store[k] = String(v);
      },
      removeItem(k) {
        delete this.store[k];
      },
      clear() {
        this.store = {};
      },
    },
    location: {
      href: "http://localhost/",
      search: "",
      origin: "http://localhost",
      pathname: "/",
    },
    navigator: {
      clipboard: {
        writeText: async () => {},
      },
    },
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
  "\n🌐 Running Comprehensive Buy vs. Rent UI & i18n Verification Tests...\n"
);

try {
  const { sandbox: app, htmlContent } = loadBuyVsRentApp();

  // Test 1: Translation dictionaries existence
  assert(
    app.TRANSLATIONS && typeof app.TRANSLATIONS === "object",
    "TRANSLATIONS object is globally exported"
  );
  assert(
    app.TRANSLATIONS.vi && typeof app.TRANSLATIONS.vi === "object",
    "Vietnamese dictionary (vi) exists and is populated"
  );
  assert(
    app.TRANSLATIONS.en && typeof app.TRANSLATIONS.en === "object",
    "English dictionary (en) exists and is populated"
  );

  // Test 2: Complete 1-to-1 Translation Key Parity
  const viKeys = Object.keys(app.TRANSLATIONS.vi).sort();
  const enKeys = Object.keys(app.TRANSLATIONS.en).sort();

  assert(
    viKeys.length >= 95,
    `Vietnamese dictionary contains extensive vocabulary (${viKeys.length} keys)`
  );
  assert(
    enKeys.length >= 95,
    `English dictionary contains extensive vocabulary (${enKeys.length} keys)`
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

  // Test 3: String Purity and Accent Validation
  const vietnameseRegex =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ₫]/i;
  const enCorruptions = [];
  for (const [key, text] of Object.entries(app.TRANSLATIONS.en)) {
    if (typeof text === "string" && vietnameseRegex.test(text)) {
      enCorruptions.push(`${key}: "${text}"`);
    }
  }
  assert(
    enCorruptions.length === 0,
    `No Vietnamese diacritics present in English translation dictionary (Violations: ${enCorruptions.join(", ") || "None"})`
  );

  const emptyViKeys = Object.entries(app.TRANSLATIONS.vi).filter(
    ([k, v]) => !v || typeof v !== "string" || v.trim().length === 0
  );
  const emptyEnKeys = Object.entries(app.TRANSLATIONS.en).filter(
    ([k, v]) => !v || typeof v !== "string" || v.trim().length === 0
  );
  assert(
    emptyViKeys.length === 0,
    `All Vietnamese translation values are non-empty strings (Empty: ${emptyViKeys.map((e) => e[0]).join(", ") || "None"})`
  );
  assert(
    emptyEnKeys.length === 0,
    `All English translation values are non-empty strings (Empty: ${emptyEnKeys.map((e) => e[0]).join(", ") || "None"})`
  );

  // Test 4: 100% DOM data-i18n Mapping Parity
  const domI18nKeys = [
    ...htmlContent.matchAll(/data-i18n=["']([^"']+)["']/g),
  ].map((m) => m[1]);
  const uniqueDomI18nKeys = [...new Set(domI18nKeys)];

  const unmappedDomVi = uniqueDomI18nKeys.filter(
    (k) => !(k in app.TRANSLATIONS.vi)
  );
  const unmappedDomEn = uniqueDomI18nKeys.filter(
    (k) => !(k in app.TRANSLATIONS.en)
  );

  assert(
    unmappedDomVi.length === 0,
    `All ${uniqueDomI18nKeys.length} DOM data-i18n elements map to Vietnamese translations (Missing: ${unmappedDomVi.join(", ") || "None"})`
  );
  assert(
    unmappedDomEn.length === 0,
    `All ${uniqueDomI18nKeys.length} DOM data-i18n elements map to English translations (Missing: ${unmappedDomEn.join(", ") || "None"})`
  );

  // Test 5: 100% DOM data-tooltip-key Mapping Parity
  const domTooltipKeys = [
    ...htmlContent.matchAll(/data-tooltip-key=["']([^"']+)["']/g),
  ].map((m) => m[1]);
  const uniqueTooltipKeys = [...new Set(domTooltipKeys)];

  const unmappedTooltipVi = uniqueTooltipKeys.filter(
    (k) => !(k in app.TRANSLATIONS.vi)
  );
  const unmappedTooltipEn = uniqueTooltipKeys.filter(
    (k) => !(k in app.TRANSLATIONS.en)
  );

  assert(
    unmappedTooltipVi.length === 0,
    `All ${uniqueTooltipKeys.length} DOM data-tooltip-key elements map to Vietnamese explanations (Missing: ${unmappedTooltipVi.join(", ") || "None"})`
  );
  assert(
    unmappedTooltipEn.length === 0,
    `All ${uniqueTooltipKeys.length} DOM data-tooltip-key elements map to English explanations (Missing: ${unmappedTooltipEn.join(", ") || "None"})`
  );

  // Test 6: Currency & Number Masking Parity
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

  const formattedVnd = app.formatCurrency(3500000000);
  assert(
    formattedVnd.includes("3.500.000.000") ||
      formattedVnd.includes("3,500,000,000"),
    `formatCurrency formats 3,500,000,000 properly: "${formattedVnd}"`
  );

  const parsedFromDots = app.parseMaskedNumber("3.500.000.000");
  assert(
    parsedFromDots === 3500000000,
    `parseMaskedNumber("3.500.000.000") parsed to 3500000000`
  );

  const parsedFromCommas = app.parseMaskedNumber("3,500,000,000");
  assert(
    parsedFromCommas === 3500000000,
    `parseMaskedNumber("3,500,000,000") parsed to 3500000000`
  );

  // Test 7: Multi-Scale Dynamic Verbal Amount Helpers Parity
  assert(
    typeof app.getSpelledOutAmount === "function",
    "getSpelledOutAmount helper is defined"
  );

  const verbalScales = [
    {
      val: 500000,
      viExpected: "500 Nghìn VND",
      enExpected: "500 Thousand VND",
    },
    {
      val: 14000000,
      viExpected: "14 Triệu VND",
      enExpected: "14 Million VND",
    },
    {
      val: 150000000,
      viExpected: "150 Triệu VND",
      enExpected: "150 Million VND",
    },
    {
      val: 3500000000,
      viExpected: "3.5 Tỷ VND",
      enExpected: "3.5 Billion VND",
    },
    { val: 10000000000, viExpected: "10 Tỷ VND", enExpected: "10 Billion VND" },
  ];

  verbalScales.forEach(({ val, viExpected, enExpected }) => {
    const viRes = app.getSpelledOutAmount(val, "vi");
    const enRes = app.getSpelledOutAmount(val, "en");
    assert(
      viRes.includes(viExpected),
      `getSpelledOutAmount(${val}, 'vi') contains "${viExpected}": "${viRes}"`
    );
    assert(
      enRes.includes(enExpected),
      `getSpelledOutAmount(${val}, 'en') contains "${enExpected}": "${enRes}"`
    );
  });

  // Test 8: Property Type Profiles Localization & Behavior
  assert(
    typeof app.setPropertyType === "function",
    "setPropertyType function is defined"
  );

  app.setPropertyType("landed");
  assert(
    app.currentParams.propertyType === "landed" &&
      app.currentParams.monthlyBuildingManagementHOA === 0 &&
      app.currentParams.propertyAppreciationRate === 9.0 &&
      app.currentParams.homePrice === 6000000000,
    "setPropertyType('landed') properly applies Landed House parameter profile"
  );

  app.setPropertyType("apartment");
  assert(
    app.currentParams.propertyType === "apartment" &&
      app.currentParams.monthlyBuildingManagementHOA === 1500000 &&
      app.currentParams.propertyAppreciationRate === 6.0 &&
      app.currentParams.homePrice === 3500000000,
    "setPropertyType('apartment') properly applies Urban Condo parameter profile"
  );

  // Test 9: Strategy Persona Presets Localization Parity
  const expectedPersonas = ["condo", "landed", "fire", "expat"];
  expectedPersonas.forEach((p) => {
    const titleKey = `persona_${p}_title`;
    const descKey = `persona_${p}_desc`;
    assert(
      app.TRANSLATIONS.vi[titleKey] && app.TRANSLATIONS.en[titleKey],
      `Persona '${p}' title translation exists in VI & EN: "${app.TRANSLATIONS.vi[titleKey]}" / "${app.TRANSLATIONS.en[titleKey]}"`
    );
    assert(
      app.TRANSLATIONS.vi[descKey] && app.TRANSLATIONS.en[descKey],
      `Persona '${p}' desc translation exists in VI & EN: "${app.TRANSLATIONS.vi[descKey]}" / "${app.TRANSLATIONS.en[descKey]}"`
    );
  });

  // Test 10: AI Decision Dossier & Prompt Blueprints Localization Parity
  const aiBlueprintKeys = [
    "bp_verdict",
    "bp_stress",
    "bp_fire",
    "bp_allocation",
  ];
  aiBlueprintKeys.forEach((bp) => {
    assert(
      app.TRANSLATIONS.vi[bp] && app.TRANSLATIONS.en[bp],
      `AI Blueprint '${bp}' translated in VI & EN: "${app.TRANSLATIONS.vi[bp]}" / "${app.TRANSLATIONS.en[bp]}"`
    );
  });

  const dossierKeys = [
    "btn_ai_dossier",
    "dossier_title",
    "dossier_subtitle",
    "dossier_blueprint_label",
    "dossier_privacy_title",
    "dossier_privacy_desc",
    "dossier_preview_label",
    "btn_close",
    "btn_download_md",
    "btn_copy_md",
  ];
  dossierKeys.forEach((k) => {
    assert(
      app.TRANSLATIONS.vi[k] && app.TRANSLATIONS.en[k],
      `Dossier UI key '${k}' is translated in VI & EN: "${app.TRANSLATIONS.vi[k]}" / "${app.TRANSLATIONS.en[k]}"`
    );
  });

  // Test 11: Methodology & Formula Hub Localization Parity
  const methodologyTabs = [
    "meth_tab_formulas",
    "meth_tab_glossary",
    "meth_tab_invariants",
    "meth_footer_badge",
  ];
  methodologyTabs.forEach((k) => {
    assert(
      app.TRANSLATIONS.vi[k] && app.TRANSLATIONS.en[k],
      `Methodology tab/badge key '${k}' is translated in VI & EN`
    );
  });

  const formulaTitles = [
    "formula_mortgage_title",
    "formula_mortgage_desc",
    "formula_equity_title",
    "formula_equity_desc",
    "formula_rent_title",
    "formula_rent_desc",
    "formula_prr_title",
  ];
  formulaTitles.forEach((k) => {
    assert(
      app.TRANSLATIONS.vi[k] && app.TRANSLATIONS.en[k],
      `Formula section key '${k}' is translated in VI & EN`
    );
  });

  const variableNotations = [
    "notion_mortgage_P",
    "notion_mortgage_r",
    "notion_mortgage_n",
    "notion_mortgage_bal",
    "notion_equity_P0",
    "notion_equity_g",
    "notion_equity_f",
    "notion_equity_debt",
    "notion_rent_port",
    "notion_rent_r",
    "notion_rent_buy_out",
    "notion_rent_rent_out",
    "notion_prr_P0",
    "notion_prr_ann_rent",
    "notion_prr_bench",
    "notion_prr_yield",
  ];
  variableNotations.forEach((k) => {
    assert(
      app.TRANSLATIONS.vi[k] && app.TRANSLATIONS.en[k],
      `Variable notation '${k}' is translated in VI & EN`
    );
  });

  const glossaryKeys = [
    "gloss_sunk_title",
    "gloss_sunk_desc",
    "gloss_crossover_title",
    "gloss_crossover_desc",
    "gloss_rates_title",
    "gloss_rates_desc",
    "gloss_prr_title",
    "gloss_prr_desc",
  ];
  glossaryKeys.forEach((k) => {
    assert(
      app.TRANSLATIONS.vi[k] && app.TRANSLATIONS.en[k],
      `Glossary definition '${k}' is translated in VI & EN`
    );
  });

  const invariantKeys = [
    "invariants_title",
    "inv_step",
    "inv_maint",
    "inv_hoa",
    "inv_deposit",
    "inv_friction",
    "inv_deficit",
  ];
  invariantKeys.forEach((k) => {
    assert(
      app.TRANSLATIONS.vi[k] && app.TRANSLATIONS.en[k],
      `Invariant assumption '${k}' is translated in VI & EN`
    );
  });

  // Test 12: Contextual Tooltip Popover Explanations
  const tooltipKeys = [
    "tooltip_kpi_crossover",
    "tooltip_kpi_net_worth",
    "tooltip_kpi_sunk_costs",
    "tooltip_kpi_prr",
    "tooltip_property_type",
    "tooltip_home_price",
    "tooltip_downpayment",
    "tooltip_loan_amount",
    "tooltip_loan_tenure",
    "tooltip_amortization_scheme",
    "tooltip_teaser_rate",
    "tooltip_floating_rate",
    "tooltip_acquisition_costs",
    "tooltip_monthly_rent",
    "tooltip_rent_inflation",
    "tooltip_investment_yield",
    "tooltip_initial_portfolio",
    "tooltip_prop_appreciation",
    "tooltip_cpi_inflation",
    "tooltip_horizon_years",
    "tooltip_real_mode",
  ];
  tooltipKeys.forEach((k) => {
    assert(
      typeof app.TRANSLATIONS.vi[k] === "string" &&
        app.TRANSLATIONS.vi[k].length > 15 &&
        typeof app.TRANSLATIONS.en[k] === "string" &&
        app.TRANSLATIONS.en[k].length > 15,
      `Contextual tooltip '${k}' provides comprehensive, detailed explanations in both languages`
    );
  });

  // Test 13: Live Language Switcher
  assert(
    typeof app.toggleLanguage === "function",
    "toggleLanguage function is defined"
  );
  app.currentLang = "vi";
  app.toggleLanguage();
  assert(
    app.currentLang === "en",
    "toggleLanguage() switched from 'vi' to 'en'"
  );
  app.toggleLanguage();
  assert(
    app.currentLang === "vi",
    "toggleLanguage() switched from 'en' to 'vi'"
  );

  // Test 14: System Toast Notifications Parity
  const toastKeys = [
    "toast_preset_loaded",
    "toast_undo",
    "toast_copied",
    "toast_reset",
  ];
  toastKeys.forEach((k) => {
    assert(
      app.TRANSLATIONS.vi[k] && app.TRANSLATIONS.en[k],
      `Toast alert key '${k}' is translated in VI & EN: "${app.TRANSLATIONS.vi[k]}" / "${app.TRANSLATIONS.en[k]}"`
    );
  });
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
