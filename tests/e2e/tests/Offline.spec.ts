import { setTimeout } from "node:timers/promises";
import { expect, test } from "@playwright/test";

test.describe("Offline & online sync", () => {
  test("should sync when going online", async ({ page, browser }) => {
    const context = page.context();

    await page.goto("/retry-unavailable?userName=SuperMario");

    await context.setOffline(true);

    await page.getByRole("button", { name: "Create a new value!" }).click();

    const id = await page.getByTestId("id").textContent();

    await setTimeout(1000);

    await context.setOffline(false);

    // Create a new incognito instance and try to load the coValue
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(`/retry-unavailable?userName=Luigi&id=${id}`);

    await expect(newUserPage.getByTestId("id")).toBeInViewport({
      timeout: 20_000,
    });
  });
});
