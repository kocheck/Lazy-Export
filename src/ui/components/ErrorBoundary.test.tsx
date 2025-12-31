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

  it('should copy debug info to clipboard when button clicked', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    // Mock alert
    global.alert = vi.fn();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const button = screen.getByText(/Copy Debug Info/i);
    fireEvent.click(button);

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockWriteText).toHaveBeenCalled();
    const clipboardContent = mockWriteText.mock.calls[0][0];
    expect(clipboardContent).toContain('Bug Report');
    expect(clipboardContent).toContain('Plugin Version: 2.0.0');
  });

  it('should use fallback copy method when clipboard API fails', async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard API not available'));
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    // Mock document.execCommand
    document.execCommand = vi.fn().mockReturnValue(true);
    global.alert = vi.fn();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const button = screen.getByText(/Copy Debug Info/i);
    fireEvent.click(button);

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockWriteText).toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(global.alert).toHaveBeenCalled();
  });

  it('should open GitHub issue page when Report button clicked', () => {
    const mockOpen = vi.fn();
    global.window.open = mockOpen;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const button = screen.getByText(/Report on GitHub/i);
    fireEvent.click(button);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('github.com/kocheck/Lazy-Export/issues/new'),
      '_blank'
    );
  });
});
