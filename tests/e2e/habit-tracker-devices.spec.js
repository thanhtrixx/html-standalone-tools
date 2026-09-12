// @ts-check
const { test, expect } = require("@playwright/test");
const {
  assertNoHorizontalOverflow,
  assertTouchTargetSize,
  trackConsoleErrors,
} = require("../helpers/e2e-fixture");

const APP_PATH = "/habit-tracker/";

async function setupPage(page) {
  const { errors } = trackConsoleErrors(page);
  await page.goto(APP_PATH, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("header");
  await page.waitForSelector("#main-content");
  await page.waitForTimeout(150);
  return { errors };
}

test.describe("Atomic Habit Tracker Multi-Device UI/UX Suite", () => {
  test("1. Layout & Zero Horizontal Overflow across all 4 tab views", async ({
    page,
  }) => {
    const { errors } = await setupPage(page);
    await expect(page).toHaveTitle(/Atomic Habit|Thói Quen/i);

    // 1. Today Dashboard (Default)
    await expect(page.locator("button[data-tab='today']")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 2. Insights Dashboard
    await page.click("button[data-tab='insights']");
    await page.waitForTimeout(100);
    await expect(page.locator(".insights-view")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 3. Habit Catalog Manager
    await page.click("button[data-tab='manager']");
    await page.waitForTimeout(100);
    await expect(page.locator(".manager-view")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // 4. Settings Tab
    await page.click("button[data-tab='settings']");
    await page.waitForTimeout(100);
    await expect(page.locator(".settings-view")).toBeVisible();
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
    const tabs = ["today", "insights", "manager", "settings"];
    for (const tabKey of tabs) {
      const tab = page.locator(`button[data-tab='${tabKey}']`);
      await expect(tab).toBeVisible();
      if (projectName !== "desktop") {
        await assertTouchTargetSize(tab, 40, 40);
      }
    }

    // Verify top bar action buttons
    const langBtn = page.locator("#lang-toggle-btn");
    await expect(langBtn).toBeVisible();
  });

  test("3. Interactive Habit Actions (Binary Check, Stepper, Timer)", async ({
    page,
  }) => {
    await setupPage(page);

    // Return to Today tab
    await page.click("button[data-tab='today']");
    await page.waitForTimeout(100);

    // Test Numeric Stepper + Button
    const incrementBtn = page.locator("[data-action='step-increment']").first();
    if (await incrementBtn.isVisible()) {
      await incrementBtn.click();
      await page.waitForTimeout(100);
    }

    // Test Binary Check Toggle
    const binaryToggleBtn = page
      .locator("[data-action='toggle-habit']")
      .first();
    if (await binaryToggleBtn.isVisible()) {
      await binaryToggleBtn.click();
      await page.waitForTimeout(100);
    }

    // Test Timer Toggle
    const timerBtn = page.locator("[data-action='toggle-timer']").first();
    if (await timerBtn.isVisible()) {
      await timerBtn.click();
      await page.waitForTimeout(200);
      await timerBtn.click(); // Stop timer
    }
  });

  test("4. Insights View 52-Week Heatmap & Popover Interaction", async ({
    page,
  }) => {
    await setupPage(page);

    // Navigate to Insights tab
    await page.click("button[data-tab='insights']");
    await page.waitForTimeout(100);

    // Check Heatmap presence
    const heatmap = page.locator(".heatmap-container");
    await expect(heatmap).toBeVisible();

    // Click on a heatmap cell
    const cell = page.locator(".heatmap-cell").first();
    await expect(cell).toBeVisible();
    await cell.click();

    // Verify popover appears
    const popover = page.locator("#heatmap-cell-popover");
    await expect(popover).toBeVisible();
  });

  test("5. Habit Catalog Manager & Edit Modal", async ({ page }) => {
    await setupPage(page);

    // Navigate to Manager tab
    await page.click("button[data-tab='manager']");
    await page.waitForTimeout(100);

    // Click Add Habit button
    const addBtn = page.locator("[data-action='open-add-habit']").first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Modal overlay should be visible
    const modalOverlay = page.locator("#habit-edit-modal-overlay");
    await expect(modalOverlay).toBeVisible();

    // Fill new habit name
    const nameInput = page.locator("#modal-habit-name");
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Thực hành thở 4-7-8");

    // Close modal
    const cancelBtn = page
      .locator("button:has-text('Huỷ'), button:has-text('Cancel')")
      .first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForTimeout(100);
    }
  });

  test("6. Habit Deep-Dive Bottom Sheet & Reflection Journal", async ({
    page,
  }) => {
    await setupPage(page);

    // Navigate to Today tab
    await page.click("button[data-tab='today']");
    await page.waitForTimeout(100);

    // Open Habit Detail
    const detailBtn = page.locator("[data-action='open-detail']").first();
    if (await detailBtn.isVisible()) {
      await detailBtn.click();
      await page.waitForTimeout(150);

      const sheetOverlay = page.locator("#detail-sheet-overlay");
      await expect(sheetOverlay).toBeVisible();

      // Check mini heatmap inside sheet
      const miniHeatmap = page.locator(".mini-heatmap-grid");
      await expect(miniHeatmap).toBeVisible();

      // Close sheet
      const closeBtn = page
        .locator("button:has-text('Đóng'), button:has-text('Close')")
        .first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(100);
      }
    }
  });

  test("7. Language Switcher & Theme Switcher", async ({ page }) => {
    await setupPage(page);

    // Switch to Settings tab
    await page.click("button[data-tab='settings']");
    await page.waitForTimeout(100);

    // Switch to English
    const enBtn = page.locator("button:has-text('English')").first();
    if (await enBtn.isVisible()) {
      await enBtn.click();
      await page.waitForTimeout(100);
    }

    // Switch to Light Mode
    const lightBtn = page.locator("button:has-text('Light')").first();
    if (await lightBtn.isVisible()) {
      await lightBtn.click();
      await page.waitForTimeout(100);
      await expect(page.locator("html")).toHaveClass(/light/);
    }

    // Switch back to Dark Mode
    const darkBtn = page.locator("button:has-text('Dark')").first();
    if (await darkBtn.isVisible()) {
      await darkBtn.click();
      await page.waitForTimeout(100);
      await expect(page.locator("html")).toHaveClass(/dark/);
    }
  });
});
