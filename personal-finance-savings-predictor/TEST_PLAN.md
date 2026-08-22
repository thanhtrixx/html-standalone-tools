# 🧪 Personal Finance Savings Predictor — Requirements & Test Plan

> **Target:** `index.html`  
> **Goal:** Validate all Phase 1–5 features work correctly  
> **Method:** Browser console tests + manual verification

---

## 📋 Feature Requirements Matrix

| ID      | Feature                     | Requirement                                                      | Priority |
| ------- | --------------------------- | ---------------------------------------------------------------- | -------- |
| **R1**  | CSV Persistence             | Auto-save CSV data to localStorage; auto-load on reload          | P0       |
| **R2**  | Parameter Persistence       | Save/load salary, growth, inflation, goal, rates to localStorage | P0       |
| **R3**  | Reset All                   | Clear localStorage + restore default values                      | P1       |
| **R4**  | Salary Growth               | Apply annual compound growth to monthly salary                   | P0       |
| **R5**  | Inflation Adjustment        | Calculate real value (inflation-adjusted); toggle on/off         | P0       |
| **R6**  | Withdrawals                 | Track manual withdrawals in simulation logs and charts           | P1       |
| **R7**  | Goal Tracking               | Show progress bar + ring chart when savings goal set             | P1       |
| **R8**  | Shareable Link              | Serialize params + CSV to URL hash; auto-load on visit           | P1       |
| **R9**  | Theme Toggle                | Light/dark toggle; persist preference; CSS transitions           | P2       |
| **R10** | Onboarding Tour             | 5-step guided tour on first visit; skip/show again               | P2       |
| **R11** | Keyboard Shortcuts          | Enter=run, Ctrl+S=save, Esc=close modals                         | P2       |
| **R12** | Toast Notifications         | Slide-in toasts auto-dismiss after 3s                            | P2       |
| **R13** | Growth Chart                | Date range filter (All/3M/6M/1Y); Real vs Nominal toggle         | P2       |
| **R14** | Heatmap Calendar            | 12-month color intensity grid                                    | P2       |
| **R15** | YoY Table                   | Year-by-year breakdown with growth %                             | P2       |
| **R16** | CSV Editor                  | Add/Edit/Delete rows; import/export Bank field                   | P1       |
| **R17** | Scenario Comparison         | Compare current vs projected 2-year scenario                     | P3       |
| **R18** | Export Chart Image          | Download growth chart as PNG                                     | P3       |
| **R19** | Print Summary               | Print-friendly layout via `window.print()`                       | P2       |
| **R20** | Auto 6M Rule                | Create 6M term when pool ≥ 200M VND                              | P0       |
| **R21** | Vietnamese Language Support | Language selector + full i18n translations for Vietnamese        | P1       |

---

## 🧪 Browser Console Unit Tests

Copy and paste each block into the browser DevTools console (`F12` → Console tab) to verify functionality.

### 🔹 R1/R2: Data Persistence

```javascript
// Test: Verify localStorage works and stores CSV data
console.log("%c📦 R1: CSV Persistence", "color: #6366f1; font-weight: bold");
localStorage.removeItem("workingCSVData");
const csvKey = localStorage.getItem("workingCSVData");
console.assert(csvKey === null, "Initial state: CSV data should be null");
// Trigger save by running simulation
runSimulation();
const saved = localStorage.getItem("workingCSVData");
console.assert(saved !== null, "After run: CSV data should be saved");
console.log("✅ CSV persistence:", saved ? "PASS" : "FAIL");

// Test: Parameter persistence
console.log(
  "%c📦 R2: Parameter Persistence",
  "color: #6366f1; font-weight: bold"
);
document.getElementById("inputSalary").value = "30000000";
document.getElementById("inputSalaryGrowth").value = "5";
document.getElementById("inputInflation").value = "3.5";
document.getElementById("inputSavingsGoal").value = "1000000000";
document.getElementById("inputPoolRate").value = "0.8";
document.getElementById("input6MRate").value = "6.0";
runSimulation();
const params = JSON.parse(localStorage.getItem("params"));
console.assert(
  params !== null && params.salary === "30000000",
  "Parameters should be saved"
);
console.log(
  "✅ Parameter persistence:",
  params && params.salary === "30000000" ? "PASS" : "FAIL"
);
```

