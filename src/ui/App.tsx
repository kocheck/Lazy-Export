import React, { useState, useEffect } from 'react';
import { PresetCard } from './components/PresetCard';
import { Input } from './components/Input';
import { Toggle } from './components/Toggle';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { PresetCreator } from './components/PresetCreator';
import { Toast } from './components/Toast';
import { ZeroState } from './components/ZeroState';
import { DEFAULT_PRESETS } from '../shared/presets';
import { PresetConfig, PluginMessage, UIMessage, SavedPreferences, CustomPreset } from '../shared/types';
import './App.css';

interface ToastState {
  message: string;
  type: 'error' | 'success' | 'info';
  error?: Error;
  metadata?: { iosContentsJson?: string };
}

const App: React.FC = () => {
  const [customName, setCustomName] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectionCount, setSelectionCount] = useState(0);
  const [preferences, setPreferences] = useState<SavedPreferences | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CustomPreset | undefined>();
  const [toast, setToast] = useState<ToastState | null>(null);

  // All presets (default + custom)
  const customPresets = preferences?.customPresets || [];
  const hasCustomPresets = customPresets.length > 0;

  const hasSelection = selectionCount > 0;

  // Listen for messages from plugin
  useEffect(() => {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage as PluginMessage;

      switch (msg.type) {
        case 'selection-changed':
          setSelectionCount(msg.count);
          break;

        case 'preferences-loaded':
          setPreferences(msg.preferences);
          setAdvancedMode(msg.preferences.advancedModeEnabled);
          break;

        case 'success':
          console.log('✅', msg.message);
          setToast({ message: msg.message, type: 'success' });
          setTimeout(() => setToast(null), 3000);
          break;

        case 'export-success':
          setToast({
            message: msg.message,
            type: 'success',
            metadata: msg.metadata,
          });
          // Clear toast after 5 seconds
          setTimeout(() => setToast(null), 5000);
          break;

        case 'error':
          console.error('❌', msg.message);
          const error = new Error(msg.message);
          if (msg.stack) {
            error.stack = msg.stack;
          }
          setToast({ message: msg.message, type: 'error', error });
          break;
      }
    };
  }, []);

  const applyPreset = (preset: PresetConfig) => {
    const message: UIMessage = {
      type: 'apply-preset',
      preset,
      customName: customName.trim() || undefined,
      advancedMode,
    };
    parent.postMessage({ pluginMessage: message }, '*');
  };

  const clearExport = () => {
    const message: UIMessage = {
      type: 'clear-export',
    };
    parent.postMessage({ pluginMessage: message }, '*');
  };

  const savePreset = (preset: CustomPreset) => {
    const message: UIMessage = {
      type: 'save-preset',
      preset,
    };
    parent.postMessage({ pluginMessage: message }, '*');
    setIsCreatorOpen(false);
    setEditingPreset(undefined);

    // Optimistically update UI
    if (preferences) {
      const existingIndex = preferences.customPresets.findIndex((p) => p.id === preset.id);
      const updatedPresets = [...preferences.customPresets];
      if (existingIndex >= 0) {
        updatedPresets[existingIndex] = preset;
      } else {
        updatedPresets.push(preset);
      }
      setPreferences({ ...preferences, customPresets: updatedPresets });
    }
  };

  const deletePreset = (presetId: string) => {
    if (!confirm('Delete this preset?')) return;

    const message: UIMessage = {
      type: 'delete-preset',
      presetId,
    };
    parent.postMessage({ pluginMessage: message }, '*');

    // Optimistically update UI
    if (preferences) {
      setPreferences({
        ...preferences,
        customPresets: preferences.customPresets.filter((p) => p.id !== presetId),
      });
    }
  };

  const openCreator = (preset?: CustomPreset) => {
    setEditingPreset(preset);
    setIsCreatorOpen(true);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app__header">
        <h3 className="app__title">Lazy Export</h3>
        <div className="app__selection-count">
          {selectionCount > 0 ? `${selectionCount} selected` : 'No selection'}
        </div>
      </header>

      {/* Main Content */}
      <main className="app__main">
        {!hasSelection ? (
          <ZeroState />
        ) : (
          <>
            {/* Default Presets Grid */}
            <section className="app__section">
              <label className="app__section-label">Quick Presets</label>
              <div className="app__presets-grid">
                {DEFAULT_PRESETS.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onClick={() => applyPreset(preset)}
                    disabled={!hasSelection}
                  />
                ))}
              </div>
            </section>

            {/* Custom Presets Section */}
            {hasCustomPresets && (
              <section className="app__section">
                <div className="app__section-header">
                  <label className="app__section-label">Custom Presets</label>
                </div>
                <div className="app__custom-presets">
                  {customPresets.map((preset) => (
                    <div key={preset.id} className="app__custom-preset">
                      <PresetCard
                        preset={preset}
                        onClick={() => applyPreset(preset)}
                        disabled={!hasSelection}
                      />
                      <div className="app__custom-preset-actions">
                        <button
                          className="app__preset-action"
                          onClick={() => openCreator(preset)}
                          title="Edit preset"
                        >
                          ✏️
                        </button>
                        <button
                          className="app__preset-action app__preset-action--danger"
                          onClick={() => deletePreset(preset.id)}
                          title="Delete preset"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Create Preset Button */}
            <section className="app__section">
              <Button onClick={() => openCreator()} variant="secondary" fullWidth>
                + Create Custom Preset
              </Button>
            </section>

            {/* Custom Name Input */}
            <section className="app__section">
              <label className="app__section-label">Custom Name (optional)</label>
              <Input
                value={customName}
                onChange={setCustomName}
                placeholder="e.g., icon-home"
                disabled={!hasSelection}
              />
              <p className="app__hint">
                Leave empty to use default asset name
              </p>
            </section>

            {/* Advanced Mode Toggle */}
            <section className="app__section">
              <Toggle
                checked={advancedMode}
                onChange={setAdvancedMode}
                label="Advanced Mode"
                disabled={!hasSelection}
              />
              <p className="app__hint">
                Creates organized folder structure with metadata files
              </p>
            </section>

            {/* Clear Button */}
            <section className="app__section">
              <Button
                onClick={clearExport}
                variant="destructive"
                fullWidth
                disabled={!hasSelection}
              >
                Clear Export Settings
              </Button>
            </section>

            {/* Info Section */}
            <section className="app__info">
              <p>
                Select layers in Figma, then click a preset to apply export settings.
                Advanced mode generates production-ready folder structures.
              </p>
            </section>
          </>
        )}
      </main>

      {/* Preset Creator Modal */}
      <Modal
        isOpen={isCreatorOpen}
        onClose={() => {
          setIsCreatorOpen(false);
          setEditingPreset(undefined);
        }}
        title={editingPreset ? 'Edit Preset' : 'Create Custom Preset'}
      >
        <PresetCreator
          onSave={savePreset}
          onCancel={() => {
            setIsCreatorOpen(false);
            setEditingPreset(undefined);
          }}
          existingPreset={editingPreset}
        />
      </Modal>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          error={toast.error}
          metadata={toast.metadata}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default App;
