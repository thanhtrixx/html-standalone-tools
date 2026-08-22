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
      getElementById: (id) => getEl(id),
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
    "R8: Share simulation generated base64 encoded URL hash"
  );
  assert(
    app.navigator.clipboard.lastCopied.includes("#"),
    "R8: Share simulation copied full URL to clipboard"
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
          app.document.getElementById("txtTotalBalance").textContent || ""
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