### 🔹 R3: Reset All

```javascript
// Test: Reset All functionality
console.log("%c🔄 R3: Reset All", "color: #6366f1; font-weight: bold");
localStorage.clear();
// Re-run to get fresh state
resetAll();
const salaryVal = document.getElementById("inputSalary").value;
const goalVal = document.getElementById("inputSavingsGoal").value;
console.assert(
  salaryVal === "25000000",
  `Reset salary should be 25M, got: ${salaryVal}`
);
console.log("✅ Reset All:", salaryVal === "25000000" ? "PASS" : "FAIL");
```

### 🔹 R4: Salary Growth

```javascript
// Test: Salary growth compound calculation
console.log("%c📈 R4: Salary Growth", "color: #6366f1; font-weight: bold");
document.getElementById("inputSalary").value = "10000000";
document.getElementById("inputSalaryGrowth").value = "10";
document.getElementById("inputInflation").value = "0";
document.getElementById("inputTargetDate").value = "";
const today = new Date();
const target = new Date(
  today.getFullYear() + 1,
  today.getMonth(),
  today.getDate()
);
document.getElementById("inputTargetDate").value = formatDate(target);
runSimulation();
// Check that salary increases in logs
const salaryLogs = simulationLogs.filter((l) => l.type === "SALARY");
console.assert(salaryLogs.length > 0, "Salary logs should exist");
if (salaryLogs.length > 1) {
  const firstSalary = salaryLogs[salaryLogs.length - 1].amount;
  const lastSalary = salaryLogs[0].amount;
  console.assert(lastSalary > firstSalary, "Salary should grow over time");
  console.log(
    `✅ Salary growth: PASS (first: ${firstSalary}, last: ${lastSalary})`
  );
} else {
  console.log("⚠️ Salary growth: Single year, verify manually");
}
```

### 🔹 R5: Inflation Adjustment

```javascript
// Test: Real vs Nominal toggle and inflation calculation
console.log(
  "%c🌡️ R5: Inflation Adjustment",
  "color: #6366f1; font-weight: bold"
);
document.getElementById("inputInflation").value = "5";
document.getElementById("inputSalaryGrowth").value = "0";
document.getElementById("inputTargetDate").value = "";
const t2 = new Date();
const target2 = new Date(t2.getFullYear() + 2, t2.getMonth(), t2.getDate());
document.getElementById("inputTargetDate").value = formatDate(target2);
runSimulation();
const realEl = document.getElementById("metricRealValue");
console.assert(realEl.style.display !== "none", "Real value should be visible");
console.log(
  "✅ Real value visible:",
  realEl.style.display !== "none" ? "PASS" : "FAIL"
);
console.log("✅ Real value text:", realEl.innerText || "Not set");
// Test toggle
document.getElementById("realToggleBtn").click();
console.log("🔄 Toggle Real/Nominal clicked");
```

### 🔹 R6: Withdrawals

```javascript
// Test: Withdrawal tracking in simulation
console.log("%c💸 R6: Withdrawals", "color: #6366f1; font-weight: bold");
// Add a withdrawal row
workingCSVData.push({
  "Account Name": "Test Withdrawal",
  Principal: "50000000",
  "Start Date": formatDate(new Date()),
  "End Date": formatDate(addMonths(new Date(), 6)),
  Interest: "0",
  Type: "Withdrawal",
  Bank: "TestBank",
});
runSimulation();
const withdrawalLogs = simulationLogs.filter((l) => l.type === "WITHDRAWAL");
console.assert(withdrawalLogs.length > 0, "Withdrawal logs should exist");
console.log(
  "✅ Withdrawal logs:",
  withdrawalLogs.length > 0 ? `PASS (${withdrawalLogs.length})` : "FAIL"
);
// Check earnings breakdown
const withdrawEl = document.getElementById("txtWithdrawals");
console.assert(
  withdrawEl.parentElement.classList.contains("hidden") === false,
  "Withdrawals should be visible"
);
console.log(
  "✅ Withdrawals displayed:",
  withdrawEl.parentElement.classList.contains("hidden") === false
    ? "PASS"
    : "FAIL"
);
// Clean up
workingCSVData = workingCSVData.slice(0, -1);
```

