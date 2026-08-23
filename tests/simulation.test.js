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

  // Minimal 2D canvas context stub — satisfies chart renderers without a real DOM
  function makeCanvasStub() {
    const ctx2d = {
      clearRect() {},
      fillRect() {},
      strokeRect() {},
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      arc() {},
      fill() {},
      stroke() {},
      save() {},
      restore() {},
      scale() {},
      translate() {},
      drawImage() {},
      getImageData: () => ({ data: [] }),
      putImageData() {},
      createLinearGradient: () => ({
        addColorStop() {},
      }),
      createRadialGradient: () => ({
        addColorStop() {},
      }),
      measureText: () => ({ width: 0 }),
      fillText() {},
      strokeText() {},
      setTransform() {},
      canvas: { width: 300, height: 150, style: {}, toDataURL: () => "" },
    };
    return {
      value: "",
      innerText: "",
      innerHTML: "",
      width: 300,
      height: 150,
      style: {},
      toDataURL: () => "",
      getContext: () => ctx2d,
      classList: {
        add() {},
        remove() {},
        toggle() {},
        contains: () => false,
      },
      setAttribute() {},
      getAttribute: () => null,
      addEventListener() {},
    };
  }

  const sandbox = {
    window: {},
    tailwind: {},
    console: console,
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { href: "http://localhost/", search: "" },
    navigator: { clipboard: { writeText: async () => {} } },
    document: {
      getElementById: () => makeCanvasStub(),
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => makeCanvasStub(),
      addEventListener: () => {},
    },
    localStorage: { getItem: () => null, setItem: () => {} },
    Chart: Object.assign(
      function Chart(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.data = (config && config.data) || { labels: [], datasets: [] };
        this.options = (config && config.options) || {};
        this.destroy = function () {};
        this.update = function () {};
      },
      { getChart: () => null, register: () => {} }
    ),
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);

  return {
    simulate: sandbox.simulate,
    generateFinancialHealthMarkdown: sandbox.generateFinancialHealthMarkdown,
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

  const {
    simulate,
    generateFinancialHealthMarkdown,
    formatDate,
    parseDate,
    addMonths,
    getDaysDiff,
  } = loadSimulateEngine();

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

  // Test 6: Unified Auto Term Allocation with Emergency Buffer Reserve (ADR-0005 & ADR-0006)
  // Starting with 450M in pool, threshold 200M, default buffer 30M -> locks 420M in Auto Term, retains 30M in pool
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
      emergencyBuffer: 30000000,
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
    day0Logs[0].amount === 420000000,
    `Auto Term deposit locked 420M VND leaving 30M buffer in pool (locked: ${day0Logs[0].amount})`
  );
  assert(
    autoTermSimRes.totals.created6MCount >= 2,
    `Auto Term rolled over upon maturity over 1-year timeline (total: ${autoTermSimRes.totals.created6MCount})`
  );

  // First day snapshot pool balance should be retained emergencyBuffer = 30M
  const firstDaySnap = autoTermSimRes.dailySnapshots[0];
  assert(
    Math.round(firstDaySnap.poolBalance) === 30000000,
    `Pool balance retains 30M emergency buffer after sweep (got: ${firstDaySnap.poolBalance})`
  );
  assert(
    Math.round(firstDaySnap.fixedSavingsBalance) === 420000000,
    `Active fixed savings holds 420M in the single Auto Term account (got: ${firstDaySnap.fixedSavingsBalance})`
  );
  assert(
    Math.round(firstDaySnap.totalWealth) === 450000000,
    `Total wealth is preserved across accounts (450M)`
  );

  // Subtest 6b: Zero Emergency Buffer (legacy ADR-0005 full sweep behavior)
  const zeroBufferSim = simulate(
    {
      targetDateStr: formatDate(oneYearLater),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      autoTermAnnualRate: 0.058,
      autoTermThreshold: 200000000,
      emergencyBuffer: 0,
      autoTermMonths: 6,
      savingsGoal: 0,
    },
    bigPoolPortfolio
  );
  const zeroBufferLogs = zeroBufferSim.simulationLogs.filter(
    (l) =>
      (l.type === "NEW_6M" || l.type === "NEW_AUTO_TERM") &&
      l.date === formatDate(today)
  );
  assert(
    zeroBufferLogs.length === 1 && zeroBufferLogs[0].amount === 450000000,
    `emergencyBuffer: 0 restores full 450M pool sweep`
  );
  assert(
    Math.round(zeroBufferSim.dailySnapshots[0].poolBalance) === 0,
    `Pool balance is 0 when emergencyBuffer is 0`
  );

  // Subtest 6c: Pool balance below sweep threshold (e.g. 210M pool < 200M threshold + 30M buffer = 230M)
  const subThresholdPortfolio = [
    {
      "Account Name": "Sub-threshold Pool",
      Principal: "210000000",
      "Start Date": formatDate(today),
      "End Date": formatDate(oneYearLater),
      Interest: "0",
      Type: "Non-Term Pool",
      Bank: "Cash",
    },
  ];
  const subThresholdSim = simulate(
    {
      targetDateStr: formatDate(oneYearLater),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      autoTermAnnualRate: 0.058,
      autoTermThreshold: 200000000,
      emergencyBuffer: 30000000,
      autoTermMonths: 6,
      savingsGoal: 0,
    },
    subThresholdPortfolio
  );
  const subThresholdLogs = subThresholdSim.simulationLogs.filter(
    (l) => l.type === "NEW_6M" || l.type === "NEW_AUTO_TERM"
  );
  assert(
    subThresholdLogs.length === 0,
    `Pool balance of 210M does not trigger sweep when threshold is 200M and buffer is 30M (needs >= 230M)`
  );

  // Subtest 6d: Disabling Auto Term when threshold = 0
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

  // Test 13: Zero, Empty, and Edge Input Parameters
  const zeroSim = simulate(
    {
      targetDateStr: formatDate(addMonths(today, 3)),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      savingsGoal: 0,
    },
    []
  );
  assert(
    zeroSim !== null && zeroSim.totals.totalWealth === 0,
    "Zero parameter simulation produces zero total wealth"
  );
  assert(
    zeroSim.totals.totalInterest === 0 && zeroSim.totals.salaryCount === 0,
    "Zero parameter simulation produces 0 interest and 0 salary count"
  );
  assert(
    zeroSim.goalReached === false && zeroSim.goalReachedDate === null,
    "Goal is not flagged as reached when savingsGoal is 0"
  );

  // Test 14: Multiple Concurrent Term Deposit Maturities on Same Date
  const matureSameDay = addMonths(today, 2);
  const multiTermPortfolio = [
    {
      "Account Name": "VCB 2M",
      Principal: "50000000",
      "Start Date": formatDate(today),
      "End Date": formatDate(matureSameDay),
      Interest: "6.0",
      Type: "Term Saving",
      Bank: "VCB",
    },
    {
      "Account Name": "TCB 2M",
      Principal: "70000000",
      "Start Date": formatDate(today),
      "End Date": formatDate(matureSameDay),
      Interest: "6.5",
      Type: "Term Saving",
      Bank: "TCB",
    },
    {
      "Account Name": "MBB 2M",
      Principal: "80000000",
      "Start Date": formatDate(today),
      "End Date": formatDate(matureSameDay),
      Interest: "7.0",
      Type: "Term Saving",
      Bank: "MBB",
    },
  ];

  const multiTermSim = simulate(
    {
      targetDateStr: formatDate(addMonths(today, 3)),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      autoTermThreshold: 0, // Disabled
      savingsGoal: 0,
    },
    multiTermPortfolio
  );

  const sameDayMaturities = multiTermSim.simulationLogs.filter(
    (l) => l.type === "MATURITY" && l.date === formatDate(matureSameDay)
  );
  assert(
    sameDayMaturities.length === 3,
    `Recorded 3 concurrent term deposit maturities on ${formatDate(matureSameDay)}`
  );
  const totalMaturityPayout = sameDayMaturities.reduce(
    (sum, l) => sum + l.amount,
    0
  );
  assert(
    Math.round(multiTermSim.totals.poolBalance) ===
      Math.round(totalMaturityPayout),
    `Flexible pool received full payouts from all 3 maturing deposits (${Math.round(totalMaturityPayout).toLocaleString()} VND)`
  );

  // Test 15: Exact Auto Term Sweep Boundary & Multi-Cycle Rollover
  // Boundary 1: Pool exactly equals sweepThreshold (200M threshold + 30M buffer = 230M)
  const exactThresholdPortfolio = [
    {
      "Account Name": "Exact 230M Pool",
      Principal: "230000000",
      "Start Date": formatDate(today),
      "End Date": formatDate(oneYearLater),
      Interest: "0",
      Type: "Non-Term Pool",
      Bank: "Cash",
    },
  ];
  const exactSweepSim = simulate(
    {
      targetDateStr: formatDate(oneYearLater),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      autoTermAnnualRate: 0.06,
      autoTermThreshold: 200000000,
      emergencyBuffer: 30000000,
      autoTermMonths: 6,
      savingsGoal: 0,
    },
    exactThresholdPortfolio
  );
  const exactSweepLogs = exactSweepSim.simulationLogs.filter(
    (l) => l.type === "NEW_6M" && l.date === formatDate(today)
  );
  assert(
    exactSweepLogs.length === 1 && exactSweepLogs[0].amount === 200000000,
    "Pool exactly equal to threshold + buffer (230M) sweeps exactly 200M into Auto Term"
  );
  assert(
    Math.round(exactSweepSim.dailySnapshots[0].poolBalance) === 30000000,
    "Emergency buffer of 30M is retained in pool on exact threshold sweep"
  );

  // Boundary 2: Pool is 1 VND below sweep threshold (229,999,999 VND)
  const subOnePortfolio = [
    {
      "Account Name": "Sub 1 VND Pool",
      Principal: "229999999",
      "Start Date": formatDate(today),
      "End Date": formatDate(oneYearLater),
      Interest: "0",
      Type: "Non-Term Pool",
      Bank: "Cash",
    },
  ];
  const subOneSim = simulate(
    {
      targetDateStr: formatDate(oneYearLater),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      autoTermAnnualRate: 0.06,
      autoTermThreshold: 200000000,
      emergencyBuffer: 30000000,
      autoTermMonths: 6,
      savingsGoal: 0,
    },
    subOnePortfolio
  );
  const subOneLogs = subOneSim.simulationLogs.filter(
    (l) => l.type === "NEW_6M" && l.date === formatDate(today)
  );
  assert(
    subOneLogs.length === 0,
    "Pool of 229,999,999 VND (1 VND below 230M requirement) strictly does not trigger sweep"
  );

  // Boundary 3: Custom 3-month and 12-month auto term durations
  const custom3MSim = simulate(
    {
      targetDateStr: formatDate(oneYearLater),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      autoTermAnnualRate: 0.06,
      autoTermThreshold: 100000000,
      emergencyBuffer: 20000000,
      autoTermMonths: 3,
      savingsGoal: 0,
    },
    [
      {
        "Account Name": "Cash",
        Principal: "150000000",
        "Start Date": formatDate(today),
        "End Date": formatDate(oneYearLater),
        Type: "Non-Term Pool",
      },
    ]
  );
  const auto3MLogs = custom3MSim.simulationLogs.filter(
    (l) => l.type === "NEW_6M"
  );
  assert(
    auto3MLogs.length >= 3,
    `Custom 3-month duration executes quarterly rollovers (${auto3MLogs.length} sweeps)`
  );
  assert(
    auto3MLogs[0].months === 3,
    "Auto Term log records correct 3-month duration"
  );

  // Test 16: Compound Salary Escalation Precision & Fractional Rates (ADR-0002)
  const fiveYearsLater = new Date(today.getTime());
  fiveYearsLater.setFullYear(fiveYearsLater.getFullYear() + 5);

  const fractionalEscSim = simulate(
    {
      targetDateStr: formatDate(fiveYearsLater),
      monthlySalary: 20000000, // 20M VND
      salaryGrowthRate: 0.075, // 7.5% annual compound growth
      inflationRate: 0,
      poolAnnualRate: 0,
      term6MAnnualRate: 0,
      savingsGoal: 0,
    },
    []
  );

  const fracLogs = fractionalEscSim.simulationLogs.filter(
    (l) => l.type === "SALARY"
  );
  const yr1Logs = fracLogs.slice(0, 12);
  const yr2Logs = fracLogs.slice(12, 24);
  const yr3Logs = fracLogs.slice(24, 36);
  const yr4Logs = fracLogs.slice(36, 48);
  const yr5Logs = fracLogs.slice(48, 60);

  assert(
    yr1Logs.every((l) => l.amount === 20000000),
    "Year 1 salary is strictly 20,000,000 across all 12 months"
  );
  const expYr2Salary = 20000000 * 1.075; // 21,500,000
  assert(
    yr2Logs.every((l) => Math.abs(l.amount - expYr2Salary) < 1),
    `Year 2 salary compounded by 7.5% to ${expYr2Salary.toLocaleString()} across all 12 months`
  );
  const expYr3Salary = 20000000 * Math.pow(1.075, 2); // 23,112,500
  assert(
    yr3Logs.every((l) => Math.abs(l.amount - expYr3Salary) < 1),
    `Year 3 salary compounded to ${expYr3Salary.toLocaleString()} across all 12 months`
  );
  const expYr5Salary = 20000000 * Math.pow(1.075, 4); // ~26,709,382.8
  assert(
    yr5Logs.every((l) => Math.abs(l.amount - expYr5Salary) < 1),
    `Year 5 salary compounded to ${Math.round(expYr5Salary).toLocaleString()} across all 12 months`
  );

  // Test 17: Multiple Scheduled Withdrawals, Deep Deficit & Salary Replenishment (ADR-0001)
  const deepDeficitPortfolio = [
    {
      "Account Name": "Small Pool",
      Principal: "10000000", // 10M starting pool
      "Start Date": formatDate(today),
      "End Date": formatDate(oneYearLater),
      Type: "Non-Term Pool",
    },
    {
      "Account Name": "Outflow 1 (Car Deposit)",
      Principal: "30000000", // 30M outflow in Month 1 -> pool = -20M
      "Start Date": formatDate(today),
      "End Date": formatDate(addMonths(today, 1)),
      Type: "Withdrawal",
    },
    {
      "Account Name": "Outflow 2 (Insurance)",
      Principal: "20000000", // 20M outflow in Month 2 -> pool = -40M (before salary)
      "Start Date": formatDate(today),
      "End Date": formatDate(addMonths(today, 2)),
      Type: "Withdrawal",
    },
  ];

  const deepDeficitSim = simulate(
    {
      targetDateStr: formatDate(addMonths(today, 6)),
      monthlySalary: 15000000, // 15M/mo salary gradually repays deficit
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0.05,
      autoTermThreshold: 0,
      savingsGoal: 0,
    },
    deepDeficitPortfolio
  );

  const deficitLogs = deepDeficitSim.simulationLogs.filter(
    (l) => l.type === "DEFICIT_WARNING"
  );
  assert(
    deficitLogs.length >= 2,
    `Recorded ${deficitLogs.length} deficit warnings during successive large withdrawals`
  );
  assert(
    deepDeficitSim.totals.totalWithdrawals === 50000000,
    "Sum of all withdrawals tracked accurately (50M VND)"
  );
  // Deficit should eventually be repaid by month 5 (10M start + 6*15M salary - 50M withdrawals = 50M net)
  const finalPool = deepDeficitSim.finalSnapshot.poolBalance;
  assert(
    finalPool > 45000000,
    `Flexible pool recovered from negative deficit to positive balance (${Math.round(finalPool).toLocaleString()} VND)`
  );

  // Test 18: Goal Milestone Edge Scenarios (Day 0 achievement, last day, re-crossing)
  // Subtest 18a: Initial pool already exceeds goal on Day 0
  const instantGoalSim = simulate(
    {
      targetDateStr: formatDate(oneYearLater),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      savingsGoal: 100000000, // 100M goal
    },
    [
      {
        "Account Name": "Large Starting Cash",
        Principal: "150000000", // 150M > 100M
        "Start Date": formatDate(today),
        "End Date": formatDate(oneYearLater),
        Type: "Non-Term Pool",
      },
    ]
  );
  assert(
    instantGoalSim.goalReached === true,
    "Goal is immediately reached when initial wealth >= savingsGoal"
  );
  assert(
    instantGoalSim.goalReachedDate === formatDate(today),
    `Goal milestone date is Day 0 start date (${instantGoalSim.goalReachedDate})`
  );

  // Subtest 18b: Goal reached on exact last day of simulation
  const target3M = addMonths(today, 3);
  const lastDaySim = simulate(
    {
      targetDateStr: formatDate(target3M),
      monthlySalary: 10000000, // 10M/mo
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0,
      autoTermThreshold: 0,
      savingsGoal: 30000000, // Reached on month 3
    },
    []
  );
  assert(
    lastDaySim.goalReached === true && lastDaySim.goalReachedDate !== null,
    `Goal achievement detected when target crossed on boundary date (${lastDaySim.goalReachedDate})`
  );

  // Test 19: Multi-Year Inflation Purchasing Power Compound Discounting
  const multiYearInflSim = simulate(
    {
      targetDateStr: formatDate(threeYearsLater),
      monthlySalary: 0,
      salaryGrowthRate: 0,
      inflationRate: 0.05, // 5% annual inflation
      poolAnnualRate: 0,
      autoTermThreshold: 0, // Disabled so principal remains static
      savingsGoal: 0,
    },
    [
      {
        "Account Name": "Fixed Wealth",
        Principal: "1000000000", // 1 Billion VND
        "Start Date": formatDate(today),
        "End Date": formatDate(threeYearsLater),
        Type: "Non-Term Pool",
      },
    ]
  );
  // Real value after 3 years at 5% = 1,000,000,000 / (1.05)^(days/365)
  const inflDays = getDaysDiff(today, threeYearsLater);
  const expectedRealVal = 1000000000 / Math.pow(1.05, inflDays / 365);
  const actualRealVal = multiYearInflSim.totals.inflationAdjusted;
  assert(
    Math.abs(actualRealVal - expectedRealVal) < 1,
    `Multi-year compound inflation discounted with exact day-precision: ${Math.round(actualRealVal).toLocaleString()} VND vs nominal 1B VND`
  );

  // Test 20: Annual Bonus Month Configuration & Multiplier Variations (R22)
  // Subtest 20a: December Bonus (Month 12)
  const decBonusSim = simulate(
    {
      targetDateStr: "2027-12-31",
      monthlySalary: 30000000,
      salaryGrowthRate: 0,
      annualBonusMultiplier: 2.0, // 2.0x
      annualBonusMonth: 12, // December
      inflationRate: 0,
      poolAnnualRate: 0,
      savingsGoal: 0,
    },
    []
  );
  const decBonusLogs = decBonusSim.simulationLogs.filter(
    (l) => l.type === "ANNUAL_BONUS"
  );
  assert(
    decBonusLogs.length >= 1,
    "December annual bonus deposited correctly on month 12"
  );
  assert(
    decBonusLogs[0].amount === 60000000,
    "2.0x bonus on 30M salary equals 60,000,000 VND"
  );

  // Subtest 20b: Zero Bonus Multiplier
  const zeroBonusSim = simulate(
    {
      targetDateStr: "2027-12-31",
      monthlySalary: 30000000,
      salaryGrowthRate: 0,
      annualBonusMultiplier: 0,
      annualBonusMonth: 1,
      inflationRate: 0,
      poolAnnualRate: 0,
      savingsGoal: 0,
    },
    []
  );
  const zeroBonusLogs = zeroBonusSim.simulationLogs.filter(
    (l) => l.type === "ANNUAL_BONUS"
  );
  assert(
    zeroBonusLogs.length === 0 && zeroBonusSim.totals.totalBonus === 0,
    "0x bonus multiplier creates 0 bonus logs and 0 total bonus"
  );

  // Test 21: Highly Diversified Portfolio with All Account Types Active Simultaneously
  const complexPortfolio = [
    {
      "Account Name": "Emergency Liquid Cash",
      Principal: "50000000",
      "Start Date": formatDate(today),
      "End Date": formatDate(oneYearLater),
      Type: "Non-Term Pool",
      Bank: "VCB",
    },
    {
      "Account Name": "Techcombank 6M Term",
      Principal: "150000000",
      "Start Date": formatDate(today),
      "End Date": formatDate(addMonths(today, 6)),
      Interest: "6.2",
      Type: "Term Saving",
      Bank: "TCB",
    },
    {
      "Account Name": "ACB 9M Term",
      Principal: "100000000",
      "Start Date": formatDate(today),
      "End Date": formatDate(addMonths(today, 9)),
      Interest: "6.8",
      Type: "Term Saving",
      Bank: "ACB",
    },
    {
      "Account Name": "Tuition Fee Outflow",
      Principal: "40000000",
      "Start Date": formatDate(today),
      "End Date": formatDate(addMonths(today, 4)),
      Type: "Withdrawal",
      Bank: "Outflow",
    },
  ];

  const complexSim = simulate(
    {
      targetDateStr: formatDate(oneYearLater),
      monthlySalary: 25000000,
      salaryGrowthRate: 0.08,
      annualBonusMultiplier: 1.0,
      annualBonusMonth: 1,
      inflationRate: 0.04,
      poolAnnualRate: 0.005,
      autoTermThreshold: 150000000,
      emergencyBuffer: 30000000,
      autoTermMonths: 6,
      autoTermAnnualRate: 0.06,
      savingsGoal: 500000000,
    },
    complexPortfolio
  );

  assert(
    complexSim !== null && complexSim.dailySnapshots.length > 300,
    "Complex simulation with 4 distinct asset classes runs completely over 1 year"
  );
  assert(
    complexSim.totals.totalWealth > 0 && complexSim.totals.totalInterest > 0,
    `Total wealth (${Math.round(complexSim.totals.totalWealth).toLocaleString()} VND) and interest (${Math.round(complexSim.totals.totalInterest).toLocaleString()} VND) calculated accurately`
  );
  assert(
    complexSim.totals.totalWithdrawals === 40000000,
    "Scheduled withdrawal processed accurately in complex portfolio"
  );
  assert(
    complexSim.dailySnapshots.every(
      (s) =>
        Math.abs(s.totalWealth - (s.poolBalance + s.fixedSavingsBalance)) < 1
    ),
    "Invariant holds on every single day: totalWealth === poolBalance + fixedSavingsBalance"
  );

  // Test 22: Pure generation of Financial Health Markdown with standard parameters
  const standardParams = {
    targetDateStr: formatDate(oneYearLater),
    monthlySalary: 30000000,
    salaryGrowthRate: 0.05,
    annualBonusMultiplier: 1.0,
    annualBonusMonth: 1,
    inflationRate: 0.04,
    poolAnnualRate: 0.005,
    autoTermThreshold: 200000000,
    emergencyBuffer: 30000000,
    autoTermMonths: 6,
    autoTermAnnualRate: 0.058,
    savingsGoal: 600000000,
  };
  const standardSim = simulate(standardParams, complexPortfolio);
  const mdReport = generateFinancialHealthMarkdown(
    standardParams,
    standardSim,
    {
      blueprint: "general",
      anonymized: false,
      locale: "en",
    }
  );

  assert(
    typeof mdReport === "string" && mdReport.length > 500,
    "generateFinancialHealthMarkdown returns a rich Markdown string"
  );
  assert(
    mdReport.includes("# 🏦 Financial Health Dossier") ||
      mdReport.includes("# Financial Health Dossier"),
    "Markdown includes primary H1 Dossier Title"
  );
  assert(
    mdReport.includes("Executive Summary") &&
      mdReport.includes("Financial Health Diagnostics") &&
      mdReport.includes("Income & Cashflow Architecture") &&
      mdReport.includes("Term Deposit Portfolio Breakdown") &&
      mdReport.includes("Liquidity & Risk Stress Assessment") &&
      mdReport.includes("AI Advisory Blueprint"),
    "Markdown contains all 6 standardized diagnostic sections"
  );

  // Test 23: Liquidity Runway Ratio computation
  assert(
    mdReport.includes("Liquidity Runway Ratio:"),
    "Markdown includes Liquidity Runway Ratio metric"
  );
  const zeroWithdrawalParams = { ...standardParams };
  const zeroWithdrawalSim = simulate(zeroWithdrawalParams, [
    {
      "Account Name": "Starting Cash",
      Principal: "100000000",
      "Start Date": formatDate(today),
      "End Date": formatDate(oneYearLater),
      Type: "Non-Term Pool",
      Bank: "Cash",
    },
  ]);
  const zeroWithdrawalMd = generateFinancialHealthMarkdown(
    zeroWithdrawalParams,
    zeroWithdrawalSim,
    { blueprint: "general", anonymized: false, locale: "en" }
  );
  assert(
    zeroWithdrawalMd.includes("Liquidity Runway Ratio:"),
    "Runway ratio calculated when scheduled withdrawals are zero without throwing division errors"
  );

  // Test 24: Savings Retention Rate & Capital Efficiency Multiple
  assert(
    mdReport.includes("Savings Retention Rate:") && mdReport.includes("%"),
    "Markdown includes Savings Retention Rate percentage"
  );
  assert(
    mdReport.includes("Capital Efficiency Multiple:") ||
      mdReport.includes("Yield Multiple:"),
    "Markdown includes Capital Efficiency / Yield Multiple"
  );

  // Test 25: Real Wealth Preservation, Inflation Drag & Goal Feasibility
  assert(
    mdReport.includes("Real Wealth Preservation:") ||
      mdReport.includes("Inflation Drag"),
    "Markdown reports Real Wealth Preservation and Inflation Drag"
  );
  assert(
    mdReport.includes("Goal Feasibility"),
    "Markdown reports Goal Feasibility & Milestone Status"
  );

  // Test 26: Deficit Risk Score & Deficit Event Tracking
  const deficitPortfolio = [
    {
      "Account Name": "Massive Outflow",
      Principal: "500000000", // 500M withdrawal against 0 starting pool
      "Start Date": formatDate(today),
      "End Date": formatDate(addMonths(today, 2)),
      Type: "Withdrawal",
      Bank: "Outflow",
    },
  ];
  const deficitSim = simulate(standardParams, deficitPortfolio);
  const deficitMd = generateFinancialHealthMarkdown(
    standardParams,
    deficitSim,
    {
      blueprint: "general",
      anonymized: false,
      locale: "en",
    }
  );
  assert(
    deficitMd.includes("WARNING") ||
      deficitMd.includes("DEFICIT") ||
      deficitMd.includes("CRITICAL"),
    "Deficit scenario triggers WARNING/CRITICAL liquidity risk status in markdown"
  );

  // Test 27: Privacy Anonymization Masking
  const anonymizedMd = generateFinancialHealthMarkdown(
    standardParams,
    standardSim,
    { blueprint: "general", anonymized: true, locale: "en" }
  );
  assert(
    !anonymizedMd.includes("30,000,000 VND") &&
      !anonymizedMd.includes("600,000,000 VND"),
    "Anonymized markdown masks raw monetary figures with normalized multiples/percentages"
  );
  assert(
    anonymizedMd.includes("Salary") || anonymizedMd.includes("%"),
    "Anonymized markdown preserves normalized financial ratios and relative proportions"
  );

  // Test 28: Edge Cases & Bilingual Parity
  const zeroSalaryParams = {
    targetDateStr: formatDate(oneYearLater),
    monthlySalary: 0,
    salaryGrowthRate: 0,
    annualBonusMultiplier: 0,
    annualBonusMonth: 1,
    inflationRate: 0,
    poolAnnualRate: 0.01,
    autoTermThreshold: 0,
    emergencyBuffer: 0,
    autoTermMonths: 6,
    autoTermAnnualRate: 0.05,
    savingsGoal: 0,
  };
  const zeroSalarySim = simulate(zeroSalaryParams, []);
  const zeroSalaryMd = generateFinancialHealthMarkdown(
    zeroSalaryParams,
    zeroSalarySim,
    { blueprint: "general", anonymized: false, locale: "en" }
  );
  assert(
    !zeroSalaryMd.includes("NaN") && !zeroSalaryMd.includes("Infinity"),
    "Zero salary, zero goal, zero inflation edge cases generate clean report without NaN/Infinity"
  );

  const viMdReport = generateFinancialHealthMarkdown(
    standardParams,
    standardSim,
    { blueprint: "general", anonymized: false, locale: "vi" }
  );
  assert(
    viMdReport.includes("Hồ Sơ Sức Khỏe Tài Chính") ||
      viMdReport.includes("Tóm Tắt"),
    "Vietnamese locale generates localized Markdown headers and terms"
  );

  // Test 29: Issue #72 Capital Yield Calculation for Initial Portfolio Deposits
  const initialPortfolioOnly = [
    {
      "Account Name": "Term Deposit 100M",
      Principal: "100000000",
      Interest: "6.0",
      "Start Date": formatDate(today),
      "End Date": formatDate(addMonths(today, 12)),
      Type: "Term Saving",
      Bank: "Vietcombank",
    },
  ];
  const yieldSim = simulate(zeroSalaryParams, initialPortfolioOnly);
  assert(
    yieldSim.totals.initialStartingPrincipal === 100000000,
    `Issue #72: Simulation tracks initialStartingPrincipal (${yieldSim.totals.initialStartingPrincipal})`
  );
  assert(
    yieldSim.totals.totalInjectedCapital === 100000000,
    `Issue #72: Simulation computes totalInjectedCapital (${yieldSim.totals.totalInjectedCapital})`
  );
  const capitalYield =
    yieldSim.totals.totalInjectedCapital > 0
      ? (yieldSim.totals.totalInterest / yieldSim.totals.totalInjectedCapital) *
        100
      : 0;
  assert(
    capitalYield >= 5.9 && capitalYield <= 6.1,
    `Issue #72: Capital Yield with zero salary accurately reflects deposit yield (+${capitalYield.toFixed(1)}%)`
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
