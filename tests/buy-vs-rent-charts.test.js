const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyVsRentChartSandbox() {
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
      width: 800,
      height: 400,
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
      getContext: () => ({
        clearRect() {},
        fillRect() {},
        drawImage() {},
      }),
      toDataURL: () => "data:image/png;base64,mock",
      click() {},
      getAttribute: () => null,
      setAttribute: () => {},
      addEventListener: () => {},
    };
  }

  let chartInstances = [];

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
      body: makeElementStub("body"),
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
    Chart: Object.assign(
      function Chart(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.data = (config && config.data) || { labels: [], datasets: [] };
        this.options = (config && config.options) || {};
        this.destroy = function () {};
        chartInstances.push(this);
      },
      { getChart: () => null, register: () => {} }
    ),
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
  sandbox.chartInstances = chartInstances;
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

console.log(
  "\n📊 Running Buy vs. Rent Analytics Hub & Visualizations Tests...\n"
);

try {
  const app = loadBuyVsRentChartSandbox();
  const htmlPath = path.join(
    __dirname,
    "..",
    "buy-vs-rent-home-comparison",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  // Test 1: Global chart functions exported
  assert(
    typeof app.switchAnalyticsTab === "function",
    "switchAnalyticsTab function is defined"
  );
  assert(
    typeof app.renderActiveTabChart === "function",
    "renderActiveTabChart function is defined"
  );
  assert(
    typeof app.renderSensitivityMatrixHtml === "function",
    "renderSensitivityMatrixHtml function is defined"
  );
  assert(
    typeof app.exportChartPNG === "function",
    "exportChartPNG function is defined"
  );

  // Test 2: Net Wealth Timeline Tab Chart Rendering
  app.switchAnalyticsTab("timeline");
  assert(
    app.chartInstances.length > 0,
    "Chart instance instantiated for timeline tab"
  );

  const timelineChart = app.chartInstances[app.chartInstances.length - 1];
  assert(
    timelineChart.data.datasets.length === 2,
    "Timeline chart contains 2 datasets (Buy Equity vs Rent Portfolio)"
  );
  assert(
    timelineChart.data.labels.length === 240,
    "Timeline chart labels match 240 months"
  );

  // Test 3: Sunk Costs Tab Chart Rendering
  app.switchAnalyticsTab("sunk");
  const sunkChart = app.chartInstances[app.chartInstances.length - 1];
  assert(
    sunkChart.data.datasets.length === 2,
    "Sunk costs chart contains 2 datasets (Buy Sunk vs Rent Sunk)"
  );

  // Test 4: Monthly Cashflow Delta Tab Chart Rendering
  app.switchAnalyticsTab("cashflow");
  const cashflowChart = app.chartInstances[app.chartInstances.length - 1];
  assert(
    cashflowChart.data.datasets.length === 2,
    "Cashflow chart contains 2 datasets (Monthly Buy vs Monthly Rent)"
  );

  // Test 5: 2D Sensitivity Matrix HTML Rendering
  const matrixContainer = app.document.getElementById("sensitivityContainer");
  app.switchAnalyticsTab("sensitivity");
  assert(
    matrixContainer.innerHTML.includes("<table"),
    "Sensitivity tab generates structured HTML <table> element"
  );
  assert(
    matrixContainer.innerHTML.includes("5.0%"),
    "Sensitivity table headers contain investment yields"
  );
  assert(
    matrixContainer.innerHTML.includes("3.0%/yr") ||
      matrixContainer.innerHTML.includes("6.0%/yr"),
    "Sensitivity table rows contain appreciation rates"
  );
  assert(
    matrixContainer.innerHTML.includes("🟢") ||
      matrixContainer.innerHTML.includes("🔵"),
    "Sensitivity cells contain winner indicators"
  );

  // Test 6: PNG Export Handler Execution
  app.switchAnalyticsTab("timeline");
  assert(
    typeof app.exportChartPNG === "function",
    "exportChartPNG can be called without errors"
  );
  app.exportChartPNG();
  assert(
    true,
    "exportChartPNG executed cleanly with offscreen canvas rendering"
  );

  // Test 7: tabBtn_sunk button exists in DOM and switches tab
  const sunkTabBtn = app.document.getElementById("tabBtn_sunk");
  assert(sunkTabBtn !== null, "tabBtn_sunk element exists in DOM");
  app.switchAnalyticsTab("sunk");
  assert(
    app.currentTab === "sunk",
    "switchAnalyticsTab('sunk') updates currentTab to sunk"
  );

  // Test 8: Adaptive Sensitivity Matrix Centering & Baseline Flag
  const customParams = {
    ...app.DEFAULT_BUY_VS_RENT_PARAMS,
    propertyAppreciationRate: 9.0,
    rentInvestmentYield: 10.5,
  };
  const adaptiveMatrix = app.generateSensitivityMatrix(customParams);
  assert(
    adaptiveMatrix.length === 6,
    "generateSensitivityMatrix produces 6 rows"
  );
  assert(
    adaptiveMatrix[0].cells.length === 6,
    "generateSensitivityMatrix produces 6 columns"
  );
  const baselineCell = adaptiveMatrix
    .flatMap((r) => r.cells)
    .find((c) => c.isCurrentBaseline);
  assert(
    baselineCell !== undefined,
    "generateSensitivityMatrix marks isCurrentBaseline: true on matching active coordinate"
  );
  assert(
    baselineCell.propertyAppreciationRate === 9.0 &&
      baselineCell.rentInvestmentYield === 10.5,
    "Baseline cell matches active parameter rates (9.0% vs 10.5%)"
  );

  // Test 9: Sensitivity HTML renders dynamic headers & baseline badge
  Object.assign(app.currentParams, customParams);
  app.renderApp();
  app.renderSensitivityMatrixHtml(matrixContainer);
  assert(
    matrixContainer.innerHTML.includes("10.5%"),
    "Sensitivity table header dynamically renders centered 10.5% yield column"
  );
  assert(
    matrixContainer.innerHTML.includes("★"),
    "Sensitivity table renders ★ star badge on active baseline cell"
  );
  assert(
    matrixContainer.innerHTML.includes("ring-2 ring-indigo-400"),
    "Sensitivity table applies ring-2 highlight styling to active baseline cell"
  );

  // Test 10: renderApp reactively invokes chart re-rendering
  let chartRenderCount = 0;
  app._mockRenderActiveTabChart = function () {
    chartRenderCount++;
  };
  vm.runInContext(
    "const _orig_renderActiveTabChart = renderActiveTabChart; renderActiveTabChart = function(...args) { if (window._mockRenderActiveTabChart) window._mockRenderActiveTabChart(); return _orig_renderActiveTabChart.apply(this, args); };",
    app
  );
  app.renderApp();
  assert(
    chartRenderCount > 0,
    "renderApp() reliably triggers renderActiveTabChart() on parameter update"
  );
  vm.runInContext("renderActiveTabChart = _orig_renderActiveTabChart;", app);

  // Test 11: applySensitivityScenario updates rates and re-renders
  app.applySensitivityScenario(7.5, 9.0);
  assert(
    app.currentParams.propertyAppreciationRate === 7.5,
    "applySensitivityScenario updates currentParams.propertyAppreciationRate to 7.5%"
  );
  assert(
    app.currentParams.rentInvestmentYield === 9.0,
    "applySensitivityScenario updates currentParams.rentInvestmentYield to 9.0%"
  );
  assert(
    matrixContainer.innerHTML.includes('onclick="applySensitivityScenario('),
    "Sensitivity table cells contain interactive applySensitivityScenario click handlers"
  );

  // Test 12: Section ordering: #methodologySection appears before #analyticsHubSection in DOM
  const methIndex = htmlContent.indexOf('id="methodologySection"');
  const analyticsIndex = htmlContent.indexOf('id="analyticsHubSection"');
  assert(
    methIndex !== -1 && analyticsIndex !== -1 && methIndex < analyticsIndex,
    "#methodologySection is positioned higher in the DOM than #analyticsHubSection"
  );

  // Test 13: Methodology clean UI/UX toggle button and container
  assert(
    htmlContent.includes('id="toggleMethodologyVisibilityBtn"'),
    "#toggleMethodologyVisibilityBtn toggle button exists in methodology header"
  );
  assert(
    htmlContent.includes('id="methodologyBodyContainer"'),
    "#methodologyBodyContainer collapsible container wraps methodology body"
  );
  assert(
    typeof app.toggleMethodologyVisibility === "function",
    "toggleMethodologyVisibility function is defined and globally exported"
  );

  // Test 14: Currency Stepper Buttons
  const initialHomePrice = app.currentParams.homePrice;
  app.stepCurrencyValue("homePrice", 500000000);
  assert(
    app.currentParams.homePrice === initialHomePrice + 500000000,
    "stepCurrencyValue('homePrice', +500M) increments home price accurately"
  );
  app.stepCurrencyValue("homePrice", -500000000);
  assert(
    app.currentParams.homePrice === initialHomePrice,
    "stepCurrencyValue('homePrice', -500M) decrements home price accurately"
  );

  // Test 15: Preset Chips Highlighting in DOM
  assert(
    htmlContent.includes('class="price-chip') &&
      htmlContent.includes('class="rent-chip'),
    "Price chips and Rent chips have dedicated class names for active selection state"
  );

  // Test 16: Dynamic Analytics Hub Subtitles
  app.switchAnalyticsTab("timeline");
  const subtitleEl = app.document.getElementById("chartSubtitleExplainer");
  assert(
    subtitleEl !== null &&
      subtitleEl.innerText === app.TRANSLATIONS[app.currentLang].sub_timeline,
    "Analytics Hub subtitle displays timeline context description on timeline tab"
  );
  app.switchAnalyticsTab("sensitivity");
  assert(
    subtitleEl.innerText === app.TRANSLATIONS[app.currentLang].sub_sensitivity,
    "Analytics Hub subtitle dynamically updates to 2D heatmap description on sensitivity tab"
  );

  // Test 17: Context-Aware Real CPI Toggle & Sensitivity Badge
  const realModeContainer = app.document.getElementById("realModeContainer");
  const sensitivityNotice = app.document.getElementById(
    "sensitivityModeNotice"
  );
  assert(
    realModeContainer.classList.contains("hidden"),
    "Real CPI Discount container is hidden when on sensitivity matrix tab"
  );
  assert(
    !sensitivityNotice.classList.contains("hidden"),
    "Sensitivity mode badge notice is visible when on sensitivity matrix tab"
  );
  app.switchAnalyticsTab("timeline");
  assert(
    !realModeContainer.classList.contains("hidden"),
    "Real CPI Discount container is restored when switching back to timeline chart tab"
  );
  assert(
    sensitivityNotice.classList.contains("hidden"),
    "Sensitivity mode badge notice is hidden on timeline chart tab"
  );

  // Test 18: In-Tab Matrix CSV Export
  assert(
    typeof app.exportSensitivityCSV === "function",
    "exportSensitivityCSV function is defined and globally exported"
  );
  app.switchAnalyticsTab("sensitivity");
  const matrixHtmlBox = app.document.getElementById("sensitivityContainer");
  assert(
    matrixHtmlBox.innerHTML.includes('onclick="exportSensitivityCSV()"'),
    "Sensitivity matrix toolbar includes interactive Export CSV button"
  );
  app.exportSensitivityCSV();
  assert(
    true,
    "exportSensitivityCSV() executes cleanly without runtime exception"
  );

  // Test 19: Actionable Toast Timeline Navigation
  let lastToastMsg = "";
  let lastToastAction = "";
  app._mockShowToast = function (msg, actionHtml) {
    lastToastMsg = msg;
    lastToastAction = actionHtml;
  };
  vm.runInContext(
    "const _orig_showToast = showToast; showToast = function(msg, actionHtml, ...args) { window._mockShowToast(msg, actionHtml); return _orig_showToast.apply(this, [msg, actionHtml, ...args]); };",
    app
  );
  app.applySensitivityScenario(6.5, 8.0);
  assert(
    lastToastAction.includes("switchAnalyticsTab('timeline')") ||
      lastToastAction.includes('switchAnalyticsTab("timeline")'),
    "applySensitivityScenario toast includes direct 1-click timeline navigation action"
  );
  assert(
    lastToastAction.includes("Xem Đồ Thị →") ||
      lastToastAction.includes("View Timeline →"),
    "applySensitivityScenario toast renders localized timeline navigation button"
  );
  vm.runInContext("showToast = _orig_showToast;", app);

  // Test 20: Dedicated Application Vector Icon Validation
  const iconSvgPath = path.join(
    __dirname,
    "..",
    "buy-vs-rent-home-comparison",
    "icon.svg"
  );
  assert(
    fs.existsSync(iconSvgPath),
    "Dedicated icon.svg exists in tool directory"
  );
  const iconContent = fs.readFileSync(iconSvgPath, "utf8");
  assert(
    iconContent.includes("<svg") &&
      iconContent.includes('viewBox="0 0 512 512"'),
    "icon.svg defines valid 512x512 SVG viewport"
  );
  assert(
    iconContent.includes("bvrBgGrad") && iconContent.includes("bvrCardShadow"),
    "icon.svg defines custom Buy vs. Rent gradients and shadows"
  );
  assert(
    iconContent.includes("bvrAmberGrad") &&
      iconContent.includes("bvrEmeraldGrad"),
    "icon.svg incorporates theme color ramps for Buy and Rent paths"
  );
} catch (err) {
  console.error("❌ Test suite encountered runtime exception:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Buy vs. Rent Charts Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
