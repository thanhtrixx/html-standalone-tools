const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadSimulateEngine() {
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

  const sandbox = {
    window: {},
    tailwind: {},
    console: console,
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { href: "http://localhost/", search: "" },
    navigator: { clipboard: { writeText: async () => {} } },
    document: {
      getElementById: () => ({
        value: "",
        innerText: "",
        innerHTML: "",
        classList: {
          add() {},
          remove() {},
          toggle() {},
          contains: () => false,
        },
        setAttribute() {},
        getAttribute: () => null,
        addEventListener() {},
      }),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
    },
    localStorage: { getItem: () => null, setItem: () => {} },
    Chart: { getChart: () => null, register: () => {} },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);

  return {
    simulate: sandbox.simulate,
    formatDate: sandbox.formatDate,
    parseDate: sandbox.parseDate,
    addMonths: sandbox.addMonths,
    getDaysDiff: sandbox.getDaysDiff,
    getMonthDiff: sandbox.getMonthDiff,
  };
}

async function runSimulationTests() {
  console.log("🔢 Running Pure Simulation Engine Unit Tests...\n");
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

  const { simulate, formatDate, parseDate, addMonths, getDaysDiff } =
    loadSimulateEngine();

  // Test 1: Null target date handling
  const nullRes = simulate({ targetDateStr: "" }, []);
  assert(
    nullRes === null,
    "simulate() returns null when targetDateStr is empty"
  );

  // Test 2: Demand interest on flexible pool only
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneYearLater = new Date(today.getTime());
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  const poolOnlyPortfolio = [
    {
      "Account Name": "Starting Cash",
      Principal: "100000000", // 100M VND
      "Start Date": formatDate(today),
      "End Date": formatDate(oneYearLater),
      Interest: "0",
      Type: "Non-Term Pool",
      Bank: "Cash",
    },
  ];

  const poolSimRes = simulate(
    {
      targetDateStr: formatDate(oneYearLater),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0.05, // 5% annual
      term6MAnnualRate: 0.06,
      savingsGoal: 0,
    },
    poolOnlyPortfolio
  );

  assert(poolSimRes !== null, "Simulation completed for pool-only portfolio");
  assert(
    poolSimRes.totals.totalInterestPool > 0,
    `Flexible pool earned demand interest: ${Math.round(poolSimRes.totals.totalInterestPool).toLocaleString()} VND`
  );
  // Total wealth should be exactly 100M * (1 + 0.05/365)^N where N is number of simulation days
  const numDays = poolSimRes.dailySnapshots.length;
  const exactExpected = 100000000 * Math.pow(1 + 0.05 / 365, numDays);
  const diff = Math.abs(poolSimRes.totals.totalWealth - exactExpected);
  assert(
    diff < 1,
    `Daily compound interest formula is mathematically precise (diff: ${diff.toFixed(4)} VND)`
  );

  // Test 3: Monthly salary deposits on 1st of each month
  const sixMonthsLater = addMonths(today, 6);
  const salarySimRes = simulate(
    {
      targetDateStr: formatDate(sixMonthsLater),
      monthlySalary: 20000000, // 20M VND / month
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      term6MAnnualRate: 0,
      savingsGoal: 0,
    },
    []
  );

  const salaryLogs = salarySimRes.simulationLogs.filter(
    (l) => l.type === "SALARY"
  );
  assert(
    salaryLogs.length >= 5 && salaryLogs.length <= 7,
    `Recorded monthly salary deposits: ${salaryLogs.length} deposits`
  );
  assert(
    salarySimRes.totals.cumulativeSalary === salaryLogs.length * 20000000,
    `Cumulative salary equals sum of individual monthly deposits (${salarySimRes.totals.cumulativeSalary.toLocaleString()} VND)`
  );

  // Test 4: Anniversary-based salary escalation (ADR-0002)
  const threeYearsLater = new Date(today.getTime());
  threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);

  const escalationSimRes = simulate(
    {
      targetDateStr: formatDate(threeYearsLater),
      monthlySalary: 10000000, // 10M VND
      salaryGrowthRate: 0.1, // 10% annual escalation
      inflationRate: 0,
      poolAnnualRate: 0,
      term6MAnnualRate: 0,
      savingsGoal: 0,
    },
    []
  );

  const escSalaryLogs = escalationSimRes.simulationLogs.filter(
    (l) => l.type === "SALARY"
  );
  assert(
    escSalaryLogs.length > 24,
    "Multi-year simulation has > 24 salary deposits"
  );

  const year1Salary = escSalaryLogs[0].amount;
  const year2SalaryLog = escSalaryLogs.find((l, idx) => idx >= 12);
  const year3SalaryLog = escSalaryLogs.find((l, idx) => idx >= 24);

  assert(
    year1Salary === 10000000,
    `Year 1 initial salary is exact (10,000,000 VND)`
  );
  assert(
    Math.round(year2SalaryLog.amount) === 11000000,
    `Year 2 salary escalated by 10% on 12-month anniversary (${Math.round(year2SalaryLog.amount).toLocaleString()} VND)`
  );
  assert(
    Math.round(year3SalaryLog.amount) === 12100000,
    `Year 3 salary escalated by compound 10% on 24-month anniversary (${Math.round(year3SalaryLog.amount).toLocaleString()} VND)`
  );

  // Test 5: Fixed term deposit maturity payout & interest (CSV accounts)
  const startDate = new Date(today.getTime());
  const matureDate = addMonths(startDate, 3);
  const daysInTerm = getDaysDiff(startDate, matureDate);
  const expectedCSVInterest = 100000000 * 0.06 * (daysInTerm / 365);

  const csvPortfolio = [
    {
      "Account Name": "VIB 3M Fixed",
      Principal: "100000000",
      "Start Date": formatDate(startDate),
      "End Date": formatDate(matureDate),
      Interest: "6.0",
      Type: "Term Saving",
      Bank: "VIB",
    },
  ];

  const csvSimRes = simulate(
    {
      targetDateStr: formatDate(addMonths(matureDate, 1)),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      term6MAnnualRate: 0,
      savingsGoal: 0,
    },
    csvPortfolio
  );

  const maturityLogs = csvSimRes.simulationLogs.filter(
    (l) => l.type === "MATURITY"
  );
  assert(
    maturityLogs.length === 1,
    "Recorded fixed term deposit maturity event"
  );
  assert(
    Math.abs(maturityLogs[0].interest - expectedCSVInterest) < 1,
    `Maturity interest calculation is exact (${maturityLogs[0].interest.toFixed(2)} VND)`
  );
  assert(
    Math.abs(maturityLogs[0].amount - (100000000 + expectedCSVInterest)) < 1,
    `Maturity payout returned principal + interest to flexible pool`
  );

  // Test 6: Unified Auto Term Threshold Allocation & Consolidated Sweep (ADR-0005)
  // Starting with 450M in pool -> should trigger ONE consolidated Auto Term deposit for 450M, leaving 0M in pool
  const bigPoolPortfolio = [
    {
      "Account Name": "Initial Big Pool",
      Principal: "450000000",
      "Start Date": formatDate(today),
      "End Date": formatDate(oneYearLater),
      Interest: "0",
      Type: "Non-Term Pool",
      Bank: "Cash",
    },
  ];

  const autoTermSimRes = simulate(
    {
      targetDateStr: formatDate(oneYearLater),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      autoTermAnnualRate: 0.058, // 5.8%
      autoTermThreshold: 200000000,
      autoTermMonths: 6,
      savingsGoal: 0,
    },
    bigPoolPortfolio
  );

  const day0Logs = autoTermSimRes.simulationLogs.filter(
    (l) =>
      (l.type === "NEW_6M" || l.type === "NEW_AUTO_TERM") &&
      l.date === formatDate(today)
  );
  assert(
    day0Logs.length === 1,
    `On day 0, created exactly one consolidated Auto Term deposit (created: ${day0Logs.length})`
  );
  assert(
    day0Logs[0].amount === 450000000,
    `Auto Term deposit locked full pool balance of 450M VND (locked: ${day0Logs[0].amount})`
  );
  assert(
    autoTermSimRes.totals.created6MCount >= 2,
    `Auto Term rolled over upon maturity over 1-year timeline (total: ${autoTermSimRes.totals.created6MCount})`
  );

  // First day snapshot pool balance should be 450M - 450M = 0
  const firstDaySnap = autoTermSimRes.dailySnapshots[0];
  assert(
    Math.round(firstDaySnap.poolBalance) === 0,
    `Pool balance reduced to 0 after locking full 450M balance (got: ${firstDaySnap.poolBalance})`
  );
  assert(
    Math.round(firstDaySnap.fixedSavingsBalance) === 450000000,
    `Active fixed savings holds 450M in the single Auto Term account (got: ${firstDaySnap.fixedSavingsBalance})`
  );
  assert(
    Math.round(firstDaySnap.totalWealth) === 450000000,
    `Total wealth is preserved across accounts (450M)`
  );

  // Subtest 6b: Disabling Auto Term when threshold = 0
  const disabledAutoTermSim = simulate(
    {
      targetDateStr: formatDate(oneYearLater),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0.05,
      autoTermThreshold: 0, // Disabled
      savingsGoal: 0,
    },
    bigPoolPortfolio
  );
  const disabledLogs = disabledAutoTermSim.simulationLogs.filter(
    (l) => l.type === "NEW_6M" || l.type === "NEW_AUTO_TERM"
  );
  assert(
    disabledLogs.length === 0,
    "Disabling auto-allocation (threshold = 0) creates 0 term accounts and keeps funds liquid in pool"
  );

  // Test 7: Scheduled Withdrawals and Flexible Pool Deficit Handling (ADR-0001)
  const withdrawDate = addMonths(today, 1);
  const withdrawalPortfolio = [
    {
      "Account Name": "Small Pool",
      Principal: "20000000", // 20M in pool
      "Start Date": formatDate(today),
      "End Date": formatDate(oneYearLater),
      Interest: "0",
      Type: "Non-Term Pool",
      Bank: "Cash",
    },
    {
      "Account Name": "Locked 1Y Deposit",
      Principal: "100000000", // 100M locked
      "Start Date": formatDate(today),
      "End Date": formatDate(oneYearLater),
      Interest: "5.0",
      Type: "Term Saving",
      Bank: "VCB",
    },
    {
      "Account Name": "Car Purchase Outflow",
      Principal: "50000000", // 50M withdrawal (exceeds 20M liquid pool)
      "Start Date": formatDate(today),
      "End Date": formatDate(withdrawDate),
      Interest: "0",
      Type: "Withdrawal",
      Bank: "Outflow",
    },
  ];

  const deficitSimRes = simulate(
    {
      targetDateStr: formatDate(addMonths(today, 2)),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      term6MAnnualRate: 0,
      savingsGoal: 0,
    },
    withdrawalPortfolio
  );

  const withdrawalLogs = deficitSimRes.simulationLogs.filter(
    (l) => l.type === "WITHDRAWAL"
  );
  const deficitWarnings = deficitSimRes.simulationLogs.filter(
    (l) => l.type === "DEFICIT_WARNING"
  );

  assert(withdrawalLogs.length === 1, "Recorded scheduled withdrawal outflow");
  assert(
    deficitWarnings.length === 1,
    "Emitted DEFICIT_WARNING when scheduled withdrawal exceeded liquid flexible pool"
  );
  assert(
    deficitSimRes.totals.totalWithdrawals === 50000000,
    "Recorded total withdrawals in summary totals (50M VND)"
  );
  // Post-withdrawal pool balance should be 20M - 50M = -30M
  const postWithdrawSnap = deficitSimRes.dailySnapshots.find(
    (s) => s.date === formatDate(withdrawDate)
  );
  assert(
    postWithdrawSnap && Math.round(postWithdrawSnap.poolBalance) === -30000000,
    `Flexible pool accommodates negative deficit balance (-30,000,000 VND) without unliquidated term deposit disruption`
  );

  // Test 8: Savings Goal Milestone Detection
  const goalSimRes = simulate(
    {
      targetDateStr: formatDate(threeYearsLater),
      monthlySalary: 50000000, // 50M / month
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      term6MAnnualRate: 0,
      savingsGoal: 500000000, // 500M goal -> reached in ~10 months
    },
    []
  );

  assert(goalSimRes.goalReached === true, "Goal achievement detected");
  assert(
    typeof goalSimRes.goalReachedDate === "string" &&
      goalSimRes.goalReachedDate.startsWith("202"),
    `Goal milestone date identified: ${goalSimRes.goalReachedDate}`
  );

  // When goal is higher than possible wealth
  const unreachedGoalSimRes = simulate(
    {
      targetDateStr: formatDate(addMonths(today, 2)),
      monthlySalary: 1000000,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      term6MAnnualRate: 0,
      savingsGoal: 9999999999, // 10 Billion VND
    },
    []
  );
  assert(
    unreachedGoalSimRes.goalReached === false,
    "Goal correctly flagged as unreached when target is not crossed"
  );
  assert(
    unreachedGoalSimRes.goalReachedDate === null,
    "Milestone date is null when goal not reached"
  );

  // Test 9: Inflation Adjustment (Purchasing Power Discounting)
  const inflSimRes = simulate(
    {
      targetDateStr: formatDate(oneYearLater),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0.1, // 10% inflation
      poolAnnualRate: 0,
      term6MAnnualRate: 0,
      savingsGoal: 0,
    },
    [
      {
        "Account Name": "Static Principal",
        Principal: "110000000",
        "Start Date": formatDate(today),
        "End Date": formatDate(oneYearLater),
        Interest: "0",
        Type: "Non-Term Pool",
        Bank: "Cash",
      },
    ]
  );

  // Real value after 1 year with 10% inflation: 110M / (1 + 0.1)^1 = 100M
  const realVal = inflSimRes.totals.inflationAdjusted;
  assert(
    Math.abs(realVal - 100000000) < 1000,
    `Inflation purchasing power discounted accurately (${Math.round(realVal).toLocaleString()} VND vs nominal 110M)`
  );

  // Test 10: Cashflow Aggregations (Monthly & Yearly Cashflow Maps)
  assert(
    Object.keys(goalSimRes.monthlyCashflows).length > 0,
    `Aggregated ${Object.keys(goalSimRes.monthlyCashflows).length} months into monthlyCashflows map`
  );
  assert(
    Object.keys(goalSimRes.yearlyCashflows).length >= 3,
    `Aggregated ${Object.keys(goalSimRes.yearlyCashflows).length} years into yearlyCashflows map`
  );

  // Test 11: Leap year simulation & month edge transitions
  const leapYearSim = simulate(
    {
      targetDateStr: "2028-03-15",
      monthlySalary: 10000000,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0.05,
      term6MAnnualRate: 0.06,
      savingsGoal: 0,
    },
    [
      {
        "Account Name": "Leap Account",
        Principal: "10000000",
        "Start Date": "2028-02-01",
        "End Date": "2028-03-01",
        Interest: "5.0",
        Type: "Term Saving",
        Bank: "VCB",
      },
    ]
  );
  assert(
    leapYearSim !== null && leapYearSim.dailySnapshots.length > 0,
    "Leap year simulation completes seamlessly"
  );

  console.log(
    `\n📊 Simulation Test Summary: ${passCount} Passed, ${failCount} Failed\n`
  );
  if (failCount > 0) {
    process.exit(1);
  }
}

runSimulationTests().catch((err) => {
  console.error("Simulation test failed:", err);
  process.exit(1);
});
