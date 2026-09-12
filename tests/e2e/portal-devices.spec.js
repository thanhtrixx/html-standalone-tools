// @ts-check
const { test, expect } = require("@playwright/test");
const {
  assertNoHorizontalOverflow,
  assertTouchTargetSize,
  trackConsoleErrors,
} = require("../helpers/e2e-fixture");

/**
 * Setup helper to navigate to the portal page with console error tracking.
 * @param {import('@playwright/test').Page} page
 */
async function setupPortalPage(page) {
  const { errors } = trackConsoleErrors(page);
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  return { errors };
}

test.describe("Portal Catalog & Central Hub Multi-Device UI/UX Suite", () => {
  test("1. Layout & Zero Horizontal Overflow across viewports", async ({
    page,
  }) => {
    const { errors } = await setupPortalPage(page);

    await expect(page).toHaveTitle(/HTML Standalone Tools/i);
    await assertNoHorizontalOverflow(page);
    expect(errors, "Should have zero console errors on initial load").toEqual(
      []
    );
  });

  test("2. Mobile & Tablet Touch Target Accessibility", async ({
    page,
    isMobile,
  }) => {
    await setupPortalPage(page);

    // Verify language switcher buttons
    const langBtnEn = page.locator("#langBtnEn");
    const langBtnVi = page.locator("#langBtnVi");
    await expect(langBtnEn).toBeVisible();
    await expect(langBtnVi).toBeVisible();

    if (isMobile) {
      await assertTouchTargetSize(langBtnEn, 28, 28);
      await assertTouchTargetSize(langBtnVi, 28, 28);
    }

    // Verify all tool launch buttons
    const launchButtons = page.locator('a[data-i18n="launchButton"]');
    const btnCount = await launchButtons.count();
    expect(btnCount).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < btnCount; i++) {
      const btn = launchButtons.nth(i);
      await expect(btn).toBeVisible();
      if (isMobile) {
        await assertTouchTargetSize(btn, 100, 36);
      }
    }
  });

  test("3. Deep Tool Navigation - Smart Buy-List Price Tracker", async ({
    page,
  }) => {
    const { errors } = await setupPortalPage(page);

    const trackerLink = page.locator(
      'a[href*="smart-buy-list-price-tracker"][data-i18n="launchButton"]'
    );
    await expect(trackerLink).toBeVisible();
    await trackerLink.click();

    await page.waitForURL(/.*smart-buy-list-price-tracker/);
    await page.waitForLoadState("domcontentloaded");
    await assertNoHorizontalOverflow(page);
    expect(errors, "Navigating to tracker should produce no errors").toEqual(
      []
    );
  });

  test("4. Deep Tool Navigation - Buy vs Rent Home Comparison", async ({
    page,
  }) => {
    const { errors } = await setupPortalPage(page);

    const buyRentLink = page.locator(
      'a[href*="buy-vs-rent-home-comparison"][data-i18n="launchButton"]'
    );
    await expect(buyRentLink).toBeVisible();
    await buyRentLink.click();

    await page.waitForURL(/.*buy-vs-rent-home-comparison/);
    await page.waitForLoadState("domcontentloaded");
    await assertNoHorizontalOverflow(page);
    expect(errors, "Navigating to buy-rent should produce no errors").toEqual(
      []
    );
  });

  test("5. Deep Tool Navigation - Personal Finance Savings Predictor", async ({
    page,
  }) => {
    const { errors } = await setupPortalPage(page);

    const predictorLink = page.locator(
      'a[href*="personal-finance-savings-predictor"][data-i18n="launchButton"]'
    );
    await expect(predictorLink).toBeVisible();
    await predictorLink.click();

    await page.waitForURL(/.*personal-finance-savings-predictor/);
    await page.waitForLoadState("domcontentloaded");
    await assertNoHorizontalOverflow(page);
    expect(errors, "Navigating to predictor should produce no errors").toEqual(
      []
    );
  });

  test("5b. Deep Tool Navigation - Atomic Habit Tracker", async ({ page }) => {
    const { errors } = await setupPortalPage(page);

    const habitLink = page.locator(
      'a[href*="habit-tracker"][data-i18n="launchButton"]'
    );
    await expect(habitLink).toBeVisible();
    await habitLink.click();

    await page.waitForURL(/.*habit-tracker/);
    await page.waitForLoadState("domcontentloaded");
    await assertNoHorizontalOverflow(page);
    expect(
      errors,
      "Navigating to habit tracker should produce no errors"
    ).toEqual([]);
  });

  test("6. Bilingual Toggle Stability (EN <-> VI) & Localization Content", async ({
    page,
  }) => {
    const { errors } = await setupPortalPage(page);

    // Switch to Vietnamese
    const btnVi = page.locator("#langBtnVi");
    await btnVi.click();
    await page.waitForTimeout(50);

    const catalogHeading = page.locator('[data-i18n="catalogHeading"]');
    await expect(catalogHeading).toHaveText("Danh Mục Công Cụ");

    const tool1 = page.locator('[data-i18n="tool1Title"]');
    await expect(tool1).toHaveText("Sổ Mua Sắm & So Sánh Giá Đơn Vị");

    const tool2 = page.locator('[data-i18n="tool2Title"]');
    await expect(tool2).toHaveText("Mua Nhà vs Thuê Nhà");

    const tool3 = page.locator('[data-i18n="tool3Title"]');
    await expect(tool3).toHaveText("Dự Phóng Tiết Kiệm Cá Nhân");

    const tool4 = page.locator('[data-i18n="tool4Title"]');
    await expect(tool4).toHaveText("Sổ Theo Dõi Thói Quen Nguyên Tử");

    await assertNoHorizontalOverflow(page);

    // Switch back to English
    const btnEn = page.locator("#langBtnEn");
    await btnEn.click();
    await page.waitForTimeout(50);

    await expect(catalogHeading).toHaveText("Available Tools");
    await expect(tool1).toHaveText("Smart Buy-List & Unit Price Tracker");
    await expect(tool2).toHaveText("Buy vs. Rent Home Comparison");
    await expect(tool3).toHaveText("Personal Finance Savings Predictor");
    await expect(tool4).toHaveText("Atomic Habit & Routine Tracker");

    await assertNoHorizontalOverflow(page);
    expect(errors, "Switching languages should produce no errors").toEqual([]);
  });

  test("7. External Repository, Releases, and Standalone HTML Download Links", async ({
    page,
  }) => {
    await setupPortalPage(page);

    // Verify GitHub links have security attributes
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      const rel = await link.getAttribute("rel");
      expect(
        rel,
        "External links should specify noopener noreferrer"
      ).toContain("noopener");
      expect(rel).toContain("noreferrer");
    }

    // Verify standalone download links exist for all tools
    const downloadLinks = page.locator(
      'a[aria-label="Download standalone HTML"]'
    );
    const dlCount = await downloadLinks.count();
    expect(dlCount).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < dlCount; i++) {
      const href = await downloadLinks.nth(i).getAttribute("href");
      expect(href).toMatch(
        /https:\/\/github\.com\/thanhtrixx\/html-standalone-tools\/releases\/latest\/download\/.+\.html/
      );
    }
  });
});
