import { test, expect, Page, Browser } from '@playwright/test';
import { SERVER_URL, getRandomCoValueIndex, spawnBrowsers } from '../common';
import { logger } from '../../src/util';

test.describe('Structured CoValue (text)', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('load', async () => {
        await page.goto(SERVER_URL);

        // Wait for the connection to be established
        await page.waitForSelector('#status >> text=CoValue UUIDs loaded successfully.');

        // Select a CoValue
        await page.selectOption('select#coValueSelect', { index: getRandomCoValueIndex() });

        // Load a CoValue
        await page.click('#loadCoValueText');

        // Wait for the response to appear in the status
        await page.waitForSelector('#status >> text=Loaded (JSON) data for:');
    });

    test('create', async () => {
        await page.goto(SERVER_URL);

        await page.waitForSelector('#status >> text=CoValue UUIDs loaded successfully.');

        // Note the total number of CoValues loaded
        let options = await page.locator('select#coValueSelect option').all();
        const optionsCount = options.length;

        // Create a CoValue
        await page.click('#createCoValueText');

        // Wait for the response to appear in the status
        await page.waitForSelector('#status >> text=Created (JSON) data for:');
        options = await page.locator('select#coValueSelect option').all();

        // assert that the CoValues list has increased by 1
        expect(options.length).toEqual(optionsCount + 1);
    });

    test('mutate', async () => {
        await page.goto(SERVER_URL);

        // Wait for the connection to be established
        await page.waitForSelector('#status >> text=CoValue UUIDs loaded successfully.');

        // Select a CoValue
        await page.selectOption('select#coValueSelect', { index: getRandomCoValueIndex() });

        const uuid = await page.locator('select#coValueSelect').evaluate((el: HTMLSelectElement) => el.value);
        logger.debug(`Selected random CoValue: ${uuid}`);

        // Spawn 10 mutation event clients
        const browsers: { browser: Browser; page: Page }[] = await spawnBrowsers(uuid, false);
                    
        // Mutate a CoValue
        await page.click('#mutateCoValueText');

        // Wait for the response to appear in the status
        await page.waitForSelector('#status >> text=Mutated (JSON) data for:');

        // Check all browsers got the mutation event
        for (let i: number = 0; i < browsers.length; i++) {
            const { page: clientPage } = browsers[i];

            await clientPage.waitForSelector(`#status >> text=Mutation event`);
            logger.debug(`Browser ${i + 1} received the mutation event.`);  
        }

        await Promise.all(browsers.map(({ browser }) => browser.close()));
        logger.debug('All browsers closed');    
    });
});