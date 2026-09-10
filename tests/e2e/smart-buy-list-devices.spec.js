// @ts-check
const { test, expect } = require("@playwright/test");
const {
  assertNoHorizontalOverflow,
  assertTouchTargetSize,
  trackConsoleErrors,
} = require("../helpers/e2e-fixture");

const APP_PATH = "/smart-buy-list-price-tracker/";

async function setupPage(page) {
  const { errors } = trackConsoleErrors(page);
  await page.goto(APP_PATH, { waitUntil: "load" });
  await page.waitForSelector("#headerTitle");
  return { errors };
}

test.describe("Smart Buy-List Multi-Device UI/UX Suite", () => {
  test("1. Layout & Zero Horizontal Overflow across all 4 tab views", async ({
    page,
  }) => {
    const { errors } = await setupPage(page);
    await expect(page).toHaveTitle(/Smart Buy-List|Danh Sách Mua Sắm/i);

    // 1. Planning Mode (Default)
    await expect(page.locator("#navPlanningBtn")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator("#viewPlanning")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 2. Buy Mode
    await page.click("#navBuyModeBtn");
    await expect(page.locator("#navBuyModeBtn")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator("#shoppingListSection")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 3. Price History View
    await page.click("#navLedgerBtn");
    await expect(page.locator("#navLedgerBtn")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator("#viewPriceHistory")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 4. Comparator View
    await page.click("#navCompareBtn");
    await expect(page.locator("#navCompareBtn")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator("#viewComparator")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    const criticalErrors = errors.filter(
      (e) => !e.includes("sw.js") && !e.includes("manifest.webmanifest")
    );
    expect(criticalErrors, "Should have zero console errors").toEqual([]);
  });

  test("2. Mobile & Tablet Touch Target Accessibility", async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name;
    await setupPage(page);

    // Verify bottom navigation buttons meet touch target standards (>= 44px)
    const tabs = [
      "#navPlanningBtn",
      "#navBuyModeBtn",
      "#navLedgerBtn",
      "#navCompareBtn",
    ];
    for (const tabSelector of tabs) {
      const tab = page.locator(tabSelector);
      await expect(tab).toBeVisible();
      if (projectName !== "desktop") {
        await assertTouchTargetSize(tab, 44, 44);
      }
    }

    // Verify header action buttons
    const headerBtns = [
      "#langToggleBtn",
      "#themeToggleBtn",
      "#btnOpenSettings",
    ];
    for (const btnSelector of headerBtns) {
      const btn = page.locator(btnSelector);
      await expect(btn).toBeVisible();
      if (projectName !== "desktop") {
        await assertTouchTargetSize(btn, 32, 32);
      }
    }
  });

  test("3. Bilingual Language Switch Stability (VI <-> EN)", async ({
    page,
  }) => {
    const { errors } = await setupPage(page);

    const langBtn = page.locator("#langToggleBtn");
    await expect(langBtn).toBeVisible();

    // Toggle language from VI to EN
    await langBtn.click();
    await page.waitForTimeout(150);
    await assertNoHorizontalOverflow(page);

    // Toggle back to VI
    await langBtn.click();
    await page.waitForTimeout(150);
    await assertNoHorizontalOverflow(page);

    const criticalErrors = errors.filter(
      (e) => !e.includes("sw.js") && !e.includes("manifest.webmanifest")
    );
    expect(
      criticalErrors,
      "Zero console errors during language switch"
    ).toEqual([]);
  });

  test("4. Settings Modal Lifecycle & Light Dismissal", async ({ page }) => {
    await setupPage(page);

    const btnSettings = page.locator("#btnOpenSettings");
    await expect(btnSettings).toBeVisible();
    await btnSettings.click();

    const settingsModal = page.locator("#settingsModal");
    await expect(settingsModal).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Close settings modal via close button
    const btnClose = page.locator("#btnCloseSettings");
    await expect(btnClose).toBeVisible();
    await btnClose.click();
    await expect(settingsModal).toBeHidden();
  });

  test("5. End-to-End Shopping Workflow with Sample Data", async ({
    page,
  }, testInfo) => {
    const { errors } = await setupPage(page);

    // Open settings and load sample data
    const btnSettings = page.locator("#btnOpenSettings");
    await expect(btnSettings).toBeVisible();
    await btnSettings.click();

    const loadSampleBtn = page.locator("#btnResetSampleData");
    await expect(loadSampleBtn).toBeVisible();
    await loadSampleBtn.click();

    // Close settings
    const btnClose = page.locator("#btnCloseSettings");
    await expect(btnClose).toBeVisible();
    await btnClose.click();
    await expect(page.locator("#settingsModal")).toBeHidden();

    // Switch to Planning Tab and verify items rendered
    await page.click("#navPlanningBtn");
    await expect(page.locator("#viewPlanning")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Switch to Buy Mode Tab
    await page.click("#navBuyModeBtn");
    await expect(page.locator("#shoppingListSection")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Switch to Comparator Tab
    await page.click("#navCompareBtn");
    await expect(page.locator("#viewComparator")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    const criticalErrors = errors.filter(
      (e) => !e.includes("sw.js") && !e.includes("manifest.webmanifest")
    );
    expect(
      criticalErrors,
      "Zero console errors across full shopping flow"
    ).toEqual([]);
  });
});
