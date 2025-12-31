/**
 * Tests for PresetCard Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PresetCard } from './PresetCard.js';
import { PresetConfig } from '../../shared/types.js';

describe('PresetCard', () => {
  const mockPreset: PresetConfig = {
    id: 'test-preset',
    name: 'Test Preset',
    platform: 'iOS',
    icon: '📱',
    settings: [
      { format: 'PNG', suffix: '@2x', constraint: { type: 'SCALE', value: 2 } },
      { format: 'PNG', suffix: '@1x', constraint: { type: 'SCALE', value: 1 } },
    ],
  };

  it('should render preset name', () => {
    const onClick = vi.fn();
    render(<PresetCard preset={mockPreset} onClick={onClick} />);
    
    expect(screen.getByText('Test Preset')).toBeInTheDocument();
  });

  it('should render preset icon', () => {
    const onClick = vi.fn();
    render(<PresetCard preset={mockPreset} onClick={onClick} />);
    
    expect(screen.getByText('📱')).toBeInTheDocument();
  });

  it('should show correct settings count', () => {
    const onClick = vi.fn();
    render(<PresetCard preset={mockPreset} onClick={onClick} />);
    
    expect(screen.getByText('2x')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<PresetCard preset={mockPreset} onClick={onClick} />);
    
    const button = screen.getByRole('button', { name: /Apply Test Preset/i });
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<PresetCard preset={mockPreset} onClick={onClick} disabled />);
    
    const button = screen.getByRole('button', { name: /Apply Test Preset/i });
    fireEvent.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should have disabled class when disabled', () => {
    const onClick = vi.fn();
    render(<PresetCard preset={mockPreset} onClick={onClick} disabled />);
    
    const button = screen.getByRole('button', { name: /Apply Test Preset/i });
    expect(button).toHaveClass('preset-card--disabled');
  });

  it('should be disabled attribute when disabled', () => {
    const onClick = vi.fn();
    render(<PresetCard preset={mockPreset} onClick={onClick} disabled />);
    
    const button = screen.getByRole('button', { name: /Apply Test Preset/i });
    expect(button).toBeDisabled();
  });
});
