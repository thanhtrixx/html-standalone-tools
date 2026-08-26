const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadSandbox() {
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
      getBoundingClientRect() {
        return {
          left: 100,
          top: 150,
          right: 200,
          bottom: 170,
          width: 100,
          height: 20,
        };
      },
      getAttribute(attr) {
        return this[attr] || null;
      },
      setAttribute(attr, val) {
        this[attr] = val;
      },
    };
  }

  const documentStub = {
    documentElement: {
      classList: {
        classes: new Set(["dark"]),
        add(c) {
          this.classes.add(c);
        },
        remove(c) {
          this.classes.delete(c);
        },
        contains(c) {
          return this.classes.has(c);
        },
      },
    },
    getElementById(id) {
      if (!domElements[id]) {
        domElements[id] = makeElementStub(id);
      }
      return domElements[id];
    },
    createElement(tag) {
      return makeElementStub();
    },
    querySelectorAll(selector) {
      return [];
    },
  };

  const sandbox = {
    console,
    Math,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    JSON,
    document: documentStub,
    window: {
      innerWidth: 1024,
      innerHeight: 768,
      location: { origin: "https://localhost", pathname: "/", hash: "" },
      addEventListener: () => {},
    },
    setTimeout: (fn) => fn(),
  };
  sandbox.window.document = documentStub;

  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);

  return { sandbox, documentStub, htmlContent };
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
  "\n🧪 Running Buy vs Rent Contextual Tooltips, Methodology Hub & Dynamic Formula Traces Tests...\n"
);

const { sandbox, documentStub, htmlContent } = loadSandbox();

// 1. Translation Key Parity
const viKeys = Object.keys(sandbox.window.TRANSLATIONS.vi).sort();
const enKeys = Object.keys(sandbox.window.TRANSLATIONS.en).sort();
assert(
  viKeys.length >= 70,
  `Dictionaries have at least 70 keys (found ${viKeys.length})`
);
assert(
  JSON.stringify(viKeys) === JSON.stringify(enKeys),
  "100% Translation Key Parity between Vietnamese and English dictionaries"
);

// 2. HTML Tooltip Keys Mapping
const tooltipKeyMatches = [
  ...htmlContent.matchAll(/data-tooltip-key="([^"]+)"/g),
];
assert(
  tooltipKeyMatches.length >= 18,
  `At least 18 data-tooltip-key triggers in HTML (found ${tooltipKeyMatches.length})`
);

let allTooltipsValid = true;
const viDict = sandbox.window.TRANSLATIONS.vi;
const enDict = sandbox.window.TRANSLATIONS.en;
for (const match of tooltipKeyMatches) {
  const key = match[1];
  if (!viDict[key] || !enDict[key]) {
    allTooltipsValid = false;
    break;
  }
}
assert(
  allTooltipsValid,
  "All data-tooltip-key attributes map to non-empty translations in vi and en"
);

// 3. Floating Tooltip Popover Engine
const triggerStub = {
  getAttribute: (attr) =>
    attr === "data-tooltip-key" ? "tooltip_home_price" : null,
  getBoundingClientRect: () => ({
    left: 200,
    top: 300,
    width: 20,
    height: 20,
    bottom: 320,
  }),
};

const tooltipEl = documentStub.getElementById("appTooltip");
tooltipEl.classList.add("hidden");

sandbox.window.showAppTooltip(null, triggerStub);
assert(
  !tooltipEl.classList.contains("hidden"),
  "showAppTooltip unhides tooltip container"
);
assert(
  tooltipEl.innerText.length > 10,
  "showAppTooltip sets localized explanation text into container"
);

let stopPropCalled = false;
let preventDefCalled = false;
const eventMock = {
  stopPropagation: () => {
    stopPropCalled = true;
  },
  preventDefault: () => {
    preventDefCalled = true;
  },
};
sandbox.window.handleTooltipClick(eventMock, triggerStub);
assert(
  stopPropCalled && preventDefCalled,
  "handleTooltipClick calls stopPropagation and preventDefault"
);

sandbox.window.hideAppTooltip();
assert(
  tooltipEl.classList.contains("opacity-0"),
  "hideAppTooltip sets opacity-0 transition class on container"
);

// 4. Methodology Modal
const modalEl = documentStub.getElementById("methodologyModal");
modalEl.classList.add("hidden");

sandbox.window.openMethodologyModal();
assert(
  !modalEl.classList.contains("hidden"),
  "openMethodologyModal displays methodologyModal"
);

sandbox.window.switchMethodologySection("glossary");
const secGlossary = documentStub.getElementById("methSec_glossary");
const secFormulas = documentStub.getElementById("methSec_formulas");
assert(
  !secGlossary.classList.contains("hidden") &&
    secFormulas.classList.contains("hidden"),
  "switchMethodologySection switches active view to glossary"
);

sandbox.window.switchMethodologySection("invariants");
const secInvariants = documentStub.getElementById("methSec_invariants");
assert(
  !secInvariants.classList.contains("hidden"),
  "switchMethodologySection switches active view to invariants"
);

sandbox.window.closeMethodologyModal();
assert(
  modalEl.classList.contains("hidden"),
  "closeMethodologyModal hides methodologyModal"
);

// 5. Dynamic Interactive Formula Traces - Mortgage
sandbox.window.currentParams.homePrice = 3500000000;
sandbox.window.currentParams.downpaymentPercent = 30;
sandbox.window.currentParams.loanTenureYears = 20;
sandbox.window.currentParams.teaserAnnualRate = 6.5;

