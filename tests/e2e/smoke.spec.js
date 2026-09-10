// @ts-check
const { test, expect } = require("@playwright/test");
const {
  assertNoHorizontalOverflow,
  trackConsoleErrors,
} = require("../helpers/e2e-fixture");

test.describe("Portal & App Smoke across 4 Device Profiles", () => {
  test("Loads portal hub without horizontal overflow or console errors", async ({
    page,
  }) => {
    const { errors } = trackConsoleErrors(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/HTML Standalone Tools|Portal/i);
    await assertNoHorizontalOverflow(page);
    expect(errors, "Should have zero console errors").toEqual([]);
  });
});
