import { test, expect } from '@playwright/test';

test('BinaryCoStream - Sync', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Upload Test File' }).click();

  await page.getByTestId('sync-duration').waitFor();

  await expect(page.getByTestId('result')).toHaveText('Sync Completed: true');
});
