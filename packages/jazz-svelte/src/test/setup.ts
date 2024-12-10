/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

