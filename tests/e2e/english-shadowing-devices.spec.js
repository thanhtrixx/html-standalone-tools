// @ts-check
const { test, expect } = require("@playwright/test");
const {
  assertNoHorizontalOverflow,
  trackConsoleErrors,
} = require("../helpers/e2e-fixture");

const APP_PATH = "/english-shadowing/";

async function setupPage(page) {
  const { errors } = trackConsoleErrors(page);
  await page.goto(APP_PATH, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#navBtnCatalog");
  await page.waitForSelector("#scenarioCardsGrid");
  await page.waitForTimeout(100);
  return { errors };
}

test.describe("English Shadowing Multi-Device E2E Suite", () => {
  test("1. Scenario Catalog, FTUX Guide & Responsive Layout", async ({
    page,
  }) => {
    const { errors } = await setupPage(page);
    await expect(page).toHaveTitle(/English Shadowing|Luyện Nói Shadowing/i);

    // Verify Catalog View & 3-Step FTUX Guide
    await expect(page.locator("#catalog-view")).toBeVisible();
    await expect(page.locator('[data-i18n="howToShadowTitle"]')).toBeVisible();

    // Verify all 6 curated scenario cards rendered in difficulty order
    const scenarioCards = page.locator("#scenarioCardsGrid > div");
    await expect(scenarioCards).toHaveCount(6);

    // First card should be A2 Specialty Coffee
    const firstTitle = page.locator("#scenarioCardsGrid h3").first();
    await expect(firstTitle).toContainText("Specialty Coffee");

    await assertNoHorizontalOverflow(page);

    const criticalErrors = errors.filter(
      (e) => !e.includes("sw.js") && !e.includes("manifest.json")
    );
    expect(criticalErrors, "Should have zero critical console errors").toEqual(
      []
    );
  });

  test("2. Core Shadowing Practice Flow & Audio Subtitle Sync", async ({
    page,
  }) => {
    await setupPage(page);

    // Click Practice on the first scenario card
    const firstPracticeBtn = page
      .locator("#scenarioCardsGrid button[onclick*='selectScenarioById']")
      .first();
    await firstPracticeBtn.click();

    // Verify Player view opens with active subtitles
    await expect(page.locator("#player-view")).toBeVisible();
    await expect(page.locator("#activeEnglishSubtitle")).toBeVisible();
    await expect(page.locator("#activeVietnameseSubtitle")).toBeVisible();

    // Verify karaoke word chips exist
    const karaokeWords = page.locator("#activeEnglishSubtitle .karaoke-word");
    await expect(karaokeWords).toHaveCount(14);

    // Verify sentence tracker and step navigation
    await expect(page.locator("#sentenceIndexTracker")).toContainText(
      "Sentence 1"
    );
    await page.click('button[title*="Next Sentence"]');
    await expect(page.locator("#sentenceIndexTracker")).toContainText(
      "Sentence 2"
    );
    await page.click('button[title*="Previous Sentence"]');
    await expect(page.locator("#sentenceIndexTracker")).toContainText(
      "Sentence 1"
    );

    // Verify Subtitle Masking Toggle
    await page.click("#subMaskPrimary");
    await expect(page.locator("#activeVietnameseSubtitle")).toBeHidden();
    await page.click("#subMaskDual");
    await expect(page.locator("#activeVietnameseSubtitle")).toBeVisible();

    await assertNoHorizontalOverflow(page);
  });

  test("3. Interactive Word Popover & Vocabulary Drawer", async ({ page }) => {
    await setupPage(page);
    await page
      .locator("#scenarioCardsGrid button[onclick*='selectScenarioById']")
      .first()
      .click();

    // Click a word chip in the active subtitle
    const wordChip = page.locator("#activeEnglishSubtitle .word-chip").first();
    await wordChip.click();

    // Verify popover appears within bounds
    await expect(page.locator("#wordPopover")).toBeVisible();
    await expect(page.locator("#popoverWord")).not.toBeEmpty();

    // Save word to Leitner deck
    await page.locator('#wordPopover button:has-text("Learning")').click();
    await expect(page.locator("#wordPopover")).toBeHidden();

    // Open Vocabulary Drawer & Verify item is listed
    await page.click("#navBtnVocab");
    await page.waitForTimeout(200);
    await expect(page.locator("#vocabDrawer")).not.toHaveClass(
      /translate-x-full/
    );
    await expect(page.locator("#vocabListContainer")).toBeVisible();

    // Close drawer
    await page
      .locator('#vocabDrawer button[aria-label="Close Vocabulary Drawer"]')
      .click();
    await expect(page.locator("#vocabDrawer")).toHaveClass(/translate-x-full/);

    await assertNoHorizontalOverflow(page);
  });

  test("4. URL Deep-Linking, Pinned Dock & Insights Analytics", async ({
    page,
  }) => {
    // Navigate directly with deep-link parameter
    await page.goto(`${APP_PATH}?scenario=tech-standup&cue=2`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector("#player-view:not(.hidden)");

    // Verify Player view opens immediately to targeted scenario
    await expect(page.locator("#player-view")).toBeVisible();
    await expect(page.locator("#activeScenarioTitle")).toContainText(
      "Tech Agile Standup"
    );
    await expect(page.locator("#sentenceIndexTracker")).toContainText(
      "Sentence 3"
    );

    // Verify fixed app shell body and pinned transport dock
    await expect(page.locator("body")).toHaveClass(/overflow-hidden/);
    const isDockWithinViewport = await page.evaluate(() => {
      const dock = document.getElementById("player-container");
      if (!dock) return false;
      const rect = dock.getBoundingClientRect();
      return rect.bottom <= window.innerHeight + 2 && rect.top >= 0;
    });
    expect(isDockWithinViewport, "Pinned dock must be within viewport").toBe(
      true
    );

    // Open & verify Insights Modal
    await page.click("#navBtnInsights");
    await expect(page.locator("#insightsModal")).toBeVisible();
    await expect(page.locator("#modalStreakDays")).toBeVisible();
    await page
      .locator('#insightsModal button[aria-label="Close Insights Modal"]')
      .click();
    await expect(page.locator("#insightsModal")).toBeHidden();

    // Return to catalog
    await page.click("#btnBackToCatalog");
    await expect(page.locator("#catalog-view")).toBeVisible();

    await assertNoHorizontalOverflow(page);
  });
});
