// @ts-check
const { expect } = require("@playwright/test");

/**
 * Asserts that the document body has no horizontal overflow beyond the viewport window width.
 * @param {import('@playwright/test').Page} page
 */
async function assertNoHorizontalOverflow(page) {
  await page.waitForLoadState("domcontentloaded");
  const isOverflowing = await page.evaluate(() => {
    return (
      document.documentElement.scrollWidth > window.innerWidth + 1 ||
      document.body.scrollWidth > window.innerWidth + 1
    );
  });
  expect(isOverflowing, "Page should have no horizontal overflow").toBe(false);
}

/**
 * Asserts that a target locator meets minimum mobile touch target dimensions (default: 44x44px).
 * @param {import('@playwright/test').Locator} locator
 * @param {number} [minW=44]
 * @param {number} [minH=44]
 */
async function assertTouchTargetSize(locator, minW = 44, minH = 44) {
  await locator.waitFor({ state: "visible" });
  const box = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  });
  expect(box, "Element should have a bounding box").not.toBeNull();
  if (box) {
    expect(
      box.width,
      `Width should be >= ${minW}px (was ${box.width}px)`
    ).toBeGreaterThanOrEqual(minW - 1);
    expect(
      box.height,
      `Height should be >= ${minH}px (was ${box.height}px)`
    ).toBeGreaterThanOrEqual(minH - 1);
  }
}

/**
 * Attaches a listener to track unhandled page errors and console errors.
 * @param {import('@playwright/test').Page} page
 * @returns {{ errors: string[] }}
 */
function trackConsoleErrors(page) {
  /** @type {string[]} */
  const errors = [];
  page.on("pageerror", (err) => {
    errors.push(`PageError: ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`ConsoleError: ${msg.text()}`);
    }
  });
  return { errors };
}

module.exports = {
  assertNoHorizontalOverflow,
  assertTouchTargetSize,
  trackConsoleErrors,
};
