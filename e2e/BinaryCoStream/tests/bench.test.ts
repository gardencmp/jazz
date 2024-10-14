import { test, expect } from "@playwright/test";
import { runBenchmarks } from "./bench/runner";

test.describe("BinaryCoStream - Benchmarks", () => {
  test("should sync a 1MB file between the two peers", async ({ browser, baseURL }) => {
    const result = await runBenchmarks(browser, {
        runs: 3,
        benchmark: async (page, { isBaseline }) => {
            if (isBaseline) {
                await page.goto("https://binary-test-sage.vercel.app/?auto&fileSize=1000000&localSync");
            } else {
                const url = new URL(baseURL!);
                url.searchParams.set("localSync", "true");
                url.searchParams.set("auto", "true");
                url.searchParams.set("fileSize", "1000000");

                await page.goto(url.toString());
            }

            await page.getByRole("button", { name: "Upload Test File" }).click();

            await page.getByTestId("sync-duration").waitFor();

            return page.evaluate(() => {
                return performance.getEntriesByName('sync')[0].duration;
            });
        }
    });

    console.log(result);

    expect(result).toBeTruthy();
  });

});