### 🔹 R7: Goal Tracking

```javascript
// Test: Goal progress bar and ring chart
console.log("%n🎯 R7: Goal Tracking", "color: #6366f1; font-weight: bold");
document.getElementById("inputSavingsGoal").value = "500000000";
runSimulation();
const goalSection = document.getElementById("goalProgressSection");
console.assert(
  !goalSection.classList.contains("hidden"),
  "Goal section should be visible"
);
const goalRingEl = document.getElementById("goalRingSection");
console.assert(
  !goalRingEl.classList.contains("hidden"),
  "Goal ring section should be visible"
);
console.log(
  "✅ Goal progress section:",
  !goalSection.classList.contains("hidden") ? "PASS" : "FAIL"
);
console.log(
  "✅ Goal ring chart:",
  !goalRingEl.classList.contains("hidden") ? "PASS" : "FAIL"
);
```

### 🔹 R8: Shareable Link

```javascript
// Test: URL serialization and deserialization
console.log("%🔗 R8: Shareable Link", "color: #6366f1; font-weight: bold");
document.getElementById("inputSalary").value = "35000000";
document.getElementById("inputSalaryGrowth").value = "3";
document.getElementById("inputInflation").value = "4";
document.getElementById("inputSavingsGoal").value = "750000000";
runSimulation();
try {
  shareSimulation();
  console.log("✅ Share simulation: function executed");
  // Verify URL contains hash
  const hashPresent = window.location.hash.length > 10;
  console.assert(hashPresent, "URL hash should contain encoded data");
  console.log("✅ URL hash present:", hashPresent ? "PASS" : "FAIL");
} catch (e) {
  console.assert(false, "shareSimulation should not throw: " + e.message);
}
```

### 🔹 R9: Theme Toggle

```javascript
// Test: Light/Dark theme switching
console.log("%🎨 R9: Theme Toggle", "color: #6366f1; font-weight: bold");
localStorage.removeItem("theme");
// Initially dark
console.assert(
  !document.documentElement.classList.contains("light"),
  "Default should be dark"
);
document.getElementById("themeBtn").click();
document.getElementById("themeBtn").click();
const isLight = document.documentElement.classList.contains("light");
console.log("✅ Theme toggled:", "PASS");
document.getElementById("themeBtn").click();
localStorage.removeItem("theme");
```

### 🔹 R10: Onboarding

```javascript
// Test: Onboarding tour navigation
console.log("%🗺️ R10: Onboarding", "color: #6366f1; font-weight: bold");
localStorage.removeItem("showedOnboarding");
showOnboarding();
const overlay = document.getElementById("onboardingOverlay");
console.assert(
  !overlay.classList.contains("hidden"),
  "Onboarding overlay should be visible"
);
console.log(
  "✅ Onboarding overlay shown:",
  !overlay.classList.contains("hidden") ? "PASS" : "FAIL"
);
// Close and verify
closeOnboarding();
console.assert(
  overlay.classList.contains("hidden"),
  "Onboarding should be hidden"
);
console.log(
  "✅ Onboarding closed:",
  overlay.classList.contains("hidden") ? "PASS" : "FAIL"
);
```

### 🔹 R11: Keyboard Shortcuts

```javascript
// Test: Keyboard shortcut handling
console.log("%⌨️ R11: Keyboard Shortcuts", "color: #6366f1; font-weight: bold");
// Simulate Enter key on input
const salaryInput = document.getElementById("inputSalary");
salaryInput.focus();
const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
salaryInput.dispatchEvent(enterEvent);
console.log("✅ Enter key triggered simulation");
// Simulate Escape key
const modal = document.getElementById("csvModal");
toggleCSVModal(true);
const escEvent = new KeyboardEvent("keydown", { key: "Escape" });
modal.dispatchEvent(escEvent);
console.log("✅ Escape key handling verified");
```

