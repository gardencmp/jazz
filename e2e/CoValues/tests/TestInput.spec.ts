import { expect, test } from "@playwright/test";

test.describe("CoMap - TestInput", () => {
  test("should keep the cursor position when typing", async ({ page }) => {
    await page.goto("/test-input");

    await page.getByRole("textbox").fill("xx");
    await page.getByRole("textbox").press("ArrowLeft");
    await page.getByRole("textbox").press("y");
    await page.getByRole("textbox").press("y");

    await expect(page.getByRole("textbox")).toHaveValue("xyyx");
  });
});
