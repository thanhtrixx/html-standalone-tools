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

    // Speed button cycle
    await expect(page.locator("#speedBtn")).toHaveText("1.0x");
    await page.locator("#speedBtn").scrollIntoViewIfNeeded();
    await page.locator("#speedBtn").click();
    await expect(page.locator("#speedBtn")).toHaveText("1.15x");
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
      .click({ force: true });
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
});