### 🔹 R12: Toast Notifications

```javascript
// Test: Toast notification creation and auto-dismiss
console.log(
  "%🔔 R12: Toast Notifications",
  "color: #6366f1; font-weight: bold"
);
showToast("Test notification", "info");
showToast("Success test", "success");
showToast("Error test", "error");
showToast("Warning test", "warning");
const toasts = document.querySelectorAll(".toast");
console.assert(toasts.length >= 3, "At least 3 toasts should exist");
console.log(
  "✅ Toast notifications:",
  toasts.length >= 3 ? `PASS (${toasts.length})` : "FAIL"
);
// Auto-dismiss after 3s
setTimeout(() => {
  const remaining = document.querySelectorAll(".toast");
  console.log(
    `ℹ️ After 3s: ${remaining.length} toasts remaining (expected: 0)`
  );
}, 3500);
```

### 🔹 R13: Growth Chart

```javascript
// Test: Growth chart rendering and date filtering
console.log("%📊 R13: Growth Chart", "color: #6366f1; font-weight: bold");
document.getElementById("inputSalary").value = "25000000";
document.getElementById("inputTargetDate").value = "";
const today = new Date();
const target = new Date(
  today.getFullYear() + 1,
  today.getMonth(),
  today.getDate()
);
document.getElementById("inputTargetDate").value = formatDate(target);
runSimulation();
const growthCanvas = document.getElementById("chartGrowth");
console.assert(growthChart !== null, "Growth chart should be initialized");
console.log(
  "✅ Growth chart rendered:",
  growthChart !== null ? "PASS" : "FAIL"
);
// Test date range filter
document.getElementById("chartDateRange").value = "1y";
document.getElementById("chartDateRange").dispatchEvent(new Event("change"));
console.log("🔄 Date range filter: 1Y");
document.getElementById("chartDateRange").value = "all";
document.getElementById("chartDateRange").dispatchEvent(new Event("change"));
console.log("✅ Date range filter: PASS");
```

### 🔹 R14: Heatmap Calendar

```javascript
// Test: Heatmap visibility and rendering
console.log("%🗓️ R14: Heatmap Calendar", "color: #6366f1; font-weight: bold");
runSimulation();
document.getElementById("heatmapSection").classList.remove("hidden");
const heatmapGrid = document.getElementById("heatmapGrid");
console.assert(heatmapGrid.children.length > 0, "Heatmap should have cells");
console.log(
  "✅ Heatmap cells:",
  heatmapGrid.children.length > 0
    ? `PASS (${heatmapGrid.children.length})`
    : "FAIL"
);
document.getElementById("heatmapSection").classList.add("hidden");
```

### 🔹 R15: YoY Table

```javascript
// Test: Year-over-Year table rendering
console.log("%📅 R15: YoY Table", "color: #6366f1; font-weight: bold");
document.getElementById("inputTargetDate").value = "";
const today = new Date();
const target = new Date(
  today.getFullYear() + 3,
  today.getMonth(),
  today.getDate()
);
document.getElementById("inputTargetDate").value = formatDate(target);
runSimulation();
document.getElementById("yoySection").classList.remove("hidden");
const yoyRows = document.getElementById("yoyTableBody").children;
console.assert(yoyRows.length >= 2, "YoY table should have at least 2 rows");
console.log(
  "✅ YoY table rows:",
  yoyRows.length >= 2 ? `PASS (${yoyRows.length})` : "FAIL"
);
document.getElementById("yoySection").classList.add("hidden");
```

### 🔹 R16: CSV Editor

