/**
 * Tests for PresetCreator component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PresetCreator } from './PresetCreator.js';
import type { CustomPreset } from '../../shared/types.js';

describe('PresetCreator', () => {
  beforeEach(() => {
    // handleSave uses alert() for the empty-name validation path.
    global.alert = vi.fn();
  });

  it('blocks save and alerts when the name is empty', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText('Save Preset'));

    expect(global.alert).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a well-formed custom preset when a name is provided', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/My Custom Preset/i), {
      target: { value: 'My Preset' },
    });
    fireEvent.click(screen.getByText('Save Preset'));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0] as CustomPreset;
    expect(saved.name).toBe('My Preset');
    expect(saved.isCustom).toBe(true);
    expect(saved.platform).toBe('iOS');
    expect(typeof saved.id).toBe('string');
    expect(typeof saved.createdAt).toBe('number');
    expect(Array.isArray(saved.settings)).toBe(true);
    expect(saved.settings.length).toBeGreaterThanOrEqual(1);
  });

  it('adds an export-setting row when "Add Export Setting" is clicked', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} />);

    const before = screen.getAllByLabelText('Remove setting').length;
    fireEvent.click(screen.getByText('+ Add Export Setting'));
    const after = screen.getAllByLabelText('Remove setting').length;

    expect(after).toBe(before + 1);
  });

  it('removes an export-setting row when its remove button is clicked', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} />);

    // Add a second row so there are two, then remove one.
    fireEvent.click(screen.getByText('+ Add Export Setting'));
    const before = screen.getAllByLabelText('Remove setting').length;
    fireEvent.click(screen.getAllByLabelText('Remove setting')[0]);
    const after = screen.getAllByLabelText('Remove setting').length;

    expect(after).toBe(before - 1);
  });

  it('prefills fields from an existing preset', () => {
    const existing: CustomPreset = {
      id: 'custom-9',
      name: 'Existing Preset',
      platform: 'Android',
      icon: '🤖',
      isCustom: true,
      createdAt: 42,
      settings: [{ format: 'PNG', suffix: '@2x', constraint: { type: 'SCALE', value: 2 } }],
    };
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} existingPreset={existing} />);

    expect(screen.getByDisplayValue('Existing Preset')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Save Preset'));
    const saved = onSave.mock.calls[0][0] as CustomPreset;
    expect(saved.id).toBe('custom-9');
    expect(saved.createdAt).toBe(42);
    expect(saved.platform).toBe('Android');
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<PresetCreator onSave={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
