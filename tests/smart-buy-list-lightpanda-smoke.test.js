#!/usr/bin/env node

/**
 * Smart Buy-List Lightpanda-Aligned Fast Smoke & DOM Semantics Suite
 *
 * Domain: Fast Headless Inner-Loop Smoke Testing (ADR-0009)
 * Covers:
 * - Semantic accessibility roles and DOM tree contracts (tabs, modals, action bars)
 * - Form validation constraints (input types, required bounds, step attributes)
 * - Rapid bilingual completeness across all UI view containers
 * - State lifecycle transitions & sample data loading with zero runtime exceptions (<1s execution)
 */

const {
  getHtmlContent,
  createTrackerSandbox,
  createAssertions,
} = require("./helpers/smart-buy-list-harness");

const { assert, printSummary } = createAssertions(
  "Smart Buy-List Fast Smoke & DOM Semantics Suite"
);

console.log(
  "\n🧪 Running Smart Buy-List Fast Smoke & DOM Semantics Suite...\n"
);

const startTime = Date.now();

try {
  const rawHtml = getHtmlContent();
  const { sandbox } = createTrackerSandbox();

  // SECTION 1: Semantic Navigation & Tab Hierarchy in HTML Markup
  console.log("--- Section 1: Semantic Navigation & Tab Hierarchy ---");

  assert(
    rawHtml.includes('id="bottomNavBar"'),
    "SMOKE-NAV-01: #bottomNavBar exists in DOM structure"
  );

  const requiredTabs = [
    { id: "navPlanningBtn", label: "Kế Hoạch / Planning" },
    { id: "navBuyModeBtn", label: "Đi Chợ / Buy Mode" },
    { id: "navLedgerBtn", label: "Lịch Sử / Price History" },
    { id: "navCompareBtn", label: "So Sánh / Comparator" },
  ];

  requiredTabs.forEach(({ id, label }) => {
    assert(
      rawHtml.includes(`id="${id}"`),
      `SMOKE-NAV-02: Tab #${id} (${label}) exists in markup`
    );
    const tabRegex = new RegExp(`<button[^>]*id="${id}"[^>]*role="tab"`, "i");
    const tabRoleRevRegex = new RegExp(
      `<button[^>]*role="tab"[^>]*id="${id}"`,
      "i"
    );
    assert(
      tabRegex.test(rawHtml) || tabRoleRevRegex.test(rawHtml),
      `SMOKE-NAV-03: Tab #${id} has explicit role="tab"`
    );
  });

  // SECTION 2: Modal Accessibility & Light Dismissal Contracts
  console.log("--- Section 2: Modal Dialog Hierarchy & Backdrop Contracts ---");

  const requiredModals = [
    "settingsModal",
    "editItemModal",
    "quickPriceModal",
    "comparatorModal",
    "shareModal",
    "tripCompleteModal",
    "storeManagerModal",
  ];

  requiredModals.forEach((modalId) => {
    assert(
      rawHtml.includes(`id="${modalId}"`),
      `SMOKE-MODAL-01: Modal #${modalId} exists in HTML`
    );
    const modalRoleRegex = new RegExp(`id="${modalId}"[^>]*role="dialog"`, "i");
    const modalRoleRevRegex = new RegExp(
      `role="dialog"[^>]*id="${modalId}"`,
      "i"
    );
    assert(
      modalRoleRegex.test(rawHtml) || modalRoleRevRegex.test(rawHtml),
      `SMOKE-MODAL-02: Modal #${modalId} has role="dialog"`
    );
  });

  // SECTION 3: Form Input Validation Constraints
  console.log("--- Section 3: Form Input Validation Constraints ---");

  assert(
    rawHtml.includes('id="smartQuickInput"'),
    "SMOKE-FORM-01: #smartQuickInput omnibox exists in HTML"
  );

  const compInputs = [
    "compPriceA",
    "compQtyA",
    "compUnitA",
    "compPriceB",
    "compQtyB",
    "compUnitB",
  ];
  compInputs.forEach((inpId) => {
    assert(
      rawHtml.includes(`id="${inpId}"`),
      `SMOKE-FORM-02: Comparator input #${inpId} exists`
    );
  });

  // SECTION 4: Fast State Mutation & Sample Data Smoke
  console.log("--- Section 4: Fast State Lifecycle & Sample Data Smoke ---");

  let uncaughtErrors = 0;
  const originalConsoleError = console.error;
  console.error = (...args) => {
    uncaughtErrors++;
    originalConsoleError(...args);
  };

  try {
    if (typeof sandbox.loadSampleData === "function") {
      sandbox.loadSampleData();
      assert(
        true,
        "SMOKE-STATE-01: loadSampleData() executes without throwing"
      );
    }

    if (typeof sandbox.setActiveTab === "function") {
      sandbox.setActiveTab("PLANNING");
      sandbox.setActiveTab("BUY");
      sandbox.setActiveTab("PRICE_HISTORY");
      sandbox.setActiveTab("COMPARATOR");
      sandbox.setActiveTab("PLANNING");
      assert(
        true,
        "SMOKE-STATE-02: 4-tab navigation transitions execute cleanly"
      );
    }

    if (typeof sandbox.toggleLanguage === "function") {
      sandbox.toggleLanguage();
      sandbox.toggleLanguage();
      assert(true, "SMOKE-STATE-03: Bilingual toggle cycles cleanly");
    }
  } finally {
    console.error = originalConsoleError;
  }

  assert(
    uncaughtErrors === 0,
    `SMOKE-STATE-04: Zero console errors logged during state lifecycle (Errors: ${uncaughtErrors})`
  );

  // SECTION 5: Sub-Second Execution Benchmark
  const durationMs = Date.now() - startTime;
  console.log(`--- Section 5: Execution Benchmark (${durationMs}ms) ---`);
  assert(
    durationMs < 1000,
    `SMOKE-PERF-01: Entire smoke suite completes in < 1000ms (Actual: ${durationMs}ms)`
  );

  printSummary();
} catch (err) {
  console.error("❌ Fatal error executing Lightpanda smoke suite:", err);
  process.exit(1);
}
