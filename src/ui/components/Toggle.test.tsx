/**
 * Tests for Toggle Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from './Toggle.js';

describe('Toggle', () => {
  it('should render with label', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Advanced Mode" />);
    
    expect(screen.getByText('Advanced Mode')).toBeInTheDocument();
  });

  it('should be checked when checked prop is true', () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} label="Test" />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should not be checked when checked prop is false', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Test" />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should call onChange with true when clicked while unchecked', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Test" />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('should call onChange with false when clicked while checked', () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} label="Test" />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('should be disabled when disabled prop is true', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Test" disabled />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should have disabled class when disabled', () => {
    const onChange = vi.fn();
    const { container } = render(<Toggle checked={false} onChange={onChange} label="Test" disabled />);
    
    const label = container.querySelector('.toggle');
    expect(label).toHaveClass('toggle--disabled');
  });
});
