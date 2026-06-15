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

    const closeButton = screen.getByRole('button', { name: /close/i });
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

  it('shows a success status after copying debug info', async () => {
    const exec = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const onClose = vi.fn();
    const error = new Error('Test error');
    render(<Toast message="Error occurred" type="error" error={error} onClose={onClose} />);

    fireEvent.click(screen.getByText(/Copy Debug Info/i));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(exec).toHaveBeenCalledWith('copy');
    expect(await screen.findByText(/Copied!/i)).toBeInTheDocument();
    exec.mockRestore();
  });

  it('shows a failure status when the copy fails', async () => {
    const exec = vi.spyOn(document, 'execCommand').mockReturnValue(false);

    const onClose = vi.fn();
    const error = new Error('Test error');
    render(<Toast message="Error occurred" type="error" error={error} onClose={onClose} />);

    fireEvent.click(screen.getByText(/Copy Debug Info/i));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(exec).toHaveBeenCalledWith('copy');
    expect(await screen.findByText(/Copy failed/i)).toBeInTheDocument();
    exec.mockRestore();
  });

  it('posts an open-external-url message when Report Issue clicked', () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});

    const onClose = vi.fn();
    const error = new Error('Test error');
    render(<Toast message="Error occurred" type="error" error={error} onClose={onClose} />);

    fireEvent.click(screen.getByText(/Report Issue/i));

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

  it('copies Contents.json via execCommand and shows status', async () => {
    const exec = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const onClose = vi.fn();
    render(
      <Toast
        message="Export complete"
        type="success"
        metadata={{ iosContentsJson: '{"images":[]}' }}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText(/Copy Contents\.json/i));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(exec).toHaveBeenCalledWith('copy');
    expect(await screen.findByText(/Copied!/i)).toBeInTheDocument();
    exec.mockRestore();
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
