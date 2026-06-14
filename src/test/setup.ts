import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// jsdom does not implement execCommand; clipboard.ts relies on it for the
// Figma-iframe copy path. Default it to a succeeding mock so unrelated tests
// that hit the copy path don't throw. Individual tests override per-case.
document.execCommand = vi.fn(() => true);

afterEach(() => {
  cleanup();
});
