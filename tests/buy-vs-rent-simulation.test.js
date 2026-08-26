const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyVsRentEngine() {
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
    window: {},
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
    },
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

function assertClose(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(
      `  ✅ PASS: ${message} (${actual.toFixed(2)} ≈ ${expected.toFixed(2)})`
    );
    passed++;
  } else {
    console.error(
      `  ❌ FAIL: ${message} (Actual: ${actual}, Expected: ${expected}, Diff: ${diff})`
    );
    failed++;
  }
}

console.log("\n🧪 Running Buy vs. Rent Pure Simulation Engine Test Suite...\n");

try {
  const engine = loadBuyVsRentEngine();

  // Test 1: Engine functions exported
  assert(
    typeof engine.simulateBuyVsRent === "function",
    "simulateBuyVsRent is defined as a pure function"
  );
  assert(
    typeof engine.calculateMortgagePayment === "function",
    "calculateMortgagePayment helper is defined"
  );
  assert(
    typeof engine.calculatePriceToRentRatio === "function",
    "calculatePriceToRentRatio helper is defined"
  );
  assert(
    typeof engine.calculateGrossRentalYield === "function",
    "calculateGrossRentalYield helper is defined"
  );
  assert(
    typeof engine.DEFAULT_BUY_VS_RENT_PARAMS === "object",
    "DEFAULT_BUY_VS_RENT_PARAMS is exported"
  );

  // Test 2: Price-to-Rent Ratio and Gross Rental Yield math
  const prr = engine.calculatePriceToRentRatio(3600000000, 15000000);
  assertClose(
    prr,
    20.0,
    0.01,
    "PRR accurately computes Home Price / Annual Rent (3.6B / 180M = 20.0)"
  );

  const yieldPct = engine.calculateGrossRentalYield(3600000000, 15000000);
  assertClose(
    yieldPct,
    5.0,
    0.01,
    "Gross Rental Yield computes (Annual Rent / Home Price) * 100 = 5.0%"
  );

  // Test 3: Fixed EMI Mortgage Amortization Calculation
  // 1 Billion VND at 12% annual rate for 20 years (240 months):
  // Monthly rate = 1%, (1+0.01)^240 = 10.89255
  // EMI = 1,000,000,000 * (0.01 * 10.89255) / (9.89255) ≈ 11,010,860 VND
  const emiPayment = engine.calculateMortgagePayment({
    principal: 1000000000,
    annualRate: 12.0,
    tenureMonths: 240,
    scheme: "fixed_emi",
  });
  assertClose(
    emiPayment,
    11010860,
    50,
    "Fixed EMI monthly payment matches standard banking annuity formula"
  );

  // Test 4: Linear Principal First Month Payment
  // 1 Billion VND at 12% annual rate for 240 months:
  // Base Principal = 1,000,000,000 / 240 = 4,166,666.67 VND
  // Interest Month 1 = 1,000,000,000 * 1% = 10,000,000 VND
  // Total Payment Month 1 = 14,166,666.67 VND
  const linearPaymentMonth1 = engine.calculateMortgagePayment({
    principal: 1000000000,
    annualRate: 12.0,
    tenureMonths: 240,
    scheme: "linear_principal",
    currentRemainingPrincipal: 1000000000,
  });
  assertClose(
    linearPaymentMonth1,
    14166667,
    50,
    "Linear principal month 1 payment matches Equal Principal + Month 1 Interest"
  );

  // Test 5: Full Simulation Execution with Default Parameters
  const defaultParams = { ...engine.DEFAULT_BUY_VS_RENT_PARAMS };
  const simResult = engine.simulateBuyVsRent(defaultParams);

  assert(
    simResult && typeof simResult === "object",
    "simulateBuyVsRent returns valid result object"
  );
  assert(
    Array.isArray(simResult.timeline),
    "simResult contains timeline array"
  );
  assert(
    simResult.timeline.length === defaultParams.horizonYears * 12,
    `Timeline contains exact month count (${defaultParams.horizonYears * 12} months)`
  );
  assert(
    simResult.summary && typeof simResult.summary === "object",
    "simResult contains summary KPIs"
  );

  // Test 6: Upfront Cash Flow Equivalence
  const expectedDownpayment =
    defaultParams.homePrice * (defaultParams.downpaymentPercent / 100);
  const expectedRegTax =
    defaultParams.homePrice * (defaultParams.registrationTaxRate / 100);
  const expectedNotary =
    defaultParams.homePrice * (defaultParams.notaryAndLegalRate / 100);
  const expectedInitialBuyOutflow =
    expectedDownpayment +
    expectedRegTax +
    expectedNotary +
    defaultParams.initialFurnishingAmount +
    defaultParams.loanOriginationAndInsurance;

  const expectedInitialSecurityDeposit =
    defaultParams.monthlyRent * defaultParams.securityDepositMonths;
  const expectedInitialRentOutflow =
    expectedInitialSecurityDeposit + defaultParams.initialRenterMoveInCost;
  const expectedStartingPortfolio =
    expectedInitialBuyOutflow - expectedInitialRentOutflow;

  assertClose(
    simResult.summary.initialBuyOutflow,
    expectedInitialBuyOutflow,
    1,
    "Summary initialBuyOutflow matches sum of downpayment, taxes, fit-out, and origination"
  );
  assertClose(
    simResult.summary.initialRentPortfolio,
    expectedStartingPortfolio,
    1,
    "Initial rent investment portfolio equals initial buy outflows minus deposit and move-in setup"
  );

  // Test 7: Teaser Rate vs Floating Rate Transition in Mortgage
  const month1 = simResult.timeline[0];
  const monthTeaserEnd = simResult.timeline[defaultParams.teaserRateMonths - 1];
  const monthFloatingStart = simResult.timeline[defaultParams.teaserRateMonths];

  assert(
    month1.mortgageInterestRate === defaultParams.teaserAnnualRate,
    `Month 1 uses teaser interest rate (${defaultParams.teaserAnnualRate}%)`
  );
  assert(
    monthTeaserEnd.mortgageInterestRate === defaultParams.teaserAnnualRate,
    `Month ${defaultParams.teaserRateMonths} uses teaser rate`
  );
  assert(
    monthFloatingStart.mortgageInterestRate ===
      defaultParams.floatingAnnualRate,
    `Month ${defaultParams.teaserRateMonths + 1} transitions to floating benchmark rate (${defaultParams.floatingAnnualRate}%)`
  );

  // Test 8: Property Appreciation Math on Timeline
  const month12 = simResult.timeline[11];
  const expectedYear1HomeValue =
    defaultParams.homePrice *
    (1 + defaultParams.propertyAppreciationRate / 100);
  assertClose(
    month12.homeMarketValue,
    expectedYear1HomeValue,
    1000,
    "Property market value at month 12 reflects annual compound appreciation rate"
  );

  // Test 9: Selling Friction Deduction on Realizable Net Worth
  const monthLast = simResult.timeline[simResult.timeline.length - 1];
  const expectedSellingFriction =
    monthLast.homeMarketValue * (defaultParams.sellingFrictionRate / 100);
  assertClose(
    monthLast.sellingFriction,
    expectedSellingFriction,
    100,
    "Selling friction correctly computes configured percentage of final market value"
  );
  const expectedRealizableEquity =
    monthLast.homeMarketValue -
    monthLast.remainingLoanPrincipal -
    monthLast.sellingFriction;
  assertClose(
    monthLast.netWorthBuyNominal,
    expectedRealizableEquity,
    100,
    "Buy nominal net worth strictly equals Market Value - Debt - Selling Friction"
  );

  // Test 10: Rent Escalation Math on Timeline
  const expectedYear2Rent =
    defaultParams.monthlyRent * (1 + defaultParams.rentInflationRate / 100);
  const month13 = simResult.timeline[12];
  assertClose(
    month13.monthlyRent,
    expectedYear2Rent,
    1,
    "Monthly rent steps up on 12-month anniversary based on rent inflation rate"
  );

  // Test 11: Opportunity Cost Cashflow Delta Reinvestment
  // If Buy outflow > Rent outflow, delta > 0 and Rent portfolio receives positive injection
  assert(
    month1.monthlyBuyOutflow > month1.monthlyRentOutflow,
    "Month 1 Buy outflow exceeds Rent outflow"
  );
  assert(
    month1.cashflowDelta > 0,
    "Month 1 cashflow delta is positive (savings swept to Rent portfolio)"
  );
  assert(
    month1.rentPortfolioBalance > expectedStartingPortfolio,
    "Month 1 rent portfolio balance increases from monthly savings delta plus compound yield"
  );

  // Test 12: Real vs Nominal Purchasing Power Discounting
  const discountFactorYear10 = Math.pow(
    1 + defaultParams.cpiInflationRate / 100,
    10
  );
  const month120 = simResult.timeline[119];
  assertClose(
    month120.netWorthBuyReal,
    month120.netWorthBuyNominal / discountFactorYear10,
    100,
    "Month 120 (Year 10) real purchasing power discount strictly follows continuous CPI inflation formula"
  );

  // Test 13: Crossover Detection
  assert(
    typeof simResult.summary.crossoverMonth === "number" ||
      simResult.summary.crossoverMonth === null,
    "Crossover month is either a valid timeline month number or null"
  );
  assert(
    typeof simResult.summary.winnerScenario === "string",
    `Winner scenario identified: ${simResult.summary.winnerScenario}`
  );

  // Test 14: Sensitivity Matrix Heatmap Generator
  assert(
    typeof engine.generateSensitivityMatrix === "function",
    "generateSensitivityMatrix function is defined"
  );
  const matrix = engine.generateSensitivityMatrix(defaultParams, {
    propertyAppreciationRates: [4.0, 6.0, 8.0],
    rentInvestmentYields: [6.0, 8.0, 10.0],
  });
  assert(
    Array.isArray(matrix) && matrix.length === 3,
    "Sensitivity matrix generated 3x3 rows"
  );
  assert(
    matrix[0].cells.length === 3,
    "Sensitivity matrix row contains 3 cells"
  );
  assert(
    typeof matrix[0].cells[0].crossoverYear === "number" ||
      matrix[0].cells[0].crossoverYear === null,
    "Sensitivity cell contains crossover year"
  );

  // Test 15: Edge Cases & Boundary Guard
  // 15a: 100% Cash Purchase (0% loan)
  const allCashParams = { ...defaultParams, downpaymentPercent: 100 };
  const allCashResult = engine.simulateBuyVsRent(allCashParams);
  assert(
    allCashResult.timeline[0].remainingLoanPrincipal === 0,
    "100% cash downpayment results in 0 remaining loan principal"
  );
  assert(
    allCashResult.timeline[0].mortgagePayment === 0,
    "100% cash downpayment results in 0 mortgage payments"
  );

  // 15b: 0% Interest Rate
  const zeroInterestParams = {
    ...defaultParams,
    teaserAnnualRate: 0,
    floatingAnnualRate: 0,
  };
  const zeroInterestResult = engine.simulateBuyVsRent(zeroInterestParams);
  assert(
    !isNaN(zeroInterestResult.timeline[0].mortgagePayment),
    "0% interest rate executes without NaN"
  );

  // 15c: High valuation (100 Billion VND)
  const luxuryParams = {
    ...defaultParams,
    homePrice: 100000000000,
    monthlyRent: 300000000,
  };
  const luxuryResult = engine.simulateBuyVsRent(luxuryParams);
  assert(
    isFinite(luxuryResult.summary.netWorthBuyEnding),
    "100 Billion VND home executes with valid finite numbers"
  );

  // Test 16: Cumulative Sunk Costs Comparison
  assert(
    simResult.summary.totalSunkCostBuy > 0,
    "Buy path cumulative sunk costs are positive and tracked"
  );
  assert(
    simResult.summary.totalSunkCostRent > 0,
    "Rent path cumulative sunk costs are positive and tracked"
  );
  assert(
    simResult.summary.sunkCostDifference !== undefined,
    "Summary includes sunkCostDifference comparison metric"
  );
} catch (err) {
  console.error("❌ Test suite encountered runtime exception:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Buy vs. Rent Simulation Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