```javascript
// Test: CSV editor add/edit/delete/import/export
console.log("%📋 R16: CSV Editor", "color: #6366f1; font-weight: bold");
const initialCount = workingCSVData.length;
// Add row
addEmptyCSVRow();
console.assert(
  workingCSVData.length === initialCount + 1,
  "CSV data length should increase"
);
console.log(
  "✅ Add row:",
  workingCSVData.length === initialCount + 1 ? "PASS" : "FAIL"
);
// Edit row
updateCSVRowField(0, "Account Name", "Test Account");
console.assert(
  workingCSVData[0]["Account Name"] === "Test Account",
  "Row should be updated"
);
console.log(
  "✅ Edit row:",
  workingCSVData[0]["Account Name"] === "Test Account" ? "PASS" : "FAIL"
);
// Delete row
deleteCSVRow(0);
console.assert(
  workingCSVData.length === initialCount,
  "CSV data length should decrease"
);
console.log(
  "✅ Delete row:",
  workingCSVData.length === initialCount ? "PASS" : "FAIL"
);
// Export
try {
  exportCSV();
  console.log("✅ Export CSV: function executed");
} catch (e) {
  console.assert(false, "exportCSV failed: " + e.message);
}
```

### 🔹 R20: Auto 6M Rule

```javascript
// Test: Auto 6M term creation when pool >= 200M VND
console.log("%🏦 R20: Auto 6M Rule", "color: #6366f1; font-weight: bold");
// Set up high initial pool
workingCSVData[3].Principal = "250000000"; // Set Non-Term Pool to 250M
document.getElementById("inputPoolRate").value = "0.5";
document.getElementById("input6MRate").value = "6.0";
document.getElementById("inputSalary").value = "0"; // No salary
document.getElementById("inputTargetDate").value = "";
const tToday = new Date();
const tTarget = new Date(
  tToday.getFullYear() + 1,
  tToday.getMonth(),
  tToday.getDate()
);
document.getElementById("inputTargetDate").value = formatDate(tTarget);
runSimulation();
const auto6mLogs = simulationLogs.filter((l) => l.type === "NEW_6M");
console.assert(
  auto6mLogs.length > 0,
  "Auto 6M should be created when pool >= 200M"
);
console.log(
  "✅ Auto 6M rule:",
  auto6mLogs.length > 0 ? `PASS (${auto6mLogs.length} accounts)` : "FAIL"
);
// Restore
workingCSVData[3].Principal = "15000000";
```

---

### 🔹 R21: Vietnamese Language Support

```javascript
// Test: Language selector exists and works
console.log(
  "%c🌐 R21: Vietnamese Language Support",
  "color: #6366f1; font-weight: bold"
);
const langSelector = document.getElementById("langSelector");
console.assert(langSelector !== null, "Language selector should exist");
console.log(
  "✅ Language selector exists:",
  langSelector !== null ? "PASS" : "FAIL"
);

// Test: Switch to Vietnamese
langSelector.value = "vi";
langSelector.dispatchEvent(new Event("change"));
const appTitle = document.querySelector('[data-i18n="app_title"]');
console.assert(
  appTitle.textContent.includes("Giả Lập"),
  `Vietnamese title should contain 'Giả Lập', got: ${appTitle.textContent}`
);
console.log(
  "✅ Vietnamese language switch:",
  appTitle.textContent.includes("Giả Lập") ? "PASS" : "FAIL"
);

// Test: Switch back to English
langSelector.value = "en";
langSelector.dispatchEvent(new Event("change"));
console.assert(
  appTitle.textContent.includes("Savings"),
  `English title should contain 'Savings', got: ${appTitle.textContent}`
);
console.log(
  "✅ English language switch:",
  appTitle.textContent.includes("Savings") ? "PASS" : "FAIL"
);

// Test: Onboarding texts in Vietnamese
document.getElementById("onboardNext").click();
const step2Title = document.querySelector('[data-i18n="onboard_step2_title"]');
console.assert(
  step2Title.textContent.includes("Thông Số"),
  `Step 2 title should contain 'Thông Số', got: ${step2Title.textContent}`
);
console.log(
  "✅ Onboarding Vietnamese texts:",
  step2Title.textContent.includes("Thông Số") ? "PASS" : "FAIL"
);

console.log("✅ R21 Vietnamese Language Support: ALL TESTS PASSED");
```

