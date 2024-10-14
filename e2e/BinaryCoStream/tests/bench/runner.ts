import { Browser, Page } from "@playwright/test";
import { summaryStats, computeDifference } from "./stats";
import { formatDifference } from "./format";

export type BenchmarkConfig = {
    runs: number;
    benchmark: (page: Page, props: { isBaseline: boolean }) => Promise<number>;
}

export async function runBenchmarks(browser: Browser, config: BenchmarkConfig) {
    const context = await browser.newContext();
    const page = await context.newPage();

    const baselineResults: number[] = [];
    const curentTargetResults: number[] = [];

    for (let i = 0; i < config.runs; i++) {
        const baselinePage = await context.newPage();  
       baselineResults.push(await config.benchmark(baselinePage, { isBaseline: true }));
       baselinePage.close();
       const currentTargetPage = await context.newPage();
       curentTargetResults.push(await config.benchmark(currentTargetPage, { isBaseline: false }));
       currentTargetPage.close();
    }

    const baselineStats = summaryStats(baselineResults);
    const currentTargetStats = summaryStats(curentTargetResults);

    const diff = computeDifference(currentTargetStats, baselineStats);

    return {
        baselineStats,
        currentTargetStats,
        result: formatDifference(diff),
    }
    
}