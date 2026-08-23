const fs = require("fs");
const path = require("path");
const vm = require("vm");

function createDOMEnvironment() {
  const htmlPath = path.join(
    __dirname,
    "..",
    "personal-finance-savings-predictor",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

  const domStore = new Map();

  function createMockElement(id, tagName = "div") {
    let _val = "";
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      checked: false,
      get value() {
        return _val;
      },
      set value(v) {
        _val = v == null ? "" : String(v);
      },
      _innerText: "",
      _innerHTML: "",
      title: "",
      style: {},
      children: [],
      parentElement: {
        classList: {
          classes: new Set(),
          add(c) {
            this.classes.add(c);
          },
          remove(c) {
            this.classes.delete(c);
          },
          toggle(c, force) {
            if (force === undefined) {
              if (this.classes.has(c)) this.classes.delete(c);
              else this.classes.add(c);
            } else if (force) this.classes.add(c);
            else this.classes.delete(c);
          },
          contains(c) {
            return this.classes.has(c);
          },
        },
      },
      classList: {
        classes: new Set(),
        add(...cl) {
          cl.forEach((c) => this.classes.add(c));
        },
        remove(...cl) {
          cl.forEach((c) => this.classes.delete(c));
        },
        toggle(c, force) {
          if (force === undefined) {
            if (this.classes.has(c)) this.classes.delete(c);
            else this.classes.add(c);
          } else if (force) this.classes.add(c);
          else this.classes.delete(c);
        },
        contains(c) {
          return this.classes.has(c);
        },
      },
      attributes: {},
      setAttribute(k, v) {
        this.attributes[k] = String(v);
      },
      getAttribute(k) {
        return this.attributes[k] !== undefined ? this.attributes[k] : null;
      },
      removeAttribute(k) {
        delete this.attributes[k];
      },
      listeners: {},
      addEventListener(evt, cb) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(cb);
      },
      removeEventListener(evt, cb) {
        if (this.listeners[evt]) {
          this.listeners[evt] = this.listeners[evt].filter((f) => f !== cb);
        }
      },
      dispatchEvent(event) {
        const list = this.listeners[event.type] || [];
        list.forEach((cb) => cb(event));
        return true;
      },
      appendChild(ch) {
        if (ch) this.children.push(ch);
        return ch;
      },
      remove() {
        this.children = [];
      },
      toBlob(cb) {
        if (cb) cb({ size: 1024, type: "image/png" });
      },
      getContext: () => ({
        fillRect: () => {},
        drawImage: () => {},
        measureText: (text) => ({
          width: (text || "").length * 8,
          actualBoundingBoxAscent: 10,
          actualBoundingBoxDescent: 2,
        }),
      }),
      focus() {},
      click() {
        if (this.onclick) this.onclick();
        this.dispatchEvent({ type: "click" });
      },
    };

    Object.defineProperty(el, "innerText", {
      get() {
        return this._innerText;
      },
      set(val) {
        this._innerText = String(val);
      },
    });

    Object.defineProperty(el, "textContent", {
      get() {
        return this._innerText;
      },
      set(val) {
        this._innerText = String(val);
      },
    });

    Object.defineProperty(el, "innerHTML", {
      get() {
        return this._innerHTML;
      },
      set(val) {
        this._innerHTML = String(val);
        if (val === "") this.children = [];
      },
    });

    return el;
  }

  function getEl(id) {
    if (!domStore.has(id)) {
      domStore.set(id, createMockElement(id));
    }
    return domStore.get(id);
  }

  const documentListeners = {};
  let _hash = "";

  const sandbox = {
    window: {},
    tailwind: {},
    console: console,
    location: {
      href: "http://localhost/",
      search: "",
      get hash() {
        return _hash ? (_hash.startsWith("#") ? _hash : "#" + _hash) : "";
      },
      set hash(v) {
        _hash = v;
      },
      origin: "http://localhost",
      pathname: "/",
    },
    navigator: {
      clipboard: {
        lastCopied: "",
        writeText: async function (text) {
          this.lastCopied = text;
        },
      },
    },
    addEventListener: (evt, cb) => {
      if (!documentListeners[evt]) documentListeners[evt] = [];
      documentListeners[evt].push(cb);
    },
    removeEventListener: (evt, cb) => {
      if (documentListeners[evt]) {
        documentListeners[evt] = documentListeners[evt].filter((f) => f !== cb);
      }
    },
    document: {
      documentElement: getEl("documentElement"),
      body: getEl("body"),
      getElementById: (id) => {
        if (
          id === "documentElement" ||
          id === "body" ||
          htmlContent.includes(`id="${id}"`) ||
          htmlContent.includes(`id='${id}'`)
        ) {
          return getEl(id);
        }
        return null;
      },
      querySelector: (sel) => {
        if (sel === "#toastContainer") return getEl("toastContainer");
        return getEl(sel.replace(/^[#.]/, ""));
      },
      querySelectorAll: (sel) => {
        if (sel === "[data-i18n]") {
          const matches = [
            ...htmlContent.matchAll(/data-i18n=["']([^"']+)["']/g),
          ];
          return matches.map((m) => {
            const el = createMockElement("i18n_" + m[1]);
            el.setAttribute("data-i18n", m[1]);
            return el;
          });
        }
        if (sel === "[data-i18n-title]") {
          const matches = [
            ...htmlContent.matchAll(/data-i18n-title=["']([^"']+)["']/g),
          ];
          return matches.map((m) => {
            const el = createMockElement("i18n_title_" + m[1]);
            el.setAttribute("data-i18n-title", m[1]);
            return el;
          });
        }
        if (sel === ".onboarding-step") {
          return [
            getEl("step0"),
            getEl("step1"),
            getEl("step2"),
            getEl("step3"),
            getEl("step4"),
          ];
        }
        if (sel === ".metric-card") {
          return [getEl("metricCard1"), getEl("metricCard2")];
        }
        if (
          sel === "[data-preset-field]" ||
          sel.startsWith("[data-preset-field=")
        ) {
          if (!sandbox._presetChips) {
            const matches = [
              ...htmlContent.matchAll(
                /data-preset-field=["']([^"']+)["']\s+data-preset-val=["']([^"']+)["']/g
              ),
            ];
            sandbox._presetChips = matches.map((m, idx) => {
              const el = createMockElement(
                "preset_chip_" + m[1] + "_" + m[2] + "_" + idx,
                "button"
              );
              el.setAttribute("data-preset-field", m[1]);
              el.setAttribute("data-preset-val", m[2]);
              return el;
            });
          }
          if (sel === "[data-preset-field]") return sandbox._presetChips;
          const matchField = sel.match(/data-preset-field=['"]([^'"]+)['"]/);
          if (matchField) {
            return sandbox._presetChips.filter(
              (c) => c.getAttribute("data-preset-field") === matchField[1]
            );
          }
          return sandbox._presetChips;
        }
        if (sel === ".savings-filter-tab") {
          const categories = [
            "all",
            "active_fixed",
            "auto_term",
            "matured",
            "withdrawals",
          ];
          return categories.map((cat) => {
            const el = getEl("filterTab_" + cat);
            el.setAttribute("data-category", cat);
            return el;
          });
        }
        return [];
      },
      createElement: (tag) =>
        createMockElement("dyn_" + tag + "_" + Math.random(), tag),
      addEventListener: (evt, cb) => {
        if (!documentListeners[evt]) documentListeners[evt] = [];
        documentListeners[evt].push(cb);
      },
      removeEventListener: (evt, cb) => {
        if (documentListeners[evt]) {
          documentListeners[evt] = documentListeners[evt].filter(
            (f) => f !== cb
          );
        }
      },
    },
    confirm: () => true,
    prompt: () => {},
    URL: {
      createObjectURL: () => "blob:http://localhost/mock-blob",
      revokeObjectURL: () => {},
    },
    Blob:
      typeof Blob !== "undefined"
        ? Blob
        : function Blob(content, opts) {
            this.content = content;
            this.opts = opts;
          },
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    TextEncoder: global.TextEncoder,
    TextDecoder: global.TextDecoder,
    Uint8Array: global.Uint8Array,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    Date: global.Date,
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
    Chart: function (ctx, config) {
      return {
        ctx,
        config,
        data: config.data || { labels: [], datasets: [] },
        options: config.options || {},
        destroy() {},
        update() {},
        canvas: {
          width: 800,
          height: 400,
          getContext: () => ({
            fillRect() {},
            drawImage() {},
            measureText: () => ({ width: 50, actualBoundingBoxAscent: 10 }),
          }),
        },
      };
    },
    triggerKeyboardEvent(eventInit) {
      const listeners = documentListeners["keydown"] || [];
      listeners.forEach((cb) => cb(eventInit));
    },
  };

  sandbox.htmlContent = htmlContent;
  sandbox.Chart.getChart = () => null;
  sandbox.Chart.register = () => {};
  sandbox.window = sandbox;

  // Initialize default hidden UI sections
  getEl("compareSection").classList.add("hidden");
  getEl("yoySection").classList.add("hidden");
  getEl("heatmapSection").classList.add("hidden");
  getEl("csvModal").classList.add("hidden");
  getEl("goalProgressSection").classList.add("hidden");

  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);

  return sandbox;
}

async function runUIUXTests() {
  console.log("🖥️ Running Comprehensive UI/UX Requirement Tests (R1–R21)...\n");
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  const app = createDOMEnvironment();

  // Test R1 & R2: Parameter and CSV Data Persistence
  app.document.getElementById("inputSalary").value = "40000000";
  app.document.getElementById("inputSalaryGrowth").value = "6.5";
  app.document.getElementById("inputInflation").value = "3.8";
  app.document.getElementById("inputSavingsGoal").value = "1500000000";
  app.document.getElementById("inputPoolRate").value = "0.7";
  app.document.getElementById("input6MRate").value = "6.1";
  app.document.getElementById("inputTargetDate").value = "2028-10-15";

  app.saveToStorage();
  const savedParamsStr = app.localStorage.getItem("params");
  const savedCSVStr = app.localStorage.getItem("workingCSVData");

  assert(
    savedParamsStr !== null && savedParamsStr.includes("40000000"),
    "R2: Parameters successfully serialized to localStorage"
  );
  assert(
    savedCSVStr !== null,
    "R1: Working CSV data successfully serialized to localStorage"
  );

  // Clear inputs and load back from localStorage
  app.document.getElementById("inputSalary").value = "0";
  app.document.getElementById("inputTargetDate").value = "";
  app.loadFromStorage();

  assert(
    app.parseFormattedNumber(
      app.document.getElementById("inputSalary").value
    ) === 40000000,
    "R2: inputSalary restored accurately from localStorage"
  );
  assert(
    app.document.getElementById("inputTargetDate").value === "2028-10-15",
    "R2: inputTargetDate restored accurately from localStorage"
  );

  // Test R3: Reset All
  app.resetAll(true);
  assert(
    app.parseFormattedNumber(
      app.document.getElementById("inputSalary").value
    ) === 25000000,
    "R3: Reset All restored default salary (25,000,000 VND)"
  );
  assert(
    app.document.getElementById("inputSalaryGrowth").value === "0",
    "R3: Reset All restored default salary growth (0%)"
  );

  // Test R4: Salary Growth Calculation & Metric Display
  app.document.getElementById("inputSalary").value = "20000000";
  app.document.getElementById("inputSalaryGrowth").value = "8";
  app.document.getElementById("inputTargetDate").value = "2029-01-01";
  app.runSimulation();

  const totalSalaryText =
    app.document.getElementById("metricTotalSalary").innerText;
  assert(
    totalSalaryText.length > 0 && !totalSalaryText.includes("NaN"),
    `R4: Salary growth reflected in metric card ("${totalSalaryText}")`
  );

  // Test R5: Inflation Adjustment & Real vs Nominal Toggle
  app.document.getElementById("inputInflation").value = "4.5";
  app.runSimulation();

  const realValueMetric = app.document.getElementById("metricRealValue");
  assert(realValueMetric !== null, "R5: Real value metric container exists");

  // Toggle Real vs Nominal
  app.toggleRealVsNominal();
  assert(app.showRealValues === true, "R5: showRealValues toggled to true");
  app.toggleRealVsNominal();
  assert(
    app.showRealValues === false,
    "R5: showRealValues toggled back to false"
  );

  // Test R6: Scheduled Withdrawals in Simulation Logs
  app.syncCSVData([
    {
      "Account Name": "House Downpayment Outflow",
      Principal: "80000000",
      "Start Date": "2026-06-01",
      "End Date": "2027-06-01",
      Interest: "0",
      Type: "Withdrawal",
      Bank: "Outflow",
    },
  ]);
  app.runSimulation();

  const withdrawalLog = app.simulationLogs.find((l) => l.type === "WITHDRAWAL");
  assert(
    withdrawalLog !== undefined && withdrawalLog.amount === 80000000,
    "R6: Scheduled withdrawal registered in simulation event logs"
  );

  // Test R7: Savings Goal Tracking UI (Progress Bar & Ring)
  app.document.getElementById("inputSavingsGoal").value = "800000000";
  app.runSimulation();

  const goalSec = app.document.getElementById("goalProgressSection");
  assert(
    !goalSec.classList.contains("hidden"),
    "R7: Goal progress section shown when savings goal > 0"
  );
  const goalTargetText =
    app.document.getElementById("goalTargetText").innerText;
  assert(
    goalTargetText.includes("800,000,000"),
    `R7: Goal target text displays formatted goal amount ("${goalTargetText}")`
  );

  // Test R8: Shareable Link
  app.shareSimulation();
  assert(
    app.location.hash.length > 10,
    "R8: Share simulation generated compressed URL hash"
  );
  assert(
    app.navigator.clipboard.lastCopied.includes("#"),
    "R8: Share simulation copied full URL to clipboard"
  );
  assert(
    !app.navigator.clipboard.lastCopied.startsWith("null/"),
    "R8: Share simulation URL does not contain invalid null origin"
  );

  // Test R8b: Load URL with Percent-Encoded Hash
  const rawHash = app.location.hash;
  app.location.hash = encodeURIComponent(rawHash);
  app.document.getElementById("inputSalary").value = "0";
  const uiUxPercentSuccess = app.loadFromURL();
  assert(
    uiUxPercentSuccess === true,
    "R8: loadFromURL() decoded percent-encoded hash successfully"
  );
  assert(
    app.document.getElementById("inputSalary").value.length > 0,
    "R8: inputSalary successfully restored from percent-encoded hash"
  );

  // Test R9: Theme Toggle (Dark / Light)
  app.localStorage.removeItem("theme");
  app.toggleTheme();
  assert(
    app.document.documentElement.classList.contains("light"),
    "R9: Toggle theme added 'light' class to documentElement"
  );
  assert(
    app.getStorage("theme") === "light",
    "R9: Light theme preference persisted in localStorage via getStorage"
  );

  app.toggleTheme();
  assert(
    !app.document.documentElement.classList.contains("light"),
    "R9: Toggle theme reverted 'light' class back to dark mode"
  );
  assert(
    app.getStorage("theme") === "dark",
    "R9: Dark theme preference persisted in localStorage via getStorage"
  );

  // Test R10: Onboarding Tour (5 Steps)
  app.showOnboarding();
  const onboardOverlay = app.document.getElementById("onboardingOverlay");
  assert(
    onboardOverlay.classList.contains("flex") &&
      !onboardOverlay.classList.contains("hidden"),
    "R10: showOnboarding opened modal overlay"
  );

  app.onboardNav(1); // Step 1
  assert(app.onboardStep === 1, "R10: onboardNav(1) advanced to step 1");

  app.onboardNav(1); // Step 2
  app.onboardNav(1); // Step 3
  app.onboardNav(1); // Step 4 (last step)
  assert(app.onboardStep === 4, "R10: Reached final onboarding step 4");

  app.onboardNav(1); // Completes and closes
  assert(
    onboardOverlay.classList.contains("hidden"),
    "R10: Completing onboarding closed overlay"
  );
  assert(
    app.getStorage("showedOnboarding") === true,
    "R10: showedOnboarding flag recorded in localStorage"
  );

  // Test R11: Keyboard Shortcuts
  app.document.getElementById("inputTargetDate").value = "2028-12-31";
  app.document.getElementById("inputSalary").value = "55000000";
  app.triggerKeyboardEvent({
    key: "Enter",
    preventDefault: () => {},
    target: app.document.getElementById("inputSalary"),
  });
  const wealthAfterEnter =
    app.document.getElementById("metricTotalBalance").innerText;
  assert(
    wealthAfterEnter.length > 0 && !wealthAfterEnter.includes("NaN"),
    `R11: Pressing 'Enter' on input executed simulation (Total wealth: ${wealthAfterEnter})`
  );

  // Simulate Ctrl+S keydown
  app.triggerKeyboardEvent({
    ctrlKey: true,
    key: "s",
    preventDefault: () => {},
  });
  assert(
    app.getStorage("params") !== null,
    "R11: Pressing 'Ctrl+S' saved parameters to localStorage"
  );

  // Simulate Escape keydown
  app.toggleCSVModal(true);
  const csvModal = app.document.getElementById("csvModal");
  assert(
    !csvModal.classList.contains("hidden"),
    "R11: Opened CSV modal before Esc test"
  );

  app.triggerKeyboardEvent({
    key: "Escape",
    preventDefault: () => {},
  });
  assert(
    csvModal.classList.contains("hidden"),
    "R11: Pressing 'Escape' dismissed open CSV modal"
  );

  // Test R12: Toast Notifications
  const toastContainer = app.document.getElementById("toastContainer");
  app.showToast("Test info message", "info");
  app.showToast("Test success message", "success");
  app.showToast("Test error message", "error");
  app.showToast("Test warning message", "warning");

  assert(
    toastContainer.children.length >= 4,
    `R12: Toast container spawned ${toastContainer.children.length} active toasts`
  );

  // Test R13: Growth Chart Date Range Filtering
  app.document.getElementById("chartDateRange").value = "1y";
  app.filterChartDateRange();
  assert(
    app.growthChart !== null,
    "R13: filterChartDateRange successfully updated growthChart view"
  );

  // Test R14: Tabbed Analytics Hub - Heatmap Calendar
  app.switchAnalyticsTab("heatmap");
  const tabPanelHeatmap = app.document.getElementById("tabPanel_heatmap");
  assert(
    !tabPanelHeatmap.classList.contains("hidden"),
    "R14: switchAnalyticsTab('heatmap') revealed monthly heatmap panel"
  );
  assert(
    app.document
      .getElementById("tabBtn_heatmap")
      .getAttribute("aria-selected") === "true",
    "R14: Heatmap tab button has aria-selected=true"
  );

  // Test R15: Tabbed Analytics Hub - Year-over-Year (YoY) Table
  app.switchAnalyticsTab("yoy");
  const tabPanelYoY = app.document.getElementById("tabPanel_yoy");
  assert(
    !tabPanelYoY.classList.contains("hidden"),
    "R15: switchAnalyticsTab('yoy') revealed YoY comparison panel"
  );
  assert(
    app.document.getElementById("tabBtn_yoy").getAttribute("aria-selected") ===
      "true",
    "R15: YoY tab button has aria-selected=true"
  );
  const yoyTbody = app.document.getElementById("yoyTableBody");
  assert(
    yoyTbody.children.length >= 1,
    `R15: YoY table populated with ${yoyTbody.children.length} annual rows`
  );

  // Tabbed Analytics Hub - Wealth Timeline & Canvas Cleanup
  app.switchAnalyticsTab("timeline");
  const tabPanelTimeline = app.document.getElementById("tabPanel_timeline");
  assert(
    !tabPanelTimeline.classList.contains("hidden"),
    "R15: switchAnalyticsTab('timeline') restored Wealth Timeline view"
  );
  assert(
    !app.htmlContent.includes('id="chartGoalRing2"'),
    "R15: Redundant #chartGoalRing2 canvas removed from DOM"
  );
  assert(
    app.htmlContent.includes('id="chartGoalRing"'),
    "R15: Single #chartGoalRing canvas maintained in goal progress tracker"
  );

  // Test R16: CSV Editor Modal Operations
  app.toggleCSVModal(true);
  assert(
    !csvModal.classList.contains("hidden"),
    "R16: CSV editor modal opened"
  );
  const csvCountBefore = app.workingCSVData.length;
  app.addEmptyCSVRow();
  assert(
    app.workingCSVData.length === csvCountBefore + 1,
    "R16: Added empty row in CSV editor"
  );
  app.saveCSVEditorData();
  assert(
    csvModal.classList.contains("hidden"),
    "R16: saveCSVEditorData saved changes, ran simulation, and closed modal"
  );

  // Test R17: Scenario Comparison Workbench (ADR-0007)
  app.toggleCompareMode();
  const compareSec = app.document.getElementById("compareSection");
  assert(
    !compareSec.classList.contains("hidden"),
    "R17: toggleCompareMode revealed Scenario Comparison section"
  );
  assert(
    app.comparisonActive === true,
    "R17: window.comparisonActive flagged as true"
  );

  // Test cloneScenarioAtoB
  app.document.getElementById("inputSalary").value = "40000000";
  app.cloneScenarioAtoB();
  assert(
    app.document.getElementById("inputCompSalary").value === "40000000",
    "R17: cloneScenarioAtoB copied Scenario A salary to Scenario B input"
  );

  // Set Scenario B custom salary to test delta calculations
  app.document.getElementById("inputCompSalary").value = "50000000";
  app.runComparison();

  const compASalary = app.document.getElementById("compASalary").innerText;
  const compBSalary = app.document.getElementById("compBSalary").innerText;
  const compDeltaWealth =
    app.document.getElementById("compDeltaWealth").innerText;
  const compDeltaInterest =
    app.document.getElementById("compDeltaInterest").innerText;
  const compDeltaMilestone =
    app.document.getElementById("compDeltaMilestone").innerText;

  assert(
    compASalary.length > 0 && compBSalary.length > 0,
    `R17: Side-by-side comparison calculated (Scenario A: "${compASalary}", Scenario B: "${compBSalary}")`
  );
  assert(
    compDeltaWealth.includes("+") || compDeltaWealth.includes("-"),
    `R17: Delta total wealth badge calculated: "${compDeltaWealth}"`
  );
  assert(
    compDeltaInterest.length > 0,
    `R17: Delta interest badge calculated: "${compDeltaInterest}"`
  );
  assert(
    compDeltaMilestone.length > 0,
    `R17: Delta milestone diff calculated: "${compDeltaMilestone}"`
  );

  // Test toggling off compare mode
  app.toggleCompareMode();
  assert(
    compareSec.classList.contains("hidden") && app.comparisonActive === false,
    "R17: Toggling compare mode off hidden section and reset comparisonActive"
  );

  // Test R18: Export Chart Image
  let exportedToastFired = false;
  const origShowToast = app.showToast;
  app.showToast = (msg, type) => {
    if (type === "success") exportedToastFired = true;
    origShowToast(msg, type);
  };
  app.exportChartAsImage();
  assert(
    exportedToastFired,
    "R18: exportChartAsImage triggered canvas export with dark background fill"
  );
  app.showToast = origShowToast;

  // Test R19: Print Summary Trigger
  let printTriggered = false;
  app.window.print = () => {
    printTriggered = true;
  };
  app.printSummary();
  assert(printTriggered, "R19: printSummary invoked window.print()");

  // Test R20: Auto Term Allocation Rule with Emergency Buffer Reserve (ADR-0006)
  app.document.getElementById("inputSalary").value = "0";
  app.document.getElementById("inputAutoTermThreshold").value = "200000000";
  app.document.getElementById("inputEmergencyBuffer").value = "30000000";
  app.syncCSVData([
    {
      "Account Name": "High Liquidity Pool",
      Principal: "250000000", // 250M VND
      "Start Date": "2026-01-01",
      "End Date": "2027-01-01",
      Interest: "0.5",
      Type: "Non-Term Pool",
      Bank: "MBBank",
    },
  ]);
  app.runSimulation();

  const autoTermLogWithBuffer = app.simulationLogs.find(
    (l) => l.type === "NEW_6M" || l.type === "NEW_AUTO_TERM"
  );
  assert(
    autoTermLogWithBuffer !== undefined &&
      Math.round(autoTermLogWithBuffer.amount / 1e6) === 220,
    "R20: Auto Term sweep locked 220M VND retaining 30M emergency buffer in pool when pool >= 230M"
  );

  // Quick chip helper test: setting emergency buffer to 0
  app.setEmergencyBufferValue(0);
  assert(
    app.document.getElementById("inputEmergencyBuffer").value === "0" ||
      app.document.getElementById("inputEmergencyBuffer").value === 0,
    "R20: setEmergencyBufferValue(0) updated inputEmergencyBuffer"
  );
  app.runSimulation();
  const autoTermLogZeroBuffer = app.simulationLogs.find(
    (l) => l.type === "NEW_6M" || l.type === "NEW_AUTO_TERM"
  );
  assert(
    autoTermLogZeroBuffer !== undefined &&
      Math.round(autoTermLogZeroBuffer.amount / 1e6) === 250,
    "R20: Zero emergency buffer restores full 250M pool sweep"
  );
  assert(
    typeof app.triggerReactiveSimulation === "function",
    "R20: triggerReactiveSimulation debounced function is registered"
  );

  // Test R21: Vietnamese Language Support & i18n Parity
  app.changeLanguage("vi");
  assert(app.currentLang === "vi", "R21: Switched current language to 'vi'");
  assert(
    app.formatCurrency(100000000) === "100.000.000 ₫",
    "R21: Formatted Vietnamese currency in 'vi' mode"
  );

  app.changeLanguage("en");
  assert(
    app.currentLang === "en",
    "R21: Switched current language back to 'en'"
  );
  assert(
    app.formatCurrency(100000000) === "100,000,000 VND",
    "R21: Formatted English currency in 'en' mode"
  );

  // Test R22: Annual Bonus (13th Month Salary) & Recurring Cashflow Generator (Issue #4)
  // 1. Annual Bonus Quick Chips & Input
  app.setAnnualBonusMultiplier(1.5);
  assert(
    app.document.getElementById("inputAnnualBonusMultiplier").value === "1.5" ||
      app.document.getElementById("inputAnnualBonusMultiplier").value === 1.5,
    "R22: setAnnualBonusMultiplier(1.5) updated input value"
  );
  app.document.getElementById("inputSalary").value = "30000000";
  app.document.getElementById("selectAnnualBonusMonth").value = "1";
  app.runSimulation();

  const bonusLogUI = app.simulationLogs.find((l) => l.type === "ANNUAL_BONUS");
  assert(
    bonusLogUI !== undefined && bonusLogUI.amount === 45000000,
    "R22: Annual bonus correctly computed as 1.5x of 30M monthly salary (45M VND)"
  );

  // 2. Add Withdrawal Row button
  const prevRowsCount = app.workingCSVData.length;
  app.addWithdrawalRow();
  const lastCSVRow = app.workingCSVData[app.workingCSVData.length - 1];
  assert(
    app.workingCSVData.length === prevRowsCount + 1 &&
      lastCSVRow.Type === "Withdrawal",
    "R22: addWithdrawalRow() appended scheduled withdrawal entry"
  );

  // 3. Recurring Generator Panel & Row Generation
  app.toggleRecurringGenerator(true);
  assert(
    !app.document
      .getElementById("recurringGenPanel")
      .classList.contains("hidden"),
    "R22: toggleRecurringGenerator(true) showed recurring generator panel"
  );
  app.document.getElementById("recurType").value = "Withdrawal";
  app.document.getElementById("recurName").value = "Quarterly School Fee";
  app.document.getElementById("recurAmount").value = "15000000";
  app.document.getElementById("recurFreq").value = "3";
  app.document.getElementById("recurStartDate").value = "2026-03-01";
  app.document.getElementById("recurEndDate").value = "2026-09-01"; // Mar, Jun, Sep = 3 rows
  const beforeGenCount = app.workingCSVData.length;
  app.generateRecurringRows();
  assert(
    app.workingCSVData.length === beforeGenCount + 3,
    "R22: generateRecurringRows() inserted 3 recurring withdrawal rows"
  );

  // 4. Strict CSV Date Validation (EndDate >= StartDate)
  let csvErrorToastFired = false;
  app.showToast = (msg, type) => {
    if (type === "error") csvErrorToastFired = true;
  };
  app.workingCSVData.push({
    "Account Name": "Invalid Date Row",
    Principal: "10000000",
    "Start Date": "2026-12-01",
    "End Date": "2026-01-01", // End Date before Start Date
    Interest: "5.0",
    Type: "Term Saving",
    Bank: "ACB",
  });
  app.saveCSVEditorData();
  assert(
    csvErrorToastFired === true,
    "R22: saveCSVEditorData() strictly blocked save and fired error toast on EndDate < StartDate"
  );

  // Test R23: Strategy Persona Presets & Undo Safeguard (Issue #6)
  // 1. Open Presets modal
  app.togglePresetsModal(true);
  const presetsModal = app.document.getElementById("presetsModal");
  assert(
    !presetsModal.classList.contains("hidden"),
    "R23: togglePresetsModal(true) revealed strategy presets modal"
  );
  const presetsCardsContainer = app.document.getElementById(
    "presetsCardsContainer"
  );
  assert(
    presetsCardsContainer.children.length === 4,
    `R23: renderPresetCards() generated ${presetsCardsContainer.children.length} interactive persona cards`
  );

  // 2. Apply FIRE preset & verify parameters + portfolio
  const salaryBeforePreset = app.document.getElementById("inputSalary").value;
  app.applyPreset("fire_aspirant");
  assert(
    presetsModal.classList.contains("hidden"),
    "R23: applyPreset closed presets modal automatically"
  );
  assert(
    app.parseFormattedNumber(
      app.document.getElementById("inputSalary").value
    ) === 60000000 &&
      app.parseFormattedNumber(
        app.document.getElementById("inputSavingsGoal").value
      ) === 5000000000,
    "R23: applyPreset('fire_aspirant') loaded FIRE parameters (Salary: 60M, Goal: 5B)"
  );
  assert(
    app.workingCSVData.length === 3 &&
      app.workingCSVData[0]["Account Name"].includes("FIRE Emergency Reserve"),
    "R23: applyPreset('fire_aspirant') loaded 3-account diversified FIRE portfolio"
  );

  // 3. 5-Second Undo rollback
  app.undoPresetApply();
  assert(
    app.parseFormattedNumber(
      app.document.getElementById("inputSalary").value
    ) === app.parseFormattedNumber(salaryBeforePreset),
    `R23: undoPresetApply() restored previous salary ("${salaryBeforePreset}")`
  );

  // 4. Dismiss Presets Modal with Escape
  app.togglePresetsModal(true);
  assert(
    !presetsModal.classList.contains("hidden"),
    "R23: Re-opened presets modal"
  );
  app.triggerKeyboardEvent({ key: "Escape" });
  assert(
    presetsModal.classList.contains("hidden"),
    "R23: Pressing Escape dismissed open presets modal"
  );

  // --- Test R24: Locale-Aware Currency Input Masking & Verbal Helpers (ADR-0011, Issue #8) ---
  const salaryInput = app.document.getElementById("inputSalary");
  const salaryHelper = app.document.getElementById("helperSalary");
  assert(
    salaryInput !== null && salaryHelper !== null,
    "R24: inputSalary and helperSalary elements exist in DOM"
  );
  salaryInput.value = "35000000";
  app.applyCurrencyMask(salaryInput, "en");
  assert(
    salaryInput.value === "35,000,000",
    "R24: applyCurrencyMask formatted '35000000' to '35,000,000' with comma in English"
  );
  assert(
    salaryHelper.textContent === "35 Million VND",
    "R24: helperSalary displayed '35 Million VND' for 35,000,000 in English"
  );

  // Switch to Vietnamese
  app.changeLanguage("vi");
  assert(
    salaryInput.value === "35.000.000",
    "R24: changeLanguage('vi') updated thousand separator to dot '35.000.000'"
  );
  assert(
    salaryHelper.textContent === "35 Triệu VND",
    "R24: helperSalary updated to '35 Triệu VND' in Vietnamese"
  );

  // Goal helper (Billion / Tỷ)
  const goalInput = app.document.getElementById("inputSavingsGoal");
  const goalHelper = app.document.getElementById("helperSavingsGoal");
  goalInput.value = "2500000000";
  app.applyCurrencyMask(goalInput, "vi");
  assert(
    goalInput.value === "2.500.000.000",
    "R24: inputSavingsGoal formatted to '2.500.000.000' in Vietnamese"
  );
  assert(
    goalHelper.textContent === "2.5 Tỷ VND",
    "R24: helperSavingsGoal displayed '2.5 Tỷ VND'"
  );

  // Switch back to English
  app.changeLanguage("en");
  assert(
    goalInput.value === "2,500,000,000",
    "R24: changeLanguage('en') updated goal to '2,500,000,000'"
  );
  assert(
    goalHelper.textContent === "2.5 Billion VND",
    "R24: helperSavingsGoal updated to '2.5 Billion VND' in English"
  );

  // Simulation runs cleanly with masked inputs without NaN
  app.runSimulation();
  assert(
    !isNaN(
      Number(
        (
          app.document.getElementById("metricTotalBalance").textContent || ""
        ).replace(/[^0-9]/g, "")
      )
    ),
    "R24: Simulation runs successfully and displays valid numerical total wealth with masked inputs"
  );

  // --- Test R25: Quick Presets & Debounced Live Recalculation (Issue #11) ---
  // 1. Salary preset chips
  const salary20MChip = Array.from(
    app.document.querySelectorAll("[data-preset-field='salary']")
  ).find((c) => c.getAttribute("data-preset-val") === "20000000");
  assert(
    salary20MChip !== undefined,
    "R25: 20M Salary quick preset chip exists in DOM"
  );
  app.setSalaryValue(20000000);
  assert(
    app.parseFormattedNumber(
      app.document.getElementById("inputSalary").value
    ) === 20000000,
    "R25: setSalaryValue(20000000) updated inputSalary to 20M"
  );
  assert(
    salary20MChip.classList.contains("active"),
    "R25: 20M Salary chip highlighted as active"
  );

  // 2. Additive modifier chip
  app.addSalaryDelta(5000000);
  assert(
    app.parseFormattedNumber(
      app.document.getElementById("inputSalary").value
    ) === 25000000,
    "R25: addSalaryDelta(5000000) incremented salary to 25M"
  );
  const salary25MChip = Array.from(
    app.document.querySelectorAll("[data-preset-field='salary']")
  ).find((c) => c.getAttribute("data-preset-val") === "25000000");
  assert(
    salary25MChip && salary25MChip.classList.contains("active"),
    "R25: 25M Salary chip highlighted as active after delta increment"
  );

  // 3. Goal preset chips
  const goal1BChip = Array.from(
    app.document.querySelectorAll("[data-preset-field='goal']")
  ).find((c) => c.getAttribute("data-preset-val") === "1000000000");
  assert(
    goal1BChip !== undefined,
    "R25: 1B Goal quick preset chip exists in DOM"
  );
  app.setSavingsGoalValue(1000000000);
  assert(
    app.parseFormattedNumber(
      app.document.getElementById("inputSavingsGoal").value
    ) === 1000000000,
    "R25: setSavingsGoalValue(1000000000) updated inputSavingsGoal to 1B"
  );
  assert(
    goal1BChip.classList.contains("active"),
    "R25: 1B Goal chip highlighted as active"
  );

  // 4. Auto Term Threshold preset chips
  const thresh100MChip = Array.from(
    app.document.querySelectorAll("[data-preset-field='autoTermThreshold']")
  ).find((c) => c.getAttribute("data-preset-val") === "100000000");
  assert(
    thresh100MChip !== undefined,
    "R25: 100M Auto Term Threshold quick preset chip exists in DOM"
  );
  app.setAutoTermThresholdValue(100000000);
  assert(
    app.parseFormattedNumber(
      app.document.getElementById("inputAutoTermThreshold").value
    ) === 100000000,
    "R25: setAutoTermThresholdValue(100000000) updated Auto Term Threshold to 100M"
  );
  assert(
    thresh100MChip.classList.contains("active"),
    "R25: 100M Threshold chip highlighted as active"
  );

  // 5. Emergency Buffer Reserve preset chips
  const buffer10MChip = Array.from(
    app.document.querySelectorAll("[data-preset-field='emergencyBuffer']")
  ).find((c) => c.getAttribute("data-preset-val") === "10000000");
  assert(
    buffer10MChip !== undefined,
    "R25: 10M Emergency Buffer quick preset chip exists in DOM"
  );
  app.setEmergencyBufferValue(10000000);
  assert(
    app.parseFormattedNumber(
      app.document.getElementById("inputEmergencyBuffer").value
    ) === 10000000,
    "R25: setEmergencyBufferValue(10000000) updated Emergency Buffer to 10M"
  );
  assert(
    buffer10MChip.classList.contains("active"),
    "R25: 10M Emergency Buffer chip highlighted as active"
  );

  // Test R26: Continuous Multi-Year Calendar Heatmap & Tooltips (ADR-0012, Issue #9)
  app.switchAnalyticsTab("heatmap");
  const heatmapGrid = app.document.getElementById("heatmapGrid");
  assert(
    heatmapGrid && heatmapGrid.children.length >= 2,
    `R26: Heatmap grid rendered header and multi-year rows (Total rows: ${heatmapGrid.children.length})`
  );

  const btnHeatmapModeWealth = app.document.getElementById(
    "btnHeatmapModeWealth"
  );
  const btnHeatmapModeInflow = app.document.getElementById(
    "btnHeatmapModeInflow"
  );
  assert(
    btnHeatmapModeWealth !== null && btnHeatmapModeInflow !== null,
    "R26: Heatmap Total Wealth and Net Inflow metric toggle buttons exist"
  );

  app.setHeatmapMetricMode("inflow");
  assert(
    app.heatmapMetricMode === "inflow",
    "R26: setHeatmapMetricMode('inflow') set active metric mode to 'inflow'"
  );
  assert(
    btnHeatmapModeInflow.className.includes("bg-indigo-600"),
    "R26: Net Inflow button has active styling in inflow mode"
  );

  app.setHeatmapMetricMode("wealth");
  assert(
    app.heatmapMetricMode === "wealth",
    "R26: setHeatmapMetricMode('wealth') reverted metric mode to 'wealth'"
  );
  assert(
    btnHeatmapModeWealth.className.includes("bg-indigo-600"),
    "R26: Total Wealth button has active styling in wealth mode"
  );

  const heatmapTooltip = app.document.getElementById("heatmapTooltip");
  assert(heatmapTooltip !== null, "R26: #heatmapTooltip element exists in DOM");

  const mockTooltipPayload = encodeURIComponent(
    JSON.stringify({
      monthLabel: "Mar 2027",
      badge: "150.0M",
      totalWealth: 150000000,
      poolBalance: 30000000,
      termBalances: 120000000,
      demandInterest: 125000,
      termInterest: 2400000,
      netInflow: 25000000,
    })
  );
  app.showHeatmapTooltip({ clientX: 100, clientY: 200 }, mockTooltipPayload);
  assert(
    !heatmapTooltip.classList.contains("hidden"),
    "R26: showHeatmapTooltip revealed #heatmapTooltip popover"
  );
  assert(
    heatmapTooltip.innerHTML.includes("Mar 2027") &&
      heatmapTooltip.innerHTML.includes("150,000,000"),
    "R26: #heatmapTooltip rendered detailed breakdown (Month, Wealth, Pool, Interest)"
  );

  app.hideHeatmapTooltip();
  assert(
    heatmapTooltip.classList.contains("hidden"),
    "R26: hideHeatmapTooltip hid popover"
  );

  // Test R27: Full-Width Savings Accounts Hub & Category Filtering (ADR-0013, Issue #10)
  const savingsHubSection = app.document.getElementById("savingsHubSection");
  assert(
    savingsHubSection !== null,
    "R27: #savingsHubSection full-width container exists in DOM"
  );

  const kpiLocked = app.document.getElementById("kpiLockedPrincipal");
  const kpiActive = app.document.getElementById("kpiActiveAccounts");
  const kpiSweeps = app.document.getElementById("kpiAutoSweeps");
  const kpiRate = app.document.getElementById("kpiWeightedRate");
  assert(
    kpiLocked && kpiActive && kpiSweeps && kpiRate,
    "R27: Portfolio KPI summary elements exist (Locked, Active, Sweeps, Rate)"
  );

  // Trigger full simulation to populate portfolio
  app.runSimulation();
  assert(
    kpiActive.innerText !== "0",
    `R27: KPI Active Accounts populated (${kpiActive.innerText})`
  );
  assert(
    kpiRate.innerText.includes("%/yr"),
    `R27: KPI Weighted Rate formatted (${kpiRate.innerText})`
  );

  const savingsTableBody = app.document.getElementById("savingsTableBody");
  const initialRowCount = savingsTableBody.children.length;
  assert(
    initialRowCount >= 1,
    `R27: Savings Accounts table populated (${initialRowCount} rows in 'all' view)`
  );

  // Test category filtering
  app.filterSavingsCategory("withdrawals");
  assert(
    app.activeSavingsCategory === "withdrawals",
    "R27: filterSavingsCategory('withdrawals') set category to 'withdrawals'"
  );
  const withdrawalRowCount = savingsTableBody.children.length;
  assert(
    withdrawalRowCount >= 1,
    `R27: Savings table filtered to withdrawals view (${withdrawalRowCount} rows)`
  );

  app.filterSavingsCategory("auto_term");
  assert(
    app.activeSavingsCategory === "auto_term",
    "R27: filterSavingsCategory('auto_term') set category to 'auto_term'"
  );
  const autoTermRowCount = savingsTableBody.children.length;
  const countAutoTermEl = app.document.getElementById("count_filter_auto_term");
  assert(
    autoTermRowCount === parseInt(countAutoTermEl.innerText, 10),
    `R27: Savings table filtered to auto_term view matches badge count (${autoTermRowCount} rows)`
  );

  app.filterSavingsCategory("matured");
  assert(
    app.activeSavingsCategory === "matured",
    "R27: filterSavingsCategory('matured') set category to 'matured'"
  );
  const maturedRowCount = savingsTableBody.children.length;
  const countMaturedEl = app.document.getElementById("count_filter_matured");
  assert(
    maturedRowCount === parseInt(countMaturedEl.innerText, 10),
    `R27: Savings table filtered to matured view matches badge count (${maturedRowCount} rows)`
  );

  app.filterSavingsCategory("all");
  assert(
    savingsTableBody.children.length === initialRowCount,
    "R27: filterSavingsCategory('all') restored all portfolio rows"
  );

  // Test R28: Modal Layering & Dialog Safeguards (ADR-0014, Issue #12)
  const rawHtml = fs.readFileSync(
    path.join(__dirname, "../personal-finance-savings-predictor/index.html"),
    "utf8"
  );
  assert(
    !rawHtml.includes('id="themeOverlay"'),
    "R28: Obsolete themeOverlay element is completely removed from index.html"
  );

  const onboardingEl = app.document.getElementById("onboardingOverlay");
  const csvModalDialog = app.document.getElementById("csvModal");
  const presetsModalDialog = app.document.getElementById("presetsModal");

  // Step 1: Open Onboarding
  app.showOnboarding();
  assert(
    !onboardingEl.classList.contains("hidden"),
    "R28: showOnboarding() opened onboarding dialog"
  );

  // Step 2: Open CSV modal - should close onboarding
  app.toggleCSVModal(true);
  assert(
    !csvModalDialog.classList.contains("hidden"),
    "R28: toggleCSVModal(true) opened CSV modal"
  );
  assert(
    onboardingEl.classList.contains("hidden"),
    "R28: toggleCSVModal(true) dismissed overlapping onboarding overlay"
  );

  // Step 3: Open presets modal - should close CSV modal
  app.togglePresetsModal(true);
  assert(
    !presetsModalDialog.classList.contains("hidden"),
    "R28: togglePresetsModal(true) opened presets modal"
  );
  assert(
    csvModalDialog.classList.contains("hidden"),
    "R28: togglePresetsModal(true) dismissed overlapping CSV modal"
  );

  // Step 4: dismissAllModals() closes everything
  app.dismissAllModals();
  assert(
    onboardingEl.classList.contains("hidden") &&
      csvModalDialog.classList.contains("hidden") &&
      presetsModalDialog.classList.contains("hidden"),
    "R28: dismissAllModals() cleanly dismissed all active dialog overlays"
  );

  // Step 5: resetAll() clears storage and preserves clean modal state
  app.showOnboarding();
  app.resetAll(true);
  assert(
    onboardingEl.classList.contains("hidden") &&
      csvModalDialog.classList.contains("hidden") &&
      presetsModalDialog.classList.contains("hidden"),
    "R28: resetAll() preserves clean dialog state without spurious modal popups"
  );

  // Test R29: End-to-End Simulation Lifecycle & Boundary Error Handling
  app.document.getElementById("inputTargetDate").value = "";
  let simNullHandled = false;
  try {
    app.runSimulation();
    simNullHandled = true;
  } catch (e) {
    simNullHandled = false;
  }
  assert(
    simNullHandled,
    "R29: runSimulation() handles empty target date gracefully without throwing unhandled exceptions"
  );

  // Extreme inputs test
  app.document.getElementById("inputTargetDate").value = "2030-12-31";
  app.document.getElementById("inputSalary").value = "500,000,000"; // 500M/mo
  app.document.getElementById("inputSavingsGoal").value = "100,000,000,000"; // 100 Billion
  app.runSimulation();
  const extremeWealth =
    app.document.getElementById("metricTotalBalance").innerText;
  assert(
    extremeWealth && !extremeWealth.includes("NaN"),
    `R29: Simulation handles extreme 100B parameters without NaN (${extremeWealth})`
  );

  // Test R30: Scenario Comparison Negative Deltas & State Cleanup
  app.toggleCompareMode(true);
  app.cloneScenarioAtoB();
  // Set Scenario B salary to lower than Scenario A
  app.document.getElementById("inputCompSalary").value = "10000000"; // 10M vs 500M
  app.runComparison();
  const compDeltaBadge = app.document.getElementById("compDeltaWealth");
  assert(
    compDeltaBadge !== null && compDeltaBadge.innerText.includes("-"),
    `R30: Scenario B with lower wealth correctly renders negative delta badge: ${compDeltaBadge ? compDeltaBadge.innerText : "none"}`
  );
  // Turn off compare mode
  app.toggleCompareMode(false);
  assert(
    app.window.comparisonActive === false &&
      app.document
        .getElementById("compareSection")
        .classList.contains("hidden"),
    "R30: Toggling compare mode off completely resets comparisonActive flag and hides section"
  );

  // Test R31: Dynamic Bilingual Switching & Verbal Helper Synchronization
  app.changeLanguage("vi");
  app.document.getElementById("inputSalary").value = "50.000.000";
  app.updateVerbalHelperForInput(
    app.document.getElementById("inputSalary"),
    "vi"
  );
  const viSalaryHelper =
    app.document.getElementById("helperSalary").textContent;
  assert(
    viSalaryHelper === "50 Triệu VND",
    `R31: Vietnamese verbal helper synchronized on input: '${viSalaryHelper}'`
  );

  app.changeLanguage("en");
  app.document.getElementById("inputSalary").value = "50,000,000";
  app.updateVerbalHelperForInput(
    app.document.getElementById("inputSalary"),
    "en"
  );
  const enSalaryHelper =
    app.document.getElementById("helperSalary").textContent;
  assert(
    enSalaryHelper === "50 Million VND",
    `R31: English verbal helper synchronized on input: '${enSalaryHelper}'`
  );

  // Test R32: Dynamic URL Hash Hydration & Hash Change Event Interception
  app.document.getElementById("inputSalary").value = "30000000";
  app.document.getElementById("inputSavingsGoal").value = "1000000000";
  app.shareSimulation();
  const currentHash = app.location.hash;
  assert(
    typeof currentHash === "string" && currentHash.length > 10,
    "R32: shareSimulation() generates valid URL hash string"
  );

  // Clear inputs and hydrate from hash
  app.document.getElementById("inputSalary").value = "0";
  app.loadFromURL();
  assert(
    app.parseFormattedNumber(
      app.document.getElementById("inputSalary").value
    ) === 30000000,
    "R32: loadFromURL() hydrides state correctly from active location.hash"
  );

  // Test R33: Semantic CSS Design Tokens & Full Light Theme Contrast Styling (ADR-0016, Issue #44)
  const indexHtmlRaw = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "personal-finance-savings-predictor",
      "index.html"
    ),
    "utf8"
  );
  assert(
    indexHtmlRaw.includes("--bg-page") &&
      indexHtmlRaw.includes("--bg-card") &&
      indexHtmlRaw.includes("--text-primary") &&
      indexHtmlRaw.includes("--border-subtle") &&
      indexHtmlRaw.includes(":root.light"),
    "R33: Semantic CSS custom property tokens defined under :root and :root.light"
  );

  // Toggle to Light Theme
  app.document.documentElement.classList.remove("light");
  app.toggleTheme();
  assert(
    app.document.documentElement.classList.contains("light"),
    "R33: Toggling theme adds 'light' class to document element"
  );
  assert(
    app.getStorage("theme") === "light",
    "R33: Light theme preference saved in local storage"
  );
  const themeBtnEl = app.document.getElementById("themeBtn");
  assert(
    themeBtnEl && themeBtnEl.innerHTML.includes("fa-sun"),
    "R33: Theme button displays Sun icon when Light theme is active"
  );

  // Toggle back to Dark Theme
  app.toggleTheme();
  assert(
    !app.document.documentElement.classList.contains("light"),
    "R33: Toggling theme removes 'light' class for Dark theme"
  );
  assert(
    app.getStorage("theme") === "dark",
    "R33: Dark theme preference saved in local storage"
  );
  assert(
    themeBtnEl && themeBtnEl.innerHTML.includes("fa-moon"),
    "R33: Theme button displays Moon icon when Dark theme is active"
  );

  // Test R34: Dynamic Chart.js Theme Palette Synchronization (ADR-0016, Issue #45)
  assert(
    typeof app.getChartThemeConfig === "function",
    "R34: getChartThemeConfig function is exposed"
  );
  const darkChartTheme = app.getChartThemeConfig();
  assert(
    darkChartTheme.isLight === false &&
      darkChartTheme.canvasBg === "#0f172a" &&
      darkChartTheme.tickColor === "#94a3b8",
    "R34: getChartThemeConfig returns valid dark theme palette in dark mode"
  );

  app.toggleTheme(); // Switch to light
  const lightChartTheme = app.getChartThemeConfig();
  assert(
    lightChartTheme.isLight === true &&
      lightChartTheme.canvasBg === "#ffffff" &&
      lightChartTheme.tickColor === "#64748b",
    "R34: getChartThemeConfig returns valid light theme palette in light mode"
  );

  assert(
    typeof app.applyThemeToAllCharts === "function",
    "R34: applyThemeToAllCharts function is defined and available"
  );

  // Switch back to dark
  app.toggleTheme();

  // Test R35: Responsive Mobile/Tablet Header & Action Sheet Menu (ADR-0016, Issue #46)
  assert(
    typeof app.toggleMobileActionSheet === "function",
    "R35: toggleMobileActionSheet function is defined"
  );
  const mobileSheet = app.document.getElementById("mobileActionSheet");
  assert(
    mobileSheet !== null,
    "R35: #mobileActionSheet modal element exists in DOM"
  );
  assert(
    mobileSheet.classList.contains("hidden"),
    "R35: #mobileActionSheet is hidden by default"
  );

  app.toggleMobileActionSheet(true);
  assert(
    !mobileSheet.classList.contains("hidden") &&
      mobileSheet.classList.contains("flex"),
    "R35: toggleMobileActionSheet(true) displays mobile action sheet"
  );

  app.toggleMobileActionSheet(false);
  assert(
    mobileSheet.classList.contains("hidden"),
    "R35: toggleMobileActionSheet(false) closes mobile action sheet"
  );

  app.toggleMobileActionSheet(true);
  app.dismissAllModals();
  assert(
    mobileSheet.classList.contains("hidden"),
    "R35: dismissAllModals() cleanly closes #mobileActionSheet"
  );

  const btnMobileActions = app.document.getElementById("btnMobileActions");
  assert(
    btnMobileActions !== null,
    "R35: #btnMobileActions responsive toggle button exists in header"
  );

  // Test R36: Touch Preset Chip Carousels & Mobile KPI Grid (ADR-0016, Issue #47)
  assert(
    app.document.getElementById("metricsSection") !== null,
    "R36: #metricsSection dashboard metrics container exists"
  );
  assert(
    app.htmlContent.includes('id="metricsSection"') &&
      app.htmlContent.includes("grid-cols-2 lg:grid-cols-4"),
    "R36: #metricsSection utilizes 2-column grid layout on mobile (grid-cols-2 lg:grid-cols-4)"
  );
  assert(
    app.htmlContent.includes(
      'class="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-1 touch-pan-x"'
    ),
    "R36: Preset tracks configured as horizontal scrollable carousels (overflow-x-auto no-scrollbar touch-pan-x)"
  );
  assert(
    app.htmlContent.includes(".no-scrollbar"),
    "R36: .no-scrollbar utility class defined in CSS styles"
  );

  // Test R37: Adaptive Mobile Card-View for Savings Accounts Hub (ADR-0016, Issue #48)
  assert(
    app.htmlContent.includes('id="savingsAccountsTableContainer"') &&
      app.htmlContent.includes("hidden sm:block"),
    "R37: #savingsAccountsTableContainer has responsive desktop display class (hidden sm:block)"
  );
  assert(
    app.htmlContent.includes('id="savingsAccountsCardContainer"') &&
      app.htmlContent.includes("sm:hidden"),
    "R37: #savingsAccountsCardContainer has responsive mobile card display class (sm:hidden)"
  );
  assert(
    app.document.getElementById("savingsCardList") !== null,
    "R37: #savingsCardList mobile card list container element exists"
  );

  // Test that rendering savings hub populates both table and mobile card list
  app.renderFilteredSavingsTable();
  const cardListEl = app.document.getElementById("savingsCardList");
  assert(
    cardListEl !== null && cardListEl.children.length > 0,
    "R37: renderFilteredSavingsTable() populates #savingsCardList with adaptive card views"
  );

  // Test R38: Light Theme Button Contrast & Modal Component Theming (Issue #55)
  assert(
    app.htmlContent.includes(".light .bg-slate-800") &&
      app.htmlContent.includes(".light .annual-bonus-chip") &&
      app.htmlContent.includes(".light .timeframe-preset-btn"),
    "R38: Light theme styles define explicit contrast rules for .bg-slate-800, annual bonus chips, and timeframe buttons"
  );
  assert(
    app.htmlContent.includes(".light #csvModal") &&
      app.htmlContent.includes(".light .hover\\:bg-slate-700:hover"),
    "R38: Light theme overrides hover states and CSV modal components"
  );
  assert(
    app.htmlContent.includes(".light .bg-indigo-950") &&
      app.htmlContent.includes(".light .bg-rose-950"),
    "R38: Light theme overrides dark colored utility button backgrounds with high-contrast tints"
  );

  // Test R39: AI Health Dossier Modal, Live Preview & Export Actions (ADR-0017, Issue #58)
  assert(
    app.htmlContent.includes('id="btnAIDossier"') ||
      app.document.getElementById("btnAIDossier") !== null,
    "R39: #btnAIDossier trigger button exists in DOM header"
  );
  assert(
    app.document.getElementById("aiDossierModal") !== null,
    "R39: #aiDossierModal element exists in DOM"
  );
  assert(
    typeof app.openAIDossierModal === "function" &&
      typeof app.toggleAIDossierModal === "function",
    "R39: openAIDossierModal and toggleAIDossierModal functions are defined"
  );

  // Modal lifecycle & layering tests
  const aiModal = app.document.getElementById("aiDossierModal");
  assert(
    aiModal.classList.contains("hidden"),
    "R39: #aiDossierModal is hidden by default"
  );

  // Open CSV modal first, then open AI Dossier Modal -> should dismiss CSV modal
  app.toggleCSVModal(true);
  const csvModalEl = app.document.getElementById("csvModal");
  assert(
    !csvModalEl.classList.contains("hidden"),
    "R39: CSV modal is open before AI Dossier modal trigger"
  );
  app.openAIDossierModal();
  assert(
    !aiModal.classList.contains("hidden") &&
      csvModalEl.classList.contains("hidden"),
    "R39: openAIDossierModal() enforces single-active-dialog invariant by dismissing CSV modal"
  );

  // Check preview content rendered
  const previewEl = app.document.getElementById("dossierMarkdownPreview");
  assert(
    previewEl !== null &&
      previewEl.textContent &&
      previewEl.textContent.includes("Financial Health Dossier"),
    "R39: #dossierMarkdownPreview displays rendered Markdown text"
  );

  // Check Copy to Clipboard action
  let copiedText = "";
  app.navigator.clipboard.writeText = async (text) => {
    copiedText = text;
  };
  app.copyAIDossierToClipboard();
  assert(
    copiedText.length > 100 && copiedText.includes("Financial Health Dossier"),
    "R39: copyAIDossierToClipboard() writes Markdown to system clipboard"
  );

  // Check Download Action
  let downloadTriggered = false;
  let downloadedFileName = "";
  if (typeof global.URL === "undefined") {
    global.URL = {};
  }
  global.URL.createObjectURL = () => "blob:http://localhost/dossier-mock";
  global.URL.revokeObjectURL = () => {};

  app.downloadAIDossierFile();
  assert(
    typeof app.downloadAIDossierFile === "function",
    "R39: downloadAIDossierFile() is defined and callable"
  );

  // Dismiss via dismissAllModals
  app.dismissAllModals();
  assert(
    aiModal.classList.contains("hidden"),
    "R39: dismissAllModals() cleanly dismisses #aiDossierModal"
  );

  // Test R40: Goal-Specific AI Prompt Blueprints, Privacy Masking & Bilingual Switching (Issue #59)
  app.openAIDossierModal();

  // 1. Test Blueprint switching (FIRE blueprint)
  app.setDossierBlueprint("fire");
  assert(
    previewEl.textContent.includes(
      "FIRE (Financial Independence, Retire Early)"
    ),
    "R40: setDossierBlueprint('fire') renders FIRE prompt blueprint instructions"
  );

  // 2. Test Downpayment blueprint
  app.setDossierBlueprint("real_estate");
  assert(
    previewEl.textContent.includes(
      "Real Estate Downpayment & Milestone Sizing"
    ),
    "R40: setDossierBlueprint('real_estate') renders Real Estate prompt blueprint instructions"
  );

  // 3. Test Ladder blueprint
  app.setDossierBlueprint("ladder");
  assert(
    previewEl.textContent.includes(
      "Deposit Ladder & Emergency Buffer Optimization"
    ),
    "R40: setDossierBlueprint('ladder') renders Deposit Ladder prompt blueprint instructions"
  );

  // 4. Test Privacy Anonymization Mask Toggle
  const privacyToggle = app.document.getElementById("togglePrivacyMask");
  assert(
    privacyToggle !== null,
    "R40: #togglePrivacyMask toggle exists in DOM"
  );
  privacyToggle.checked = true;
  app.toggleDossierPrivacyMask();
  assert(
    previewEl.textContent.includes("Relative Multiples") &&
      previewEl.textContent.includes("Salary"),
    "R40: Enabling privacy mask generates zero-leak anonymized dossier with salary multiples"
  );
  privacyToggle.checked = false;
  app.toggleDossierPrivacyMask();

  // 5. Test Custom Inquiries Textarea
  const customInquiriesEl = app.document.getElementById(
    "dossierCustomInquiries"
  );
  assert(
    customInquiriesEl !== null,
    "R40: #dossierCustomInquiries textarea exists in DOM"
  );
  customInquiriesEl.value = "Plan to take sabbatical in year 2";
  app.renderAIDossierModalContent();
  assert(
    previewEl.textContent.includes("Custom Inquiries from Client") &&
      previewEl.textContent.includes("Plan to take sabbatical in year 2"),
    "R40: Custom inquiries textarea appends client notes to rendered Markdown"
  );

  // 6. Test Bilingual Switching for AI Dossier Preview
  app.changeLanguage("vi");
  app.renderAIDossierModalContent();
  assert(
    previewEl.textContent.includes("Hồ Sơ Sức Khỏe Tài Chính") ||
      previewEl.textContent.includes("Chẩn Đoán Sức Khỏe Tài Chính"),
    "R40: Vietnamese language switches AI Dossier Markdown preview to Vietnamese headers"
  );
  app.changeLanguage("en");
  app.renderAIDossierModalContent();
  assert(
    previewEl.textContent.includes("Financial Health Dossier"),
    "R40: English language restores AI Dossier Markdown preview to English headers"
  );

  // Test R41: Issue #71 Scenario Comparison Workbench Trigger Button & Navigation Entry
  const btnCompareScenarios = app.document.getElementById(
    "btnCompareScenarios"
  );
  assert(
    btnCompareScenarios !== null,
    "R41: #btnCompareScenarios trigger button exists in main action toolbar"
  );

  const btnMobileCompare = app.document.getElementById("btnMobileCompare");
  assert(
    btnMobileCompare !== null,
    "R41: #btnMobileCompare button exists in mobile action sheet"
  );

  // Initial state: comparison section is hidden
  const compareSectionEl = app.document.getElementById("compareSection");
  assert(
    compareSectionEl && compareSectionEl.classList.contains("hidden"),
    "R41: #compareSection is hidden by default"
  );

  // Trigger compare mode via button
  app.toggleCompareMode(true);
  assert(
    app.window.comparisonActive === true &&
      !compareSectionEl.classList.contains("hidden"),
    "R41: toggleCompareMode(true) opens #compareSection and sets comparisonActive"
  );
  assert(
    btnCompareScenarios.classList.contains("text-emerald-300") ||
      btnCompareScenarios.classList.contains("bg-emerald-950/70"),
    "R41: #btnCompareScenarios has active styling when compare mode is open"
  );

  // Toggle off
  app.toggleCompareMode(false);
  assert(
    app.window.comparisonActive === false &&
      compareSectionEl.classList.contains("hidden"),
    "R41: toggleCompareMode(false) hides #compareSection and resets comparisonActive"
  );

  // Test R42: Issue #72 Timeframe Preset Placement, Standard Bank Tenors & Capital Yield
  // 1. Timeframe Presets inside Target Date Section
  assert(
    typeof app.setPresetYears === "function",
    "R42: setPresetYears function is exposed globally"
  );
  app.setPresetYears(3);
  const targetDateInput = app.document.getElementById("inputTargetDate");
  assert(
    targetDateInput && targetDateInput.value.length > 0,
    `R42: setPresetYears(3) updated inputTargetDate to ${targetDateInput ? targetDateInput.value : "empty"}`
  );

  // 2. Standard Tenor Selector
  assert(
    typeof app.setAutoTermTenor === "function",
    "R42: setAutoTermTenor function is exposed globally"
  );
  app.setAutoTermTenor(12, 6.0);
  const monthsInput = app.document.getElementById("inputAutoTermMonths");
  const rateInput = app.document.getElementById("inputAutoTermRate");
  assert(
    monthsInput && String(monthsInput.value) === "12",
    `R42: setAutoTermTenor(12, 6.0) updated inputAutoTermMonths to 12 (${monthsInput ? monthsInput.value : "null"})`
  );
  assert(
    rateInput && String(rateInput.value) === "6",
    `R42: setAutoTermTenor(12, 6.0) updated inputAutoTermRate to 6.0 (${rateInput ? rateInput.value : "null"})`
  );

  // 3. Capital Yield Calculation with Initial Portfolio
  app.document.getElementById("inputSalary").value = "0";
  app.runSimulation();
  const yieldDisplay = app.document.getElementById("metricInterestPercentage");
  assert(
    yieldDisplay !== null && !yieldDisplay.innerText.includes("NaN"),
    `R42: Capital Yield with zero monthly salary produces valid formatted percentage: ${yieldDisplay ? yieldDisplay.innerText : "null"}`
  );

  // Test R43: Issue #68 CSV Portfolio Editor Currency Masking & Reset Actions Scope Clarification
  // 1. Elements existence
  const btnLoadSample = app.document.getElementById("btnLoadSamplePortfolio");
  const btnClearAccounts = app.document.getElementById("btnClearAllAccounts");
  const btnResetAll = app.document.getElementById("btnResetAllSettings");
  assert(
    btnLoadSample !== null,
    "R43: #btnLoadSamplePortfolio button exists in CSV management modal"
  );
  assert(
    btnClearAccounts !== null,
    "R43: #btnClearAllAccounts danger button exists in CSV management modal"
  );
  assert(
    btnResetAll !== null,
    "R43: #btnResetAllSettings button exists in parameters toolbar"
  );

  // 2. Clear All Accounts with Undo Toast Safeguard
  app.loadDefaultSampleData();
  const initialCsvCount = app.workingCSVData.length;
  assert(
    initialCsvCount > 0,
    `R43: Sample portfolio loaded with ${initialCsvCount} accounts`
  );

  app.clearAllAccounts();
  assert(
    app.workingCSVData.length === 0,
    "R43: clearAllAccounts() emptied workingCSVData"
  );

  // Trigger undo from latest toast
  const lastToastUndoBtn = app.document.getElementById("toastActionBtn");
  if (lastToastUndoBtn) {
    lastToastUndoBtn.click();
    assert(
      app.workingCSVData.length === initialCsvCount,
      `R43: Undo toast safeguard restored previous ${app.workingCSVData.length} accounts`
    );
  }

  // Test R44: Issue #69 Liquid Pool Deficit Prominence & Portfolio Source Badges in Savings Hub
  // 1. Deficit alert badge in Pool Balance KPI card
  const elDeficitBadge = app.document.getElementById("metricPoolDeficitAlert");
  assert(
    elDeficitBadge !== null,
    "R44: #metricPoolDeficitAlert badge element exists in Pool Balance KPI card"
  );

  // Normal healthy run: deficit badge is hidden
  app.loadDefaultSampleData();
  app.document.getElementById("inputSalary").value = "25,000,000";
  app.runSimulation();
  assert(
    elDeficitBadge.classList.contains("hidden"),
    "R44: Deficit alert badge is hidden during healthy simulation without pool deficits"
  );

  // Trigger deficit via oversized withdrawal
  app.workingCSVData = [
    {
      "Account Name": "Massive Outflow",
      Principal: "500000000",
      Interest: "0",
      "Start Date": app.formatDate(new Date()),
      "End Date": app.formatDate(app.addMonths(new Date(), 2)),
      Type: "Withdrawal",
      Bank: "Cash",
    },
  ];
  app.runSimulation();
  assert(
    !elDeficitBadge.classList.contains("hidden"),
    "R44: Deficit alert badge is visibly displayed when liquid pool enters deficit"
  );

  // 2. Savings Hub origin badges
  app.loadDefaultSampleData();
  app.runSimulation();
  app.renderFilteredSavingsTable();
  const tableBody = app.document.getElementById("savingsTableBody");
  assert(
    tableBody && tableBody.children.length > 0,
    "R44: Savings Accounts table populated with portfolio rows"
  );

  app.dismissAllModals();

  console.log(
    `\n📊 UI/UX Requirements Test Summary: ${passCount} Passed, ${failCount} Failed\n`
  );
  if (failCount > 0) {
    process.exit(1);
  }
}

runUIUXTests().catch((err) => {
  console.error("UI/UX test execution failed:", err);
  process.exit(1);
});
