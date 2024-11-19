import { setTimeout } from "node:timers/promises";
import { expect, test } from "@playwright/test";

test.describe("Retry unavailable states", () => {
  test("should retry unavailable values", async ({ page, browser }) => {
    const context = page.context();

    await page.goto("/retry-unavailable?userName=SuperMario");

    await context.setOffline(true);

    await page.getByRole("button", { name: "Create a new value!" }).click();

    const id = await page.getByTestId("id").textContent();

    // Create a new incognito instance and try to load the coValue
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(`/retry-unavailable?userName=Luigi&id=${id}`);

    await expect(newUserPage.getByTestId("id")).toBeInViewport({
      timeout: 20_000,
    });

    // Make the load fail at least twice
    await setTimeout(1000);

    // Go back online, the value should be uploaded
    await context.setOffline(false);

    await expect(newUserPage.getByTestId("id")).toHaveText(id ?? "", {
      timeout: 20_000,
    });
  });
});
