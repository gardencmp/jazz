import { setTimeout } from "node:timers/promises";
import { expect, test } from "@playwright/test";

test.describe("FileStream - Sync", () => {
  test("should sync a file between the two peers", async ({ page }) => {
    await page.goto("/file-stream");

    await page.getByRole("button", { name: "Upload Test File" }).click();

    await page.getByTestId("sync-duration").waitFor();

    await expect(page.getByTestId("synced-with-server")).toHaveText(
      "Synced with the server: true",
    );

    await expect(page.getByTestId("result")).toHaveText(
      "Two way sync completed: true",
    );
  });

  test("should handle reconnections", async ({ page, browser }) => {
    const context = browser.contexts()[0];
    await page.goto("/file-stream?fileSize=" + 1e6); // 1MB file

    await page.getByRole("button", { name: "Upload Test File" }).click();

    await expect(page.getByTestId("synced-with-server")).toHaveText(
      "Synced with the server: false",
    );

    // Wait for the coMapDonwloaded signal to ensure that the iframe is loaded
    await page.getByTestId("co-map-downloaded").waitFor();

    await context.setOffline(true);

    // Wait for the ping system to detect the offline state
    await setTimeout(10000);

    await context.setOffline(false);

    // Wait for the sync to complete
    await page.getByTestId("sync-duration").waitFor();

    await expect(page.getByTestId("synced-with-server")).toHaveText(
      "Synced with the server: true",
    );

    await expect(page.getByTestId("result")).toHaveText(
      "Two way sync completed: true",
    );
  });
});
