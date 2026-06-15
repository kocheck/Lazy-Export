/**
 * Tests for PresetCreator component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PresetCreator } from './PresetCreator.js';
import type { CustomPreset } from '../../shared/types.js';

const androidPreset: CustomPreset = {
  id: 'custom-a',
  name: 'Android Preset',
  platform: 'Android',
  icon: '🤖',
  isCustom: true,
  createdAt: 1,
  settings: [{ format: 'PNG', suffix: '', constraint: { type: 'SCALE', value: 1 } }],
  directoryStructure: true,
};

describe('PresetCreator', () => {
  it('blocks save and shows an inline error when the name is empty', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText('Save Preset'));

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a preset name');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('clears the inline error when the name is typed after a failed save', () => {
    render(<PresetCreator onSave={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText('Save Preset'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/My Custom Preset/i), {
      target: { value: 'a' },
    });
    expect(screen.queryByRole('alert')).toBeNull();
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

describe('PresetCreator metadata toggles', () => {
  it('defaults both toggles to off for a new preset and saves false', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} />);

    const metadata = screen.getByLabelText('Generate Metadata') as HTMLInputElement;
    const directory = screen.getByLabelText('Use Directory Structure') as HTMLInputElement;
    expect(metadata.checked).toBe(false);
    expect(directory.checked).toBe(false);

    fireEvent.change(screen.getByPlaceholderText(/My Custom Preset/i), {
      target: { value: 'New Preset' },
    });
    fireEvent.click(screen.getByText('Save Preset'));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0] as CustomPreset;
    expect(saved.generateMetadata).toBe(false);
    expect(saved.directoryStructure).toBe(false);
  });

  it('reflects existingPreset flags when editing', () => {
    const baseExisting: CustomPreset = {
      id: 'custom-1',
      name: 'My Preset',
      platform: 'iOS',
      icon: '⚙️',
      settings: [{ format: 'PNG', suffix: '@1x', constraint: { type: 'SCALE', value: 1 } }],
      isCustom: true,
      createdAt: 123,
      generateMetadata: true,
      directoryStructure: true,
    };
    render(<PresetCreator onSave={vi.fn()} onCancel={vi.fn()} existingPreset={baseExisting} />);

    const metadata = screen.getByLabelText('Generate Metadata') as HTMLInputElement;
    const directory = screen.getByLabelText('Use Directory Structure') as HTMLInputElement;
    expect(metadata.checked).toBe(true);
    expect(directory.checked).toBe(true);
  });

  it('saves the toggled-on values', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/My Custom Preset/i), {
      target: { value: 'Toggled Preset' },
    });
    // For iOS, enabling Generate Metadata auto-enables Use Directory Structure.
    fireEvent.click(screen.getByLabelText('Generate Metadata'));
    fireEvent.click(screen.getByText('Save Preset'));

    const saved = onSave.mock.calls[0][0] as CustomPreset;
    expect(saved.generateMetadata).toBe(true);
    expect(saved.directoryStructure).toBe(true);
  });

  it('enabling Use Directory Structure independently still works', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/My Custom Preset/i), {
      target: { value: 'Dir Only Preset' },
    });
    fireEvent.click(screen.getByLabelText('Use Directory Structure'));
    fireEvent.click(screen.getByText('Save Preset'));

    const saved = onSave.mock.calls[0][0] as CustomPreset;
    expect(saved.directoryStructure).toBe(true);
    expect(saved.generateMetadata).toBe(false);
  });

  it('hides Generate Metadata for non-iOS platforms but keeps Use Directory Structure (#1)', () => {
    render(<PresetCreator onSave={vi.fn()} onCancel={vi.fn()} existingPreset={androidPreset} />);
    expect(screen.queryByLabelText('Generate Metadata')).toBeNull();
    expect(screen.getByLabelText('Use Directory Structure')).toBeInTheDocument();
  });

  it('clears generateMetadata but preserves directoryStructure when leaving iOS (F7)', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/My Custom Preset/i), { target: { value: 'P' } });
    // Enable Generate Metadata on iOS — auto-enables Use Directory Structure.
    fireEvent.click(screen.getByLabelText('Generate Metadata'));
    // Switch platform away from iOS (combobox[0] is the platform select).
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Android' } });
    fireEvent.click(screen.getByText('Save Preset'));

    const saved = onSave.mock.calls[0][0] as CustomPreset;
    expect(saved.generateMetadata).toBe(false);
    expect(saved.directoryStructure).toBe(true);
  });
});

describe('PresetCreator format conversion (union + I3)', () => {
  // combobox[1] is the first setting's format select (combobox[0] = platform).
  const formatSelect = () => screen.getAllByRole('combobox')[1];

  it('reshapes a setting to SVG and drops the constraint', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/My Custom Preset/i), { target: { value: 'P' } });
    fireEvent.change(formatSelect(), { target: { value: 'SVG' } });
    fireEvent.click(screen.getByText('Save Preset'));

    const saved = onSave.mock.calls[0][0] as CustomPreset;
    expect(saved.settings[0].format).toBe('SVG');
    expect(saved.settings[0]).not.toHaveProperty('constraint');
  });

  it('reshapes a setting to PDF and drops the constraint', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/My Custom Preset/i), { target: { value: 'P' } });
    fireEvent.change(formatSelect(), { target: { value: 'PDF' } });
    fireEvent.click(screen.getByText('Save Preset'));

    const saved = onSave.mock.calls[0][0] as CustomPreset;
    expect(saved.settings[0].format).toBe('PDF');
    expect(saved.settings[0]).not.toHaveProperty('constraint');
  });

  it('preserves a WIDTH constraint type when editing the value (I3)', () => {
    const existing: CustomPreset = {
      id: 'custom-w',
      name: 'Width Preset',
      platform: 'Web',
      icon: '🌐',
      isCustom: true,
      createdAt: 1,
      settings: [{ format: 'PNG', suffix: '', constraint: { type: 'WIDTH', value: 100 } }],
    };
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} existingPreset={existing} />);
    fireEvent.change(screen.getByPlaceholderText('Scale'), { target: { value: '200' } });
    fireEvent.click(screen.getByText('Save Preset'));

    const saved = onSave.mock.calls[0][0] as CustomPreset;
    expect(saved.settings[0]).toHaveProperty('constraint', { type: 'WIDTH', value: 200 });
  });
});

describe('PresetCreator saving state (F16)', () => {
  it('disables every control and marks Save busy while saving', () => {
    render(<PresetCreator onSave={vi.fn()} onCancel={vi.fn()} existingPreset={androidPreset} saving />);
    const saveBtn = screen.getByText('Save Preset').closest('button')!;
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Cancel').closest('button')!).toBeDisabled();
    expect(screen.getByDisplayValue('Android Preset')).toBeDisabled();
    expect(screen.getByLabelText('Use Directory Structure')).toBeDisabled();
  });

  it('does not call onSave when Save is clicked while saving', () => {
    const onSave = vi.fn();
    render(<PresetCreator onSave={onSave} onCancel={vi.fn()} existingPreset={androidPreset} saving />);
    fireEvent.click(screen.getByText('Save Preset'));
    expect(onSave).not.toHaveBeenCalled();
  });
});
