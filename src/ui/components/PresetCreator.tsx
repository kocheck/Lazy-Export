import React, { useState } from 'react';
import { CustomPreset, ExportFormat, ExportSetting, Platform, PLATFORMS, EXPORT_FORMATS } from '../../shared/types';
import { Input } from './Input';
import { Button } from './Button';
import { Toggle } from './Toggle';
import './PresetCreator.css';

interface PresetCreatorProps {
  onSave: (preset: CustomPreset) => void;
  onCancel: () => void;
  existingPreset?: CustomPreset;
  /** True while a save is in flight: disables every control and marks Save busy. */
  saving?: boolean;
}

/**
 * Reshape a setting into the variant for `format`, dropping fields the target
 * variant doesn't support (the `constraint` when becoming SVG/PDF, the `svg*`
 * flags when becoming an image). Preserves the image constraint — including a
 * WIDTH/HEIGHT type — across PNG↔JPG, and the SVG flags across an SVG→SVG no-op.
 */
function withFormat(setting: ExportSetting, format: ExportFormat): ExportSetting {
  if (format === 'SVG') {
    return setting.format === 'SVG' ? setting : { format: 'SVG', suffix: setting.suffix };
  }
  if (format === 'PDF') {
    return { format: 'PDF', suffix: setting.suffix };
  }
  // PNG | JPG → image variant: preserve an existing image constraint, else
  // default to 1× SCALE so the scale field stays meaningful.
  const existing =
    setting.format === 'PNG' || setting.format === 'JPG' ? setting.constraint : undefined;
  return { format, suffix: setting.suffix, constraint: existing ?? { type: 'SCALE', value: 1 } };
}

export const PresetCreator: React.FC<PresetCreatorProps> = ({
  onSave,
  onCancel,
  existingPreset,
  saving = false,
}) => {
  const [name, setName] = useState(existingPreset?.name || '');
  const [platform, setPlatform] = useState<Platform>(existingPreset?.platform || 'iOS');
  const [icon, setIcon] = useState(existingPreset?.icon || '⚙️');
  const [settings, setSettings] = useState<ExportSetting[]>(
    existingPreset?.settings || [
      { format: 'PNG', suffix: '@1x', constraint: { type: 'SCALE', value: 1 } },
    ]
  );

  const [generateMetadata, setGenerateMetadata] = useState(
    existingPreset?.generateMetadata ?? false
  );
  const [directoryStructure, setDirectoryStructure] = useState(
    existingPreset?.directoryStructure ?? false
  );
  const [nameError, setNameError] = useState<string | null>(null);

  const addSetting = () => {
    setSettings([
      ...settings,
      { format: 'PNG', suffix: '', constraint: { type: 'SCALE', value: 1 } },
    ]);
  };

  const removeSetting = (index: number) => {
    setSettings(settings.filter((_, i) => i !== index));
  };

  const updateSetting = (index: number, updated: ExportSetting) => {
    setSettings(settings.map((s, i) => (i === index ? updated : s)));
  };

  const handleSave = () => {
    if (saving) return;
    if (!name.trim()) {
      setNameError('Please enter a preset name');
      return;
    }
    setNameError(null);

    const preset: CustomPreset = {
      id: existingPreset?.id || `custom-${Date.now()}`,
      name: name.trim(),
      platform,
      icon,
      settings,
      isCustom: true,
      createdAt: existingPreset?.createdAt || Date.now(),
      generateMetadata,
      directoryStructure,
    };

    onSave(preset);
  };

  return (
    <div className="preset-creator">
      <div className="preset-creator__field">
        <label className="preset-creator__label">Preset Name</label>
        <Input
          value={name}
          onChange={(v) => { setName(v); setNameError(null); }}
          placeholder="e.g., My Custom Preset"
          disabled={saving}
        />
        {nameError && (
          <p className="app__hint app__hint--error" role="alert">{nameError}</p>
        )}
      </div>

      <div className="preset-creator__field">
        <label className="preset-creator__label">Icon (emoji)</label>
        <Input value={icon} onChange={setIcon} placeholder="⚙️" disabled={saving} />
      </div>

      <div className="preset-creator__field">
        <label className="preset-creator__label">Platform</label>
        <select
          className="preset-creator__select"
          value={platform}
          onChange={(e) => {
            const next = e.target.value as Platform;
            setPlatform(next);
            // "Generate Metadata" is iOS-only; reset it when leaving iOS. Preserve
            // `directoryStructure` — it is meaningful for Android (F7).
            if (next !== 'iOS') setGenerateMetadata(false);
          }}
          disabled={saving}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="preset-creator__field">
        <label className="preset-creator__label">Export Settings</label>
        <div className="preset-creator__settings">
          {settings.map((setting, index) => (
            <div key={index} className="preset-creator__setting">
              <select
                className="preset-creator__select preset-creator__select--small"
                value={setting.format}
                onChange={(e) =>
                  updateSetting(index, withFormat(setting, e.target.value as ExportFormat))
                }
                disabled={saving}
              >
                {EXPORT_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <Input
                value={setting.suffix || ''}
                onChange={(v) => updateSetting(index, { ...setting, suffix: v })}
                placeholder="Suffix"
                disabled={saving}
              />

              {setting.format !== 'SVG' && setting.format !== 'PDF' && (
                <Input
                  value={String(setting.constraint?.value || 1)}
                  onChange={(v) =>
                    updateSetting(index, {
                      ...setting,
                      constraint: {
                        type: setting.constraint?.type ?? 'SCALE',
                        value: parseFloat(v) || 1,
                      },
                    })
                  }
                  placeholder="Scale"
                  disabled={saving}
                />
              )}

              <button
                className="preset-creator__remove"
                onClick={() => removeSetting(index)}
                aria-label="Remove setting"
                disabled={saving}
              >
                ✕
              </button>
            </div>
          ))}

          <button className="preset-creator__add" onClick={addSetting} disabled={saving}>
            + Add Export Setting
          </button>
        </div>
      </div>

      <div className="preset-creator__field">
        {/* Generate Metadata (Contents.json) is iOS-only — mirrors the iOS-only pipeline in core.ts. */}
        {platform === 'iOS' && (
          <Toggle
            checked={generateMetadata}
            onChange={(enabled) => {
              setGenerateMetadata(enabled);
              // Contents.json filenames derive from the imageset path — only valid with directory structure.
              if (enabled) setDirectoryStructure(true);
            }}
            label="Generate Metadata"
            disabled={saving}
          />
        )}
        <Toggle
          checked={directoryStructure}
          onChange={setDirectoryStructure}
          label="Use Directory Structure"
          disabled={saving}
        />
      </div>

      <div className="preset-creator__actions">
        <Button onClick={onCancel} variant="secondary" disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="primary" busy={saving}>
          Save Preset
        </Button>
      </div>
    </div>
  );
};
