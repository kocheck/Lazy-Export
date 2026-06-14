/**
 * Tests for Modal component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal.js';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Title">
        <p>Body</p>
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title and children when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="My Title">
        <p>Body content</p>
      </Modal>
    );
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="T">
        <p>Body</p>
      </Modal>
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} title="T">
        <p>Body</p>
      </Modal>
    );
    const overlay = container.querySelector('.modal-overlay');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when content is clicked (propagation stopped)', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="T">
        <p>Body content</p>
      </Modal>
    );
    fireEvent.click(screen.getByText('Body content'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
