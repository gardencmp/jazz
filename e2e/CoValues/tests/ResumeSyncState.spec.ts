import { test, expect } from "@playwright/test";
import { setTimeout } from "node:timers/promises";

test.describe("ResumeSyncState", () => {
  test.skip("should resume the sync even after a page reload", async ({ page, browser }) => {
    const context = page.context();

    await page.goto("/resume-sync?userName=SuperMario");

    const id = await page.getByTestId("id").textContent();

    // Sync an initial value
    await page.getByRole("textbox", { name: "Value" }).fill("Let's go!");
    await setTimeout(1000);

    await context.setOffline(true);

    // Change the value while offline
    await page.getByRole("textbox", { name: "Value" }).fill("Mammamia!");

    // Navigate away from the page
    await page.goto(`about:blank`);
  
    await setTimeout(1000);
    await context.setOffline(false);

    // Reload the page but without loading the coValue
    // await page.goto(`/resume-sync?userName=SuperMario`);
    await page.goto(`/resume-sync?userName=SuperMario`);

    await setTimeout(1000);

    await expect(page.getByTestId("id")).toBeInViewport();

    // Create a new incognito instance and try to load the coValue
    const newUserPage = await (await browser.newContext()).newPage();
    await newUserPage.goto(`/resume-sync?userName=Luigi&id=${id}`);

    await expect(newUserPage.getByTestId("id")).toBeInViewport();

    // The initial user should have synced the value even if the coValue was not loaded
    // when the user is back online
    await expect(newUserPage.getByRole("textbox", { name: "Value" })).toHaveValue("Mammamia!", {
      timeout: 20_000
    });
  });
});
