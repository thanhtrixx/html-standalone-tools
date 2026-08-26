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
