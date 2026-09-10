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
  await page.goto(APP_PATH, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#headerTitle");
  await page.waitForSelector("#btnOpenSettings");
  await page.waitForTimeout(100);
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
    await page.waitForTimeout(50);
    await assertNoHorizontalOverflow(page);

    // 2. Buy Mode
    await page.click("#navBuyModeBtn");
    await expect(page.locator("#navBuyModeBtn")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator("#shoppingListSection")).toBeVisible();
    await page.waitForTimeout(50);
    await assertNoHorizontalOverflow(page);

    // 3. Price History View
    await page.click("#navLedgerBtn");
    await expect(page.locator("#navLedgerBtn")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator("#viewPriceHistory")).toBeVisible();
    await page.waitForTimeout(50);
    await assertNoHorizontalOverflow(page);

    // 4. Comparator View
    await page.click("#navCompareBtn");
    await expect(page.locator("#navCompareBtn")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator("#viewComparator")).toBeVisible();
    await page.waitForTimeout(50);
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

    await expect(page.locator("#settingsModal")).toBeVisible();
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

  test("6. Deal Badge Responsive Expansion (Mobile icon-only vs Tablet/Desktop icon + label)", async ({
    page,
  }) => {
    const { errors } = await setupPage(page);
    const viewport = page.viewportSize();
    const isDesktopOrTablet = !!(viewport && viewport.width >= 640);

    // Open settings and load sample data
    const btnSettings = page.locator("#btnOpenSettings");
    await expect(btnSettings).toBeVisible();
    await btnSettings.click();
    await expect(page.locator("#settingsModal")).toBeVisible();
    await page.locator("#btnResetSampleData").click();
    await page.locator("#btnCloseSettings").click();
    await expect(page.locator("#settingsModal")).toBeHidden();

    // In Planning view: verify deal badge elements exist in #activeItemsList
    await page.click("#navPlanningBtn");
    const dealBadges = page.locator(
      "#activeItemsList span.inline-flex[aria-label]"
    );
    const badgeCount = await dealBadges.count();
    expect(badgeCount).toBeGreaterThan(0);

    // Get the first deal badge's text label span (.sm:inline)
    const firstBadgeText = dealBadges.first().locator("span.sm\\:inline");
    if (isDesktopOrTablet) {
      // Tablet/Desktop (>= 640px): text label MUST be visible, trimmed and non-empty
      await expect(firstBadgeText).toBeVisible();
      const textContent = await firstBadgeText.textContent();
      expect(textContent && textContent.trim().length).toBeGreaterThan(0);
      expect(textContent).not.toMatch(/^\s+/);
      expect(textContent).not.toMatch(/\s{2,}/);
    } else {
      // Mobile (< 640px): text label MUST be hidden (icon-only mode)
      await expect(firstBadgeText).toBeHidden();
    }

    const criticalErrors = errors.filter(
      (e) => !e.includes("sw.js") && !e.includes("manifest.webmanifest")
    );
    expect(
      criticalErrors,
      "Zero console errors during deal badge check"
    ).toEqual([]);
  });

  test("7. Buy Mode Checkbox Contrast, Trip Completion & Price History Sync Journey", async ({
    page,
  }) => {
    const { errors } = await setupPage(page);

    // Load sample data
    const btnSettings = page.locator("#btnOpenSettings");
    await expect(btnSettings).toBeVisible();
    await btnSettings.click();
    await expect(page.locator("#settingsModal")).toBeVisible();
    await page.locator("#btnResetSampleData").click();
    await page.locator("#btnCloseSettings").click();
    await expect(page.locator("#settingsModal")).toBeHidden();

    // 1. Switch to Buy Mode
    await page.click("#navBuyModeBtn");
    await expect(page.locator("#shoppingListSection")).toBeVisible();

    // 2. Verify unchecked checkbox in #activeItemsList is visible and has high contrast styling
    const uncheckedCheckbox = page
      .locator("#activeItemsList button[data-action='toggle-check']")
      .first();
    await expect(uncheckedCheckbox).toBeVisible();
    const classAttr = await uncheckedCheckbox.getAttribute("class");
    expect(classAttr).toContain("bg-slate-800/80");
    expect(classAttr).toContain("border-slate-600");

    // 3. Check the item
    await uncheckedCheckbox.click();
    await page.waitForTimeout(100);

    // Verify checked section is visible and item in #checkedItemsList is green
    await expect(page.locator("#checkedItemsSection")).toBeVisible();
    const checkedCheckbox = page
      .locator("#checkedItemsList button[data-action='toggle-check']")
      .first();
    await expect(checkedCheckbox).toBeVisible();
    const checkedClass = await checkedCheckbox.getAttribute("class");
    expect(checkedClass).toContain("bg-emerald-600");

    // 4. Complete Trip
    const btnCompleteTrip = page.locator("#btnOpenFinishTripModal");
    await expect(btnCompleteTrip).toBeVisible();
    await btnCompleteTrip.click();

    // Confirm modal opens
    const tripModal = page.locator("#tripCompleteModal");
    await expect(tripModal).toBeVisible();

    // Click Finalize Trip
    const btnFinalize = page.locator("#btnFinalizeTrip");
    await expect(btnFinalize).toBeVisible();
    await btnFinalize.click();
    await expect(tripModal).toBeHidden();

    // 5. Navigate to Price History
    await page.click("#navLedgerBtn");
    await expect(page.locator("#viewPriceHistory")).toBeVisible();

    // Verify completed items appear in Price History table / mobile cards
    const ledgerRows = page.locator("#ledgerTableBody tr");
    const ledgerCards = page.locator("#ledgerMobileCards > div");
    const totalRecords =
      (await ledgerRows.count()) + (await ledgerCards.count());
    expect(totalRecords).toBeGreaterThan(0);

    // Verify Price History checkboxes are styled with accent-emerald-500
    const ledgerCheckbox = page.locator(".ledger-row-checkbox:visible").first();
    await expect(ledgerCheckbox).toBeVisible();
    const ledgerCheckboxClass = await ledgerCheckbox.getAttribute("class");
    expect(ledgerCheckboxClass).toContain("accent-emerald-500");

    const criticalErrors = errors.filter(
      (e) => !e.includes("sw.js") && !e.includes("manifest.webmanifest")
    );
    expect(
      criticalErrors,
      "Zero console errors during trip completion"
    ).toEqual([]);
  });
});
