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
  test("1. Scenario Catalog & Zero Horizontal Overflow", async ({ page }) => {
    const { errors } = await setupPage(page);
    await expect(page).toHaveTitle(/English Shadowing|Luyện Nói Shadowing/i);

    // Verify Catalog View is visible
    await expect(page.locator("#catalog-view")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Verify Scenario Cards rendered
    const scenarioCards = page.locator("#scenarioCardsGrid > div");
    await expect(scenarioCards).toHaveCount(4);

    const criticalErrors = errors.filter(
      (e) => !e.includes("sw.js") && !e.includes("manifest.json")
    );
    expect(criticalErrors, "Should have zero critical console errors").toEqual(
      []
    );
  });

  test("2. Select Scenario & Active Shadowing Player Flow", async ({
    page,
  }) => {
    await setupPage(page);

    // Click Practice on the first scenario card
    const firstPracticeBtn = page.locator("#scenarioCardsGrid button").first();
    await firstPracticeBtn.click();

    // Verify Player view opens
    await expect(page.locator("#player-view")).toBeVisible();
    await expect(page.locator("#activeEnglishSubtitle")).toBeVisible();
    await expect(page.locator("#activeVietnameseSubtitle")).toBeVisible();

    // Verify sentence index tracker
    await expect(page.locator("#sentenceIndexTracker")).toContainText(
      "Sentence 1"
    );

    // Click Next Sentence
    await page.click('button[title*="Next Sentence"]');
    await expect(page.locator("#sentenceIndexTracker")).toContainText(
      "Sentence 2"
    );

    // Click Previous Sentence
    await page.click('button[title*="Previous Sentence"]');
    await expect(page.locator("#sentenceIndexTracker")).toContainText(
      "Sentence 1"
    );

    await assertNoHorizontalOverflow(page);
  });

  test("3. Subtitle Masking Modes & Speed Controls", async ({ page }) => {
    await setupPage(page);
    await page.locator("#scenarioCardsGrid button").first().click();

    // Toggle English Only
    await page.click("#subMaskPrimary");
    await expect(page.locator("#activeEnglishSubtitle")).toBeVisible();
    await expect(page.locator("#activeVietnameseSubtitle")).toBeHidden();

    // Toggle Vietnamese Only
    await page.click("#subMaskSecondary");
    await expect(page.locator("#activeEnglishSubtitle")).toBeHidden();
    await expect(page.locator("#activeVietnameseSubtitle")).toBeVisible();

    // Toggle Dual
    await page.click("#subMaskDual");
    await expect(page.locator("#activeEnglishSubtitle")).toBeVisible();
    await expect(page.locator("#activeVietnameseSubtitle")).toBeVisible();

    // Toggle Blur
    await page.click("#subMaskBlur");
    await expect(page.locator("#subtitleStage")).toHaveClass(
      /subtitles-blur-active/
    );

    // Speed popover selection
    await expect(page.locator("#speedBtnText")).toHaveText("1.0x");
    await page.locator("#speedBtn").scrollIntoViewIfNeeded();
    await page.locator("#speedBtn").click();
    await expect(page.locator("#speedPopover")).toBeVisible();
    await page.locator('#speedPopover button:has-text("1.15x")').click();
    await expect(page.locator("#speedBtnText")).toHaveText("1.15x");
  });

  test("4. Interactive Word Popover & Vocabulary Drawer", async ({ page }) => {
    await setupPage(page);
    await page.locator("#scenarioCardsGrid button").first().click();
    await page.click("#subMaskDual");

    // Click a word chip in the active subtitle
    const wordChip = page.locator("#activeEnglishSubtitle .word-chip").first();
    await wordChip.click();

    // Verify popover appears
    await expect(page.locator("#wordPopover")).toBeVisible();
    await expect(page.locator("#popoverWord")).not.toBeEmpty();

    // Set word status to 'learning'
    await page.locator('#wordPopover button:has-text("Learning")').click();
    await expect(page.locator("#wordPopover")).toBeHidden();

    // Open Vocabulary Drawer
    await page.click("#navBtnVocab");
    await page.waitForTimeout(300);
    await expect(page.locator("#vocabDrawer")).not.toHaveClass(
      /translate-x-full/
    );
    await expect(page.locator("#vocabListContainer")).toBeVisible();

    // Close drawer
    await page
      .locator('#vocabDrawer button[aria-label="Close Vocabulary Drawer"]')
      .click();
    await expect(page.locator("#vocabDrawer")).toHaveClass(/translate-x-full/);
  });

  test("5. Real-time Karaoke Word Tokens & Audio Playback Flow", async ({
    page,
  }) => {
    await setupPage(page);
    await page.locator("#scenarioCardsGrid button").first().click();

    // Verify karaoke word tokens exist
    const karaokeWords = page.locator("#activeEnglishSubtitle .karaoke-word");
    await expect(karaokeWords).toHaveCount(10);

    // Verify HTML5 Audio element exists
    const audioElement = page.locator("#playerAudio");
    await expect(audioElement).toHaveCount(1);

    // Verify audio scrubber milestones exist
    const milestones = page.locator("#scrubberMilestones > div");
    await expect(milestones).toHaveCount(7);

    // Toggle play/pause
    await page.click("#mainPlayPauseBtn");
    await page.waitForTimeout(300);
    await page.click("#mainPlayPauseBtn");

    await assertNoHorizontalOverflow(page);
  });

  test("6. Integrated Player Card & Collapsible Transcript Drawer", async ({
    page,
  }) => {
    await setupPage(page);
    await page.locator("#scenarioCardsGrid button").first().click();

    // Verify Integrated Player Card exists
    await expect(page.locator("#player-container")).toBeVisible();
    await expect(page.locator("#transport-dock")).toBeVisible();

    // Verify Transcript Card exists
    await expect(page.locator("#transcriptCard")).toBeVisible();
    await expect(page.locator("#transcriptDrawerContent")).toBeVisible();

    // Toggle Collapse Transcript Drawer
    await page.click("#transcriptCard > div:first-child");
    await expect(page.locator("#transcriptDrawerContent")).toBeHidden();

    // Expand Transcript Drawer again
    await page.click("#transcriptCard > div:first-child");
    await expect(page.locator("#transcriptDrawerContent")).toBeVisible();

    await assertNoHorizontalOverflow(page);
  });

  test("7. URL Deep-Linking Navigation & History State Sync", async ({
    page,
  }) => {
    // Navigate directly with scenario and cue parameter
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

    // Return back to catalog
    await page.click("#btnBackToCatalog");
    await expect(page.locator("#catalog-view")).toBeVisible();
    expect(page.url()).not.toContain("scenario=tech-standup");

    await assertNoHorizontalOverflow(page);
  });

  test("8. Practice Insights Modal & Daily Goals Analytics", async ({
    page,
  }) => {
    await setupPage(page);

    // Open Insights Modal from header
    await page.click("#navBtnInsights");
    await expect(page.locator("#insightsModal")).toBeVisible();

    // Verify statistics cards are rendered
    await expect(page.locator("#modalStreakDays")).toBeVisible();
    await expect(page.locator("#modalPracticeTime")).toBeVisible();
    await expect(page.locator("#modalGoalProgressBar")).toBeAttached();
    await expect(page.locator("#modalSentencesToday")).toBeVisible();
    await expect(page.locator("#modalDueWordsCount")).toBeVisible();

    // Close modal
    await page
      .locator('#insightsModal button[aria-label="Close Insights Modal"]')
      .click();
    await expect(page.locator("#insightsModal")).toBeHidden();

    await assertNoHorizontalOverflow(page);
  });

  test("9. Default Continuous Flow Mode & Active Line Auto-Centering", async ({
    page,
  }) => {
    await setupPage(page);
    await page.locator("#scenarioCardsGrid button").first().click();

    // Verify Continuous Flow Mode is active by default
    await expect(page.locator("#modeContinuousBtn")).toHaveClass(
      /bg-emerald-500\/20/
    );

    // Navigate across sentences and check transcript line styling
    const firstLine = page.locator("#transcriptItem-0");
    await expect(firstLine).toHaveClass(/bg-emerald-500\/(10|15)/);

    // Step to sentence 2
    await page.click('button[title*="Next Sentence"]');
    const secondLine = page.locator("#transcriptItem-1");
    await expect(secondLine).toHaveClass(/bg-emerald-500\/(10|15)/);

    await assertNoHorizontalOverflow(page);
  });

  test("10. App Shell & Pinned Bottom Dock Reachability", async ({ page }) => {
    await setupPage(page);
    await page.locator("#scenarioCardsGrid button").first().click();

    // Verify fixed app shell body
    await expect(page.locator("body")).toHaveClass(/overflow-hidden/);

    // Verify Hero Subtitle Stage, Transcript Card, and Pinned Dock are all visible within viewport
    await expect(page.locator("#subtitleStage")).toBeVisible();
    await expect(page.locator("#transcriptCard")).toBeVisible();
    await expect(page.locator("#player-container")).toBeVisible();

    const isDockWithinViewport = await page.evaluate(() => {
      const dock = document.getElementById("player-container");
      if (!dock) return false;
      const rect = dock.getBoundingClientRect();
      return rect.bottom <= window.innerHeight + 2 && rect.top >= 0;
    });
    expect(isDockWithinViewport, "Pinned dock must be within viewport").toBe(
      true
    );

    await assertNoHorizontalOverflow(page);
  });
});
