import { expect, test } from '@playwright/test';
import type { BrowserContext } from 'playwright-core';
import path from 'path';

async function mockAuthenticator(context: BrowserContext) {
  await context.addInitScript(() => {
    Object.defineProperty(window.navigator, 'credentials', {
      value: {
        ...window.navigator.credentials,
        create: async () => ({
          type: 'public-key',
          id: new Uint8Array([1, 2, 3, 4]),
          rawId: new Uint8Array([1, 2, 3, 4]),
          response: {
            clientDataJSON: new Uint8Array([1]),
            attestationObject: new Uint8Array([2])
          }
        }),
        get: async () => ({
          type: 'public-key',
          id: new Uint8Array([1, 2, 3, 4]),
          rawId: new Uint8Array([1, 2, 3, 4]),
          response: {
            authenticatorData: new Uint8Array([1]),
            clientDataJSON: new Uint8Array([2]),
            signature: new Uint8Array([3])
          }
        })
      },
      configurable: true
    });
  });
}

// Configure the authenticator
test.beforeEach(async ({ context }) => {
  // Enable virtual authenticator environment
  await mockAuthenticator(context);
});

test('can login with passkey and upload file', async ({ page, browser }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Click login and handle the passkey authentication
  await page.getByRole('textbox').fill('Capitan Hook');
  await page.getByRole('button', { name: "Sign up" }).click();
  
  // Verify successful login by checking for user-specific element
  await expect(page.getByText("File Share")).toBeVisible();
  
  // Prepare file upload
  const filePath = path.join(import.meta.dirname, 'fixtures/test-file.txt');
  
  // Click upload button and handle file selection
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /upload|add file/i }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
  
  // Verify the uploaded file appears in the list
  await expect(page.getByText('test-file.txt')).toBeVisible();

  await page.getByRole('button', { name: 'Share file' }).click();
  const inviteLink = await page.evaluate(() => navigator.clipboard.readText());

  // Create a new incognito instance and try to load the shared file
  const newContext = await browser.newContext();
  await mockAuthenticator(newContext);

  const newUserPage = await newContext.newPage();
  await newUserPage.goto(`/`);

  await newUserPage.getByRole('textbox').fill('Mr. Smee');
  await newUserPage.getByRole('button', { name: "Sign up" }).click();

  await expect(newUserPage.getByText("File Share")).toBeVisible();

  await newUserPage.goto(inviteLink);

  await expect(newUserPage.getByText("test-file.txt")).toBeVisible();
});
