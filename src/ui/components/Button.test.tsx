/**
 * Tests for Button Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button.js';

describe('Button', () => {
  it('should render children', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Click Me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should apply primary variant class', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} variant="primary">Click Me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('figma-button--primary');
  });

  it('should apply secondary variant class by default', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('figma-button--secondary');
  });

  it('should apply destructive variant class', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} variant="destructive">Delete</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('figma-button--destructive');
  });

  it('should apply full width class when fullWidth is true', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} fullWidth>Click Me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('figma-button--full');
  });

  it('should be disabled when disabled prop is true', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Click Me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