sandbox.window.updateMethodologyLiveTraces();

const traceMortgageEl = documentStub.getElementById("trace_mortgage_content");
assert(
  traceMortgageEl.innerText.includes("2.450.000.000 VND") &&
    traceMortgageEl.innerText.includes("240 tháng"),
  "Dynamic Mortgage trace substitutes active loan principal and tenure"
);

// 6. Dynamic Interactive Formula Traces - Realizable Home Equity
sandbox.window.currentParams.homePrice = 3500000000;
sandbox.window.currentParams.horizonYears = 20;
sandbox.window.currentParams.propertyAppreciationRate = 6.0;
sandbox.window.currentParams.sellingFrictionRate = 2.5;

sandbox.window.updateMethodologyLiveTraces();

const traceEquityEl = documentStub.getElementById("trace_equity_content");
assert(
  traceEquityEl.innerText.includes("20 năm") &&
    traceEquityEl.innerText.includes("6%/năm") &&
    traceEquityEl.innerText.includes("2.5%"),
  "Dynamic Realizable Equity trace calculates future home value and selling friction"
);

// 7. Dynamic Interactive Formula Traces - Rent Portfolio
sandbox.window.currentParams.monthlyRent = 14000000;
sandbox.window.currentParams.rentInvestmentYield = 8.0;

sandbox.window.updateMethodologyLiveTraces();

const traceRentEl = documentStub.getElementById("trace_rent_content");
assert(
  traceRentEl.innerText.includes("8%/năm") &&
    traceRentEl.innerText.includes("Vốn khởi điểm"),
  "Dynamic Rent trace calculates starting seed and compound returns"
);

// 8. Dynamic Interactive Formula Traces - Valuation PRR & Gross Rental Yield
sandbox.window.currentParams.homePrice = 3500000000;
sandbox.window.currentParams.monthlyRent = 14000000;

sandbox.window.updateMethodologyLiveTraces();

const tracePrrEl = documentStub.getElementById("trace_prr_content");
assert(
  tracePrrEl.innerText.includes("PRR =") &&
    tracePrrEl.innerText.includes("20.8x") &&
    tracePrrEl.innerText.includes("4.80%/năm"),
  "Dynamic PRR & Yield trace displays correct valuation multiples"
);

// 9. Bilingual Formula Trace rendering in English
sandbox.window.toggleLanguage(); // Switch to EN
sandbox.window.updateMethodologyLiveTraces();

assert(
  tracePrrEl.innerText.includes("Gross Rental Yield =") &&
    tracePrrEl.innerText.includes("/yr"),
  "PRR & Yield trace switches correctly to English terminology"
);
assert(
  traceMortgageEl.innerText.includes("Loan P =") &&
    traceMortgageEl.innerText.includes("Tenure n ="),
  "Mortgage trace switches correctly to English terminology"
);

// 10. dismissAllModals lifecycle
const methModal = documentStub.getElementById("methodologyModal");
const tourModal = documentStub.getElementById("onboardingTourModal");
const dossierModal = documentStub.getElementById("aiDossierModal");

methModal.classList.remove("hidden");
tourModal.classList.remove("hidden");
dossierModal.classList.remove("hidden");

sandbox.window.dismissAllModals();

assert(
  methModal.classList.contains("hidden") &&
    tourModal.classList.contains("hidden") &&
    dossierModal.classList.contains("hidden"),
  "dismissAllModals cleanly closes methodology modal, tour modal, and AI dossier modal"
);

// 11. KaTeX & LaTeX Formulations Verification
assert(
  htmlContent.includes("katex.min.css") && htmlContent.includes("katex.min.js"),
  "KaTeX CDN stylesheet and script tags are included in <head>"
);

assert(
  htmlContent.includes(
    "\\text{EMI} = P \\times \\frac{r(1+r)^n}{(1+r)^n - 1}"
  ) &&
    htmlContent.includes("\\text{Equity}(t) =") &&
    htmlContent.includes("\\text{Portfolio}(t) =") &&
    htmlContent.includes("\\text{PRR} ="),
  "Mathematical formulas are properly formatted in LaTeX notation"
);

// 12. Accurate automated test assertion count
assert(
  sandbox.window.TRANSLATIONS.vi.meth_footer_badge.includes("134 assertions") &&
    sandbox.window.TRANSLATIONS.en.meth_footer_badge.includes(
      "134 automated assertions"
    ),
  "Methodology footer badge accurately displays 134 automated assertions for Buy vs Rent"
);

// 13. Mathematical Variable Notations Definitions
assert(
  htmlContent.includes("notion_mortgage_P") &&
    htmlContent.includes("notion_equity_P0") &&
    htmlContent.includes("notion_rent_port") &&
    htmlContent.includes("notion_prr_P0"),
  "Mathematical variable notation blocks are embedded under all formula cards"
);
assert(
  sandbox.window.TRANSLATIONS.vi.notion_mortgage_P &&
    sandbox.window.TRANSLATIONS.en.notion_mortgage_P &&
    sandbox.window.TRANSLATIONS.vi.notion_equity_g &&
    sandbox.window.TRANSLATIONS.en.notion_equity_g,
  "Variable notations have full bilingual translation definitions in vi and en"
);

console.log(`\n==================================================`);
console.log(`Summary: ${passed} Passed, ${failed} Failed`);
console.log(`==================================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
