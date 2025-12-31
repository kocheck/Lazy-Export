/**
 * Tests for Toast Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from './Toast.js';

describe('Toast', () => {
  it('should render error toast with message', () => {
    const onClose = vi.fn();
    render(<Toast message="Test error" type="error" onClose={onClose} />);

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should render success toast with message', () => {
    const onClose = vi.fn();
    render(<Toast message="Success!" type="success" onClose={onClose} />);

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('should render info toast with message', () => {
    const onClose = vi.fn();
    render(<Toast message="Info message" type="info" onClose={onClose} />);

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" type="info" onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /×/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should show action buttons for error toast with error object', () => {
    const onClose = vi.fn();
    const error = new Error('Test error');
    render(<Toast message="Error occurred" type="error" error={error} onClose={onClose} />);

    expect(screen.getByText(/Copy Debug Info/i)).toBeInTheDocument();
    expect(screen.getByText(/Report Issue/i)).toBeInTheDocument();
  });

  it('should not show action buttons for success toast', () => {
    const onClose = vi.fn();
    render(<Toast message="Success!" type="success" onClose={onClose} />);

    expect(screen.queryByText(/Copy Debug Info/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Report Issue/i)).not.toBeInTheDocument();
  });

  it('should not show action buttons for error toast without error object', () => {
    const onClose = vi.fn();
    render(<Toast message="Error!" type="error" onClose={onClose} />);

    expect(screen.queryByText(/Copy Debug Info/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Report Issue/i)).not.toBeInTheDocument();
  });

  it('should copy debug info when Copy button clicked', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });
    global.alert = vi.fn();

    const onClose = vi.fn();
    const error = new Error('Test error');
    render(<Toast message="Error occurred" type="error" error={error} onClose={onClose} />);

    const copyButton = screen.getByText(/Copy Debug Info/i);
    fireEvent.click(copyButton);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockWriteText).toHaveBeenCalled();
    const clipboardContent = mockWriteText.mock.calls[0][0];
    expect(clipboardContent).toContain('Bug Report');
  });

  it('should handle clipboard copy failure gracefully', async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Failed'));
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });
    global.alert = vi.fn();

    const onClose = vi.fn();
    const error = new Error('Test error');
    render(<Toast message="Error occurred" type="error" error={error} onClose={onClose} />);

    const copyButton = screen.getByText(/Copy Debug Info/i);
    fireEvent.click(copyButton);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should still have attempted to copy
    expect(mockWriteText).toHaveBeenCalled();
  });

  it('should open GitHub issue page when Report Issue clicked', () => {
    const mockOpen = vi.fn();
    global.window.open = mockOpen;

    const onClose = vi.fn();
    const error = new Error('Test error');
    render(<Toast message="Error occurred" type="error" error={error} onClose={onClose} />);

    const reportButton = screen.getByText(/Report Issue/i);
    fireEvent.click(reportButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('github.com/kocheck/Lazy-Export/issues/new'),
      '_blank'
    );
  });

  it('should show error icon for error type', () => {
    const onClose = vi.fn();
    render(<Toast message="Error" type="error" onClose={onClose} />);

    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('should show success icon for success type', () => {
    const onClose = vi.fn();
    render(<Toast message="Success" type="success" onClose={onClose} />);

    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('should show info icon for info type', () => {
    const onClose = vi.fn();
    render(<Toast message="Info" type="info" onClose={onClose} />);

    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });
});
