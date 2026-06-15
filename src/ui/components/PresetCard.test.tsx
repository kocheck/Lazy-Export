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

  it('should render a format badge for the preset', () => {
    const onClick = vi.fn();
    render(<PresetCard preset={mockPreset} onClick={onClick} />);

    expect(screen.getByText('PNG')).toBeInTheDocument();
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

  it('renders the last-used badge when isLastUsed is true', () => {
    const onClick = vi.fn();
    render(<PresetCard preset={mockPreset} onClick={onClick} isLastUsed />);
    expect(screen.getByText(/Last used/i)).toBeInTheDocument();
  });

  it('does not render the last-used badge by default', () => {
    const onClick = vi.fn();
    render(<PresetCard preset={mockPreset} onClick={onClick} />);
    expect(screen.queryByText(/Last used/i)).not.toBeInTheDocument();
  });

  it('folds "(last used)" into the accessible name when isLastUsed (#15)', () => {
    render(<PresetCard preset={mockPreset} onClick={vi.fn()} isLastUsed />);
    expect(
      screen.getByRole('button', { name: 'Apply Test Preset export preset (last used)' })
    ).toBeInTheDocument();
  });

  it('omits "(last used)" from the accessible name by default', () => {
    render(<PresetCard preset={mockPreset} onClick={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Apply Test Preset export preset' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\(last used\)/i })).not.toBeInTheDocument();
  });

  it('sets aria-busy when busy and omits it otherwise', () => {
    const { rerender } = render(<PresetCard preset={mockPreset} onClick={vi.fn()} busy />);
    expect(screen.getByRole('button', { name: /Apply Test Preset/i })).toHaveAttribute(
      'aria-busy',
      'true'
    );
    rerender(<PresetCard preset={mockPreset} onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Apply Test Preset/i })).not.toHaveAttribute(
      'aria-busy'
    );
  });
});
