import { test, expect } from '@playwright/test';
import { SERVER_URL } from './common';

test.describe('Server Shutdown', () => {
  test('should gracefully shutdown server', async ({ request }) => {
    const response = await request.post(`${SERVER_URL}/stop`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('m', 'Performance data written to CSV. Server shutting down.');
  });
});