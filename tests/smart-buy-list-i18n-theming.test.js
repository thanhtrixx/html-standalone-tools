const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListI18nEngine() {
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
  let activeFocus = null;
  const elements = {
    inputItemName: {
      id: "inputItemName",
      focus: () => {
        activeFocus = "inputItemName";
      },
    },
    comparatorModal: {
      classList: {
        add: () => {},
        remove: () => {},
        contains: (c) => c === "hidden",
      },
    },
    shareModal: {
      classList: {
        add: () => {},
        remove: () => {},
        contains: (c) => c === "hidden",
      },
    },
    themeToggleBtn: { textContent: "🌙" },
    langToggleBtn: { textContent: "VI" },
  };

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
      getElementById: (id) =>
        elements[id] || {
          classList: {
            add: () => {},
            remove: () => {},
            contains: () => false,
          },
          textContent: "",
          innerHTML: "",
          style: {},
          appendChild: () => {},
        },
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
  return {
    sandbox,
    docElementClasses,
    getActiveFocus: () => activeFocus,
    htmlContent,
  };
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
  "\n🧪 Running Smart Buy-List i18n, Multi-Currency & Theming Test Suite...\n"
);

try {
  const { sandbox, docElementClasses, getActiveFocus, htmlContent } =
    loadBuyListI18nEngine();

  // 1. 100% DICTIONARY KEY PARITY TESTS
  console.log("--- Section 1: Bilingual Translation Dictionary Parity ---");

  assert(
    typeof sandbox.TRANSLATIONS === "object",
    "TRANSLATIONS dictionary object is defined"
  );
  assert(
    typeof sandbox.TRANSLATIONS.en === "object" &&
      typeof sandbox.TRANSLATIONS.vi === "object",
    "Both English (en) and Vietnamese (vi) dictionaries exist"
  );

  const enKeys = Object.keys(sandbox.TRANSLATIONS.en);
  const viKeys = Object.keys(sandbox.TRANSLATIONS.vi);

  assert(
    enKeys.length > 0 && viKeys.length > 0,
    `Found ${enKeys.length} English keys and ${viKeys.length} Vietnamese keys`
  );

  const missingInVi = enKeys.filter((k) => !(k in sandbox.TRANSLATIONS.vi));
  const missingInEn = viKeys.filter((k) => !(k in sandbox.TRANSLATIONS.en));

  assert(
    missingInVi.length === 0,
    `I18N-01a: 100% English keys exist in Vietnamese (Missing: ${missingInVi.join(", ") || "none"})`
  );
  assert(
    missingInEn.length === 0,
    `I18N-01b: 100% Vietnamese keys exist in English (Missing: ${missingInEn.join(", ") || "none"})`
  );

  const emptyViKeys = enKeys.filter(
    (k) =>
      typeof sandbox.TRANSLATIONS.vi[k] !== "string" ||
      sandbox.TRANSLATIONS.vi[k].trim() === ""
  );
  assert(
    emptyViKeys.length === 0,
    `I18N-01c: All Vietnamese translation strings are non-empty`
  );

  // 2. MULTI-CURRENCY & LOCALE FORMATTING TESTS
  console.log(
    "\n--- Section 2: Multi-Currency Formatting & Verbal Helpers ---"
  );

  assert(
    typeof sandbox.formatCurrency === "function",
    "formatCurrency function is exported globally"
  );
  assert(
    typeof sandbox.getVerbalAmount === "function",
    "getVerbalAmount function is exported globally"
  );

  // USD Formatting
  const usdFormatted = sandbox.formatCurrency(24.5, "USD", "en");
  assert(
    usdFormatted.includes("$") && usdFormatted.includes("24.50"),
    `CURR-01: formatCurrency in USD outputs valid dollar format (${usdFormatted})`
  );

  // VND Formatting (zero decimals)
  const vndFormatted = sandbox.formatCurrency(1500000, "VND", "vi");
  assert(
    vndFormatted.includes("₫") || vndFormatted.includes("VND"),
    `CURR-02: formatCurrency in VND outputs valid Vietnamese currency (${vndFormatted})`
  );

  // EUR Formatting
  const eurFormatted = sandbox.formatCurrency(19.99, "EUR", "en");
  assert(
    eurFormatted.includes("€") || eurFormatted.includes("EUR"),
    `CURR-03: formatCurrency in EUR outputs valid Euro format (${eurFormatted})`
  );

  // Verbal Amounts - Vietnamese
  assert(
    sandbox.getVerbalAmount(25000000, "vi") === "25 Triệu VND",
    "VERBAL-01: 25,000,000 VND returns '25 Triệu VND'"
  );
  assert(
    sandbox.getVerbalAmount(1500000000, "vi") === "1.5 Tỷ VND",
    "VERBAL-02: 1,500,000,000 VND returns '1.5 Tỷ VND'"
  );
  assert(
    sandbox.getVerbalAmount(500000, "vi") === "500 Nghìn VND",
    "VERBAL-03: 500,000 VND returns '500 Nghìn VND'"
  );

  // Verbal Amounts - English
  assert(
    sandbox.getVerbalAmount(25000000, "en") === "25 Million USD",
    "VERBAL-04: 25,000,000 returns '25 Million USD'"
  );

  // 3. THEME TOGGLING (DARK / LIGHT)
  console.log("\n--- Section 3: WCAG Dark / Light Theme System ---");

  assert(
    typeof sandbox.toggleTheme === "function",
    "toggleTheme function is exported globally"
  );
  assert(
    docElementClasses.has("dark"),
    "THEME-01: Application initializes in dark theme"
  );

  sandbox.toggleTheme();
  assert(
    docElementClasses.has("light") && !docElementClasses.has("dark"),
    "THEME-02: toggleTheme switches class to 'light'"
  );

  sandbox.toggleTheme();
  assert(
    docElementClasses.has("dark") && !docElementClasses.has("light"),
    "THEME-03: toggleTheme switches back to 'dark'"
  );

  assert(
    sandbox.memoryState &&
      sandbox.memoryState.settings &&
      sandbox.memoryState.settings.theme === "dark",
    "THEME-04: Theme state tracked in memoryState.settings.theme"
  );

  sandbox.toggleTheme();
  assert(
    sandbox.memoryState.settings.theme === "light",
    "THEME-05: toggleTheme updates memoryState.settings.theme to 'light'"
  );
  sandbox.toggleTheme(); // switch back to dark

  // Check CSS light theme rules in HTML content
  assert(
    htmlContent.includes(".light .bg-slate-900") &&
      htmlContent.includes(".light .bg-slate-950") &&
      htmlContent.includes(".light .bg-slate-800"),
    "THEME-06: HTML contains comprehensive .light surface container CSS rules"
  );

  assert(
    htmlContent.includes(".light .text-slate-100") &&
      htmlContent.includes(".light .border-slate-800"),
    "THEME-07: HTML contains .light typography and border contrast rules"
  );

  assert(
    htmlContent.includes('.light input[type="text"]') ||
      htmlContent.includes(".light input"),
    "THEME-08: HTML contains .light form input styling rules"
  );

  // 4. KEYBOARD NAVIGATION SHORTCUTS
  console.log("\n--- Section 4: Keyboard Navigation Shortcuts ---");

  assert(
    typeof sandbox.handleGlobalKeyDown === "function",
    "handleGlobalKeyDown function is exported globally"
  );

  // 'N' hotkey focuses item input
  sandbox.handleGlobalKeyDown({ key: "n", preventDefault: () => {} });
  assert(
    getActiveFocus() === "inputItemName",
    "KEY-01: Pressing 'n' focuses item input field"
  );

  // 5. COMPREHENSIVE MODAL & UNIT I18N COVERAGE
  console.log(
    "\n--- Section 5: Categories, Measurement Units & Modal i18n ---"
  );

  assert(
    typeof sandbox.UNIT_GROUPS === "object" &&
      Array.isArray(sandbox.UNIT_GROUPS),
    "I18N-UNIT-01: UNIT_GROUPS array is exported globally"
  );

  assert(
    sandbox.UNIT_GROUPS.length === 3,
    "I18N-UNIT-02: UNIT_GROUPS contains weight, volume, and count groups"
  );

  assert(
    typeof sandbox.CATEGORIES === "object",
    "I18N-CAT-01: CATEGORIES map is exported globally"
  );

  const categories = Object.keys(sandbox.CATEGORIES);
  const validCategories = categories.every(
    (k) =>
      typeof sandbox.CATEGORIES[k].en === "string" &&
      typeof sandbox.CATEGORIES[k].vi === "string" &&
      typeof sandbox.CATEGORIES[k].icon === "string"
  );
  assert(
    validCategories,
    "I18N-CAT-02: Every category has valid English, Vietnamese labels and emoji icon"
  );

  assert(
    typeof sandbox.renderCategoryOptions === "function",
    "I18N-UI-01: renderCategoryOptions is exported globally"
  );

  assert(
    typeof sandbox.renderUnitOptions === "function",
    "I18N-UI-02: renderUnitOptions is exported globally"
  );

  assert(
    typeof sandbox.applyTranslations === "function",
    "I18N-UI-03: applyTranslations is exported globally"
  );

  // Check critical keys in TRANSLATIONS dictionary
  const criticalKeys = [
    "btn_share_header",
    "sample_banner_text",
    "btn_keep_sample",
    "btn_clear_sample",
    "total_spent_label",
    "unit_price_preview",
    "comp_modal_title",
    "comp_modal_desc",
    "comp_comparing_item",
    "comp_package_a_active",
    "comp_package_a_label",
    "comp_package_b_label",
    "comp_price",
    "comp_qty",
    "comp_unit",
    "comp_unit_price",
    "comp_winner_pkg_cheaper",
    "comp_saves_pct",
    "comp_active_already_cheaper",
    "comp_dim_mismatch_title",
    "comp_dim_mismatch_desc",
    "comp_equal_deal_title",
    "comp_equal_deal_desc",
    "btn_apply_winner_form",
    "btn_close",
    "btn_cancel",
    "share_modal_title",
    "share_modal_desc",
    "qr_hint_text",
    "btn_native_share",
    "btn_copy_url",
    "btn_export_json",
    "import_modal_title",
    "btn_import_merge",
    "btn_import_replace",
    "trip_modal_title",
    "trip_modal_purchased_label",
    "trip_modal_total_spent_label",
    "label_rollover_choice",
    "opt_rollover_text",
    "opt_discard_text",
    "btn_finalize_trip",
    "ledger_modal_title",
    "ledger_search_placeholder",
    "th_date",
    "th_item",
    "th_store",
    "th_size",
    "th_paid",
    "th_unit_price",
    "ledger_empty_msg",
    "quick_price_item_name",
    "quick_price_shelf",
    "quick_price_qty",
    "quick_price_adjust_label",
    "settings_store_title",
    "settings_store_desc",
    "settings_pref_heading",
    "settings_default_currency",
    "settings_default_grouping",
    "grouping_by_aisle",
    "grouping_by_store",
    "settings_data_heading",
    "btn_export_json_backup",
    "btn_import_json_backup",
    "btn_load_sample_data",
    "btn_clear_all_data",
    "settings_sync_title",
    "settings_sync_status",
    "badge_local_only",
    "toast_sample_loaded",
    "toast_data_cleared",
    "toast_share_copied",
    "toast_import_shared_success",
  ];

  const allCriticalPresent = criticalKeys.every(
    (k) =>
      typeof sandbox.TRANSLATIONS.en[k] === "string" &&
      typeof sandbox.TRANSLATIONS.vi[k] === "string"
  );
  assert(
    allCriticalPresent,
    `I18N-KEYS-01: All ${criticalKeys.length} critical UI and modal translation keys exist in both en and vi`
  );
} catch (err) {
  console.error("❌ Test Execution Error:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 i18n & Theming Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
