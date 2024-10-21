import { Page, chromium, Browser } from '@playwright/test';
import { logger } from '../../src/util';

export const SERVER_URL = 'https://localhost:3000';
const NUM_BROWSERS: number = 10;

export function getRandomCoValueIndex(): number {
    return Math.floor(Math.random() * 5) + 1;
}

async function setupBrowser(index: number, url: string): Promise<{ browser: Browser; page: Page }> {
    const browser: Browser = await chromium.launch();
    const page: Page = await browser.newPage();
    await page.goto(url);
    logger.debug(`Visiting URL in [client-#${index + 1}]: ${url}`);
    // Wait for the page to load ...
    await page.waitForSelector('body', { state: 'attached' });
    
    return { browser, page };
}

export async function spawnBrowsers(uuid: string, isBinary: boolean) {
    const url = `${SERVER_URL}?uuid=${uuid}&binary=${isBinary}`;
    const browserPromises: Promise<{ browser: Browser; page: Page }>[] = [];
    for (let i = 0; i < NUM_BROWSERS; i++) {
        browserPromises[i] = setupBrowser(i, `${url}&ua=${i+1}`);
    }  
    const browsers: { browser: Browser; page: Page }[] = await Promise.all(browserPromises);
    logger.debug(`All ${NUM_BROWSERS} browsers have loaded ${url}`);
    return browsers;
}
