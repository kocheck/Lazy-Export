import React, { useState } from 'react';
import { CustomPreset, ExportSetting, Platform } from '../../shared/types';
import { Input } from './Input';
import { Button } from './Button';
import './PresetCreator.css';

interface PresetCreatorProps {
  onSave: (preset: CustomPreset) => void;
  onCancel: () => void;
  existingPreset?: CustomPreset;
}

const PLATFORMS: Platform[] = ['iOS', 'Android', 'Web', 'WebP', 'PDF'];
const FORMATS = ['PNG', 'JPG', 'SVG', 'PDF', 'WEBP'] as const;

export const PresetCreator: React.FC<PresetCreatorProps> = ({
  onSave,
  onCancel,
  existingPreset,
}) => {
  const [name, setName] = useState(existingPreset?.name || '');
  const [platform, setPlatform] = useState<Platform>(existingPreset?.platform || 'iOS');
  const [icon, setIcon] = useState(existingPreset?.icon || '⚙️');
  const [settings, setSettings] = useState<ExportSetting[]>(
    existingPreset?.settings || [
      { format: 'PNG', suffix: '@1x', constraint: { type: 'SCALE', value: 1 } },
    ]
  );

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
    if (!name.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const preset: CustomPreset = {
      id: existingPreset?.id || `custom-${Date.now()}`,
      name: name.trim(),
      platform,
      icon,
      settings,
      isCustom: true,
      createdAt: existingPreset?.createdAt || Date.now(),
      generateMetadata: false,
      directoryStructure: false,
    };

    onSave(preset);
  };

  return (
    <div className="preset-creator">
      <div className="preset-creator__field">
        <label className="preset-creator__label">Preset Name</label>
        <Input value={name} onChange={setName} placeholder="e.g., My Custom Preset" />
      </div>

      <div className="preset-creator__field">
        <label className="preset-creator__label">Icon (emoji)</label>
        <Input value={icon} onChange={setIcon} placeholder="⚙️" />
      </div>

      <div className="preset-creator__field">
        <label className="preset-creator__label">Platform</label>
        <select
          className="preset-creator__select"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
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
                  updateSetting(index, { ...setting, format: e.target.value as any })
                }
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <Input
                value={setting.suffix || ''}
                onChange={(v) => updateSetting(index, { ...setting, suffix: v })}
                placeholder="Suffix"
              />

              {setting.format !== 'SVG' && setting.format !== 'PDF' && (
                <Input
                  value={String(setting.constraint?.value || 1)}
                  onChange={(v) =>
                    updateSetting(index, {
                      ...setting,
                      constraint: { type: 'SCALE', value: parseFloat(v) || 1 },
                    })
                  }
                  placeholder="Scale"
                />
              )}

              <button
                className="preset-creator__remove"
                onClick={() => removeSetting(index)}
                aria-label="Remove setting"
              >
                ✕
              </button>
            </div>
          ))}

          <button className="preset-creator__add" onClick={addSetting}>
            + Add Export Setting
          </button>
        </div>
      </div>

      <div className="preset-creator__actions">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="primary">
          Save Preset
        </Button>
      </div>
    </div>
  );
};
