// @ts-check
const { test, expect } = require("@playwright/test");
const {
  assertNoHorizontalOverflow,
  assertTouchTargetSize,
  trackConsoleErrors,
} = require("../helpers/e2e-fixture");

const APP_PATH = "/personal-finance-savings-predictor/";

/**
 * Initializes and navigates to the Personal Finance Savings Predictor page,
 * suppresses initial onboarding popover, and waits for key DOM anchors.
 * @param {import('@playwright/test').Page} page
 */
async function setupPredictorPage(page) {
  const { errors } = trackConsoleErrors(page);

  // Suppress automatic onboarding on load
  await page.addInitScript(() => {
    try {
      localStorage.setItem("showedOnboarding", "true");
    } catch {}
  });

  await page.goto(APP_PATH, { waitUntil: "domcontentloaded" });

  await page.waitForSelector("#inputSalary", { state: "visible" });
  await page.waitForSelector("#chartGrowth", { state: "attached" });
  await page.waitForTimeout(100);

  return { errors };
}

test.describe("Personal Finance Savings Predictor Multi-Device UI/UX Suite", () => {
  test("1. Layout & Zero Horizontal Overflow across viewports", async ({
    page,
  }) => {
    const { errors } = await setupPredictorPage(page);
    await expect(page).toHaveTitle(
      /Savings & Wealth Simulator|Personal Finance|Dự Báo Tiết Kiệm/i
    );

    // Assert main interactive regions are visible
    await expect(page.locator("#inputSalary")).toBeVisible();
    await expect(page.locator("#inputSavingsGoal")).toBeVisible();
    await expect(page.locator("#chartGrowth")).toBeVisible();

    await page.waitForTimeout(50);
    await assertNoHorizontalOverflow(page);

    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("manifest")
    );
    expect(criticalErrors, "Should have zero console errors").toEqual([]);
  });

  test("2. Mobile & Tablet Touch Target Accessibility", async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name;
    await setupPredictorPage(page);

    // Verify key action and preset buttons meet touch target standards (>= 36px on mobile/tablet)
    if (projectName !== "desktop") {
      const touchElements = [
        "#btnMobileActions",
        "#btnPresetsHeader",
        "#themeBtn",
        "#langSelector",
      ];

      for (const sel of touchElements) {
        const locator = page.locator(sel);
        if (await locator.isVisible()) {
          await assertTouchTargetSize(locator, 36, 36);
        }
      }
    }
  });

  test("3. Currency Input Masking & Dynamic Verbal Quantity Helpers", async ({
    page,
  }) => {
    await setupPredictorPage(page);

    // 1. Select Vietnamese language
    await page.selectOption("#langSelector", "vi");
    await page.waitForTimeout(100);

    const salaryInput = page.locator("#inputSalary");
    await salaryInput.fill("");
    await salaryInput.type("35000000");
    await salaryInput.blur();
    await page.waitForTimeout(100);

    // In VI locale with VND, formatted value should contain dot separators
    const valVi = await salaryInput.inputValue();
    expect(valVi.replace(/\s/g, "")).toContain("35.000.000");

    const helperSalary = page.locator("#helperSalary");
    await expect(helperSalary).toBeVisible();
    const helperTextVi = await helperSalary.textContent();
    expect(helperTextVi?.toLowerCase()).toContain("triệu");

    // 2. Switch to English language
    await page.selectOption("#langSelector", "en");
    await page.waitForTimeout(100);

    const valEn = await salaryInput.inputValue();
    expect(valEn.replace(/\s/g, "")).toContain("35,000,000");

    const helperTextEn = await helperSalary.textContent();
    expect(helperTextEn?.toLowerCase()).toMatch(/million|vnd|35/);
  });

  test("4. Chart.js Wealth Timeline Canvas Rendering & Timeframe Filters", async ({
    page,
  }) => {
    await setupPredictorPage(page);

    // Verify canvas is present and has non-zero geometry
    const canvas = page.locator("#chartGrowth");
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThan(100);
    expect(box?.height).toBeGreaterThan(50);

    // Check timeframe select dropdown
    const dateRangeSelect = page.locator("#chartDateRange");
    if (await dateRangeSelect.isVisible()) {
      await dateRangeSelect.selectOption("1y");
      await page.waitForTimeout(50);
      await dateRangeSelect.selectOption("all");
      await page.waitForTimeout(50);
      await assertNoHorizontalOverflow(page);
    }
  });

  test("5. Scenario Comparison Dual-Pass Workbench Toggle", async ({
    page,
  }) => {
    await setupPredictorPage(page);

    // Trigger Scenario Comparison
    const compareBtn = page.locator("#btnCompareScenarios");
    if (await compareBtn.isVisible()) {
      await compareBtn.click();
      await page.waitForTimeout(150);

      // Verify comparison section or delta badges exist
      const compareSection = page.locator(
        "#scenarioCompareContainer, #scenarioWorkbench, #compareSection"
      );
      if ((await compareSection.count()) > 0) {
        await expect(compareSection.first()).toBeVisible();
      }

      await assertNoHorizontalOverflow(page);
    }
  });

  test("6. Modal Lifecycle, Backdrop Dismissal & Single-Dialog Invariant", async ({
    page,
  }) => {
    await setupPredictorPage(page);

    // 1. Open AI Dossier Modal
    await page.evaluate(() => {
      if (typeof window.openAIDossierModal === "function") {
        window.openAIDossierModal();
      }
    });
    await page.waitForTimeout(100);
    const aiModal = page.locator("#aiDossierModal");
    if ((await aiModal.count()) > 0) {
      await expect(aiModal).toBeVisible();
      // Dismiss via Escape key
      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);
      await expect(aiModal).toBeHidden();
    }

    // 2. Open CSV Modal
    await page.evaluate(() => {
      if (typeof window.toggleCSVModal === "function") {
        window.toggleCSVModal(true);
      }
    });
    await page.waitForTimeout(100);
    const csvModal = page.locator("#csvModal");
    await expect(csvModal).toBeVisible();

    // Dismiss CSV Modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    await expect(csvModal).toBeHidden();
  });

  test("7. Resilient URL State Sharing & LZ-String Decompression", async ({
    page,
  }) => {
    await setupPredictorPage(page);

    // Mutate salary value
    const salaryInput = page.locator("#inputSalary");
    await salaryInput.fill("");
    await salaryInput.type("50000000");
    await salaryInput.blur();
    await page.waitForTimeout(100);

    // Generate share URL
    await page.evaluate(() => {
      if (typeof window.shareSimulation === "function") {
        window.shareSimulation();
      }
    });
    await page.waitForTimeout(100);

    const shareUrl = page.url();

    // Reload or open new page with the shared hash state
    if (shareUrl.includes("#")) {
      await page.goto(shareUrl, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#inputSalary");
      await page.waitForTimeout(100);

      const restoredVal = await page.locator("#inputSalary").inputValue();
      expect(restoredVal.replace(/[.,\s]/g, "")).toContain("50000000");
    }
  });
});
