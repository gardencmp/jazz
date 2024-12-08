import { expect, test } from '@playwright/test';
import path from 'path';

// Configure the authenticator
const authenticatorId = 'auth-id';

test.beforeEach(async ({ context }) => {
  // Enable virtual authenticator environment
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
});

test('can login with passkey and upload file', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Look for login button or link
  const loginTrigger = page.getByRole('button', { name: /login|sign in/i })
    .or(page.getByRole('link', { name: /login|sign in/i }));
  await expect(loginTrigger).toBeVisible();
  
  // Click login and handle the passkey authentication
  await loginTrigger.click();
  
  // Wait for the credential prompt and handle it
  await page.waitForLoadState('networkidle');
  
  // Verify successful login by checking for user-specific element
  await expect(page.getByText(/logged in|welcome/i)).toBeVisible();
  
  // Prepare file upload
  const filePath = path.join(__dirname, 'fixtures/test-file.txt');
  
  // Click upload button and handle file selection
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /upload|add file/i }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
  
  // Wait for upload to complete and verify success
  await expect(page.getByText(/upload(ed)? successful|file added/i)).toBeVisible();
  
  // Verify the uploaded file appears in the list
  await expect(page.getByText('test-file.txt')).toBeVisible();
});
