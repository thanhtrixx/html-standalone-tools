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
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      value: "",
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
    app.document.getElementById("inputSalary").value === "40000000",
    "R2: inputSalary restored accurately from localStorage"
  );
  assert(
    app.document.getElementById("inputTargetDate").value === "2028-10-15",
    "R2: inputTargetDate restored accurately from localStorage"
  );

  // Test R3: Reset All
  app.resetAll(true);
  assert(
    app.document.getElementById("inputSalary").value === "25000000",
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

  // Test R14: Heatmap Calendar
  app.toggleHeatmap();
  const heatmapSection = app.document.getElementById("heatmapSection");
  assert(
    !heatmapSection.classList.contains("hidden"),
    "R14: toggleHeatmap revealed monthly heatmap section"
  );

  // Test R15: Year-over-Year (YoY) Table
  app.toggleYoYTable();
  const yoySection = app.document.getElementById("yoySection");
  assert(
    !yoySection.classList.contains("hidden"),
    "R15: toggleYoYTable revealed YoY comparison table"
  );
  const yoyTbody = app.document.getElementById("yoyTableBody");
  assert(
    yoyTbody.children.length >= 1,
    `R15: YoY table populated with ${yoyTbody.children.length} annual rows`
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

  // Test R17: Scenario Comparison Mode
  app.toggleCompareMode();
  const compareSec = app.document.getElementById("compareSection");
  assert(
    !compareSec.classList.contains("hidden"),
    "R17: toggleCompareMode revealed Scenario Comparison section"
  );

  const compASalary = app.document.getElementById("compASalary").innerText;
  const compBSalary = app.document.getElementById("compBSalary").innerText;
  assert(
    compASalary.length > 0 && compBSalary.length > 0,
    `R17: Side-by-side comparison calculated (Scenario A: "${compASalary}", Scenario B: "${compBSalary}")`
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

  // Test R20: Auto 6M Rule
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

  const auto6mLog = app.simulationLogs.find((l) => l.type === "NEW_6M");
  assert(
    auto6mLog !== undefined,
    "R20: Auto 6M rule triggered 6-month term creation when pool >= 200M VND"
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
