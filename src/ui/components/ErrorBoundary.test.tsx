/**
 * Tests for ErrorBoundary Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary.js';
import React from 'react';

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  let consoleError: any;

  beforeEach(() => {
    // Suppress console.error for these tests
    consoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = consoleError;
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show error description', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/The plugin encountered an unexpected error/i)).toBeInTheDocument();
  });

  it('should show Copy Debug Info button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Copy Debug Info/i)).toBeInTheDocument();
  });

  it('should show Report on GitHub button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Report on GitHub/i)).toBeInTheDocument();
  });

  it('should show Reload Plugin button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Reload Plugin/i)).toBeInTheDocument();
  });

  it('shows a success status after copying debug info', async () => {
    const exec = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText(/Copy Debug Info/i));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(exec).toHaveBeenCalledWith('copy');
    expect(await screen.findByText(/Copied!/i)).toBeInTheDocument();
    exec.mockRestore();
  });

  it('shows a failure status when the copy fails', async () => {
    const exec = vi.spyOn(document, 'execCommand').mockReturnValue(false);

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText(/Copy Debug Info/i));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(exec).toHaveBeenCalledWith('copy');
    expect(await screen.findByText(/Copy failed/i)).toBeInTheDocument();
    exec.mockRestore();
  });

  it('posts an open-external-url message when Report on GitHub clicked', () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText(/Report on GitHub/i));

    expect(postMessage).toHaveBeenCalledWith(
      {
        pluginMessage: {
          type: 'open-external-url',
          url: expect.stringContaining('github.com/kocheck/Lazy-Export/issues/new'),
        },
      },
      '*'
    );
    postMessage.mockRestore();
  });
});