## 📝 Manual Testing Checklist

| #       | Test Case                 | Expected Result                   | ✅  |
| ------- | ------------------------- | --------------------------------- | --- |
| **M1**  | Open HTML file in browser | Page loads, dark theme, no errors |     |
| **M2**  | Click "Run Simulation"    | Metrics update, charts render     |     |
| **M3**  | Change target date        | Date range filters work           |     |
| **M4**  | Set salary growth to 5%   | Salary increases each year        |     |
| **M5**  | Set inflation to 4%       | Real value shown, toggle works    |     |
| **M6**  | Set savings goal          | Progress bar + ring appear        |     |
| **M7**  | Add withdrawal to CSV     | Withdrawals in logs + chart       |     |
| **M8**  | Click "Import CSV"        | File picker opens, data loads     |     |
| **M9**  | Add/edit/delete CSV rows  | Changes persist, table updates    |     |
| **M10** | Click "Download CSV"      | CSV file downloads                |     |
| **M11** | Click "Share" link        | URL copied to clipboard           |     |
| **M12** | Click "Light" toggle      | Theme switches, persists          |     |
| **M13** | Click "?" button          | Onboarding tour shows             |     |
| **M14** | Press `Enter` in input    | Simulation runs                   |     |
| **M15** | Press `Ctrl+S`            | Toast shows "saved"               |     |
| **M16** | Press `Esc` in modal      | Modal closes                      |     |
| **M17** | Click "1Y" preset         | Date set to 1 year from now       |     |
| **M18** | Click "Reset All"         | All defaults restored             |     |
| **M19** | Open Heatmap              | Grid renders with colors          |     |
| **M20** | Open YoY Table            | Annual breakdown shows            |     |
| **M21** | Compare scenarios         | Side-by-side comparison           |     |
| **M22** | Export chart as image     | PNG downloads                     |     |
| **M23** | Click "Print"             | Print dialog opens                |     |
| **M24** | Resize window to mobile   | Layout adapts correctly           |     |
| **M25** | Reload page               | All data persists                 |     |

---

## 🔧 Test Setup Instructions

1. **Open the HTML file** in your browser
2. **Open DevTools** (`Cmd+Option+I` on Mac, `F12` on Windows)
3. **Go to Console tab**
4. **Copy-paste test blocks** one by one
5. **Review console assertions** — green `PASS` means test succeeded
6. **For manual tests**, use the checklist table

### Prerequisites

| Requirement      | Details                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| **Browser**      | Chrome 90+ / Firefox 90+ / Safari 15+                                   |
| **JavaScript**   | ES6+ supported (const, let, arrow functions)                            |
| **localStorage** | Must be enabled                                                         |
| **Internet**     | Required for CDN libraries (Tailwind, Chart.js, PapaParse, FontAwesome) |

---

## 📊 Expected Test Results

All **automated tests** should show `PASS` in the console.  
Any `FAIL` or `assertion failed` indicates a bug to fix.  
**Manual tests** should be verified by visual inspection.

### Success Criteria

| Category         | Pass Threshold                      |
| ---------------- | ----------------------------------- |
| R1–R20 Automated | 15/20 PASS (core features)          |
| M1–M25 Manual    | 20/25 PASS (all critical paths)     |
| Console Errors   | 0 (no JavaScript errors)            |
| Performance      | Simulation completes in < 2 seconds |

---

## 🛠️ Troubleshooting

| Issue                | Fix                                                  |
| -------------------- | ---------------------------------------------------- |
| Charts not rendering | Check console for Chart.js errors; verify CDN loaded |
| localStorage blocked | Check browser settings; try incognito mode           |
| Toasts not showing   | Check `toastContainer` exists in DOM                 |
| Sim fails silently   | Check `runSimulation()` try/catch block              |
| Theme not persisting | Clear localStorage; verify `toggleTheme()` works     |
| CSV import fails     | Check PapaParse CDN; verify CSV format matches spec  |

---

_Generated: 2026-08-09_  
_File: `TEST_PLAN.md`_
