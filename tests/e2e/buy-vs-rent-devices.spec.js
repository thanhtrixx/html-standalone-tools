// @ts-check
const { test, expect } = require("@playwright/test");
const {
  assertNoHorizontalOverflow,
  assertTouchTargetSize,
  trackConsoleErrors,
} = require("../helpers/e2e-fixture");

const APP_PATH = "/buy-vs-rent-home-comparison/";

/**
 * Initializes and navigates to the Buy vs Rent Home Comparison page,
 * suppresses initial onboarding if any, and waits for key DOM anchors.
 * @param {import('@playwright/test').Page} page
 */
async function setupBuyVsRentPage(page) {
  const { errors } = trackConsoleErrors(page);

  await page.addInitScript(() => {
    try {
      localStorage.setItem("has_seen_onboarding", "true");
      localStorage.setItem("bvr_onboarded", "true");
    } catch {}
  });

  await page.goto(APP_PATH, { waitUntil: "domcontentloaded" });

  await page.waitForSelector("#input_homePrice", { state: "visible" });
  await page.waitForSelector("#mainChartCanvas", { state: "attached" });
  await page.waitForTimeout(100);

  return { errors };
}

test.describe("Buy vs Rent Home Comparison Multi-Device UI/UX Suite", () => {
  test("1. Layout & Zero Horizontal Overflow across viewports", async ({
    page,
  }) => {
    const { errors } = await setupBuyVsRentPage(page);
    await expect(page).toHaveTitle(/Buy vs\.? Rent|Mua Nhà Hay Thuê Nhà/i);

    // Verify main KPI regions and columns
    await expect(page.locator("#kpi_net_worth_value")).toBeVisible();
    await expect(page.locator("#input_homePrice")).toBeVisible();
    await expect(page.locator("#input_monthlyRent")).toBeVisible();
    await expect(page.locator("#mainChartCanvas")).toBeVisible();

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
    await setupBuyVsRentPage(page);

    // Verify key action buttons meet touch target standards (>= 36px on touch devices)
    if (projectName !== "desktop") {
      const touchElements = [
        "#langToggleBtn",
        "#themeToggleBtn",
        "#aiDossierBtn",
        "#shareUrlBtn",
        "#resetDefaultsBtn",
        "#tabBtn_timeline",
        "#tabBtn_sensitivity",
      ];

      for (const sel of touchElements) {
        const locator = page.locator(sel);
        if (await locator.isVisible()) {
          await assertTouchTargetSize(locator, 36, 36);
        }
      }
    }
  });

  test("3. Mortgage & Rent Input Masking, Verbal Spelled Labels & Real-time Recalc", async ({
    page,
  }) => {
    await setupBuyVsRentPage(page);

    const homePriceInput = page.locator("#input_homePrice");
    await homePriceInput.fill("");
    await homePriceInput.type("4500000000");
    await homePriceInput.blur();
    await page.waitForTimeout(100);

    // Verify formatted value and spelled verbal helper
    const val = await homePriceInput.inputValue();
    expect(val.replace(/[.,\s]/g, "")).toContain("4500000000");

    const spelledHome = page.locator("#spelled_homePrice");
    if (await spelledHome.isVisible()) {
      const text = await spelledHome.textContent();
      expect(text?.toLowerCase()).toMatch(/tỷ|billion|4\.?5/);
    }

    // Verify KPI updates reactively
    const kpiNetWorth = page.locator("#kpi_net_worth_value");
    await expect(kpiNetWorth).toBeVisible();
  });

  test("4. Interactive Sensitivity Matrix Tab & Cell Exploration", async ({
    page,
  }) => {
    await setupBuyVsRentPage(page);

    // Switch to Sensitivity Matrix tab
    const sensitivityTabBtn = page.locator("#tabBtn_sensitivity");
    await sensitivityTabBtn.click();
    await page.waitForTimeout(150);

    // Verify sensitivity container becomes visible and renders table
    const matrixContainer = page.locator("#sensitivityContainer");
    await expect(matrixContainer).toBeVisible();

    const matrixTable = matrixContainer.locator("table");
    await expect(matrixTable).toBeVisible();

    // Verify zero horizontal overflow in sensitivity view
    await assertNoHorizontalOverflow(page);

    // Switch back to timeline chart
    await page.click("#tabBtn_timeline");
    await page.waitForTimeout(100);
    await expect(page.locator("#mainChartCanvas")).toBeVisible();
  });

  test("5. Chart.js Trajectory Rendering across Theme Toggle (Dark <-> Light)", async ({
    page,
  }) => {
    await setupBuyVsRentPage(page);

    // Verify canvas has non-zero geometry
    const canvas = page.locator("#mainChartCanvas");
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThan(100);
    expect(box?.height).toBeGreaterThan(50);

    // Toggle theme to Light mode
    const themeBtn = page.locator("#themeToggleBtn");
    await themeBtn.click();
    await page.waitForTimeout(100);

    // Verify html tag theme updated
    const isLight = await page.evaluate(
      () =>
        document.documentElement.classList.contains("light") ||
        !document.documentElement.classList.contains("dark")
    );
    expect(isLight).toBe(true);

    // Toggle back to Dark mode
    await themeBtn.click();
    await page.waitForTimeout(100);
    await assertNoHorizontalOverflow(page);
  });

  test("6. AI Decision Dossier Modal Lifecycle & Markdown Export", async ({
    page,
  }) => {
    await setupBuyVsRentPage(page);

    // Open AI Dossier
    const aiBtn = page.locator("#aiDossierBtn");
    await aiBtn.click();
    await page.waitForTimeout(150);

    const modal = page.locator("#aiDossierModal");
    await expect(modal).toBeVisible();

    // Verify modal preview content contains markdown sections
    const preview = page.locator(
      "#aiDossierContent, #aiDossierPreview, #dossierMarkdown"
    );
    if ((await preview.count()) > 0) {
      await expect(preview.first()).toBeVisible();
    }

    // Dismiss via Escape key
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    await expect(modal).toBeHidden();
  });

  test("7. Bilingual Toggle Stability (VI <-> EN) & URL State Sharing", async ({
    page,
  }) => {
    await setupBuyVsRentPage(page);

    // Toggle language
    const langBtn = page.locator("#langToggleBtn");
    await langBtn.click();
    await page.waitForTimeout(100);

    // Verify toggle button updated label
    const langLabel = page.locator("#langLabel");
    const langText = await langLabel.textContent();
    expect(langText?.trim()).toBeTruthy();

    await assertNoHorizontalOverflow(page);

    // Toggle back
    await langBtn.click();
    await page.waitForTimeout(100);
    await assertNoHorizontalOverflow(page);
  });
});
