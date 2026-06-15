import React, { useState, useEffect, useRef } from 'react';
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
import { validateCustomName, CUSTOM_NAME_ERROR } from '../shared/customName';
import './App.css';

interface ToastState {
  message: string;
  type: 'error' | 'success' | 'info';
  error?: Error;
  metadata?: { iosContentsJson?: string };
}

/**
 * The single plugin operation currently in flight. The busy lock guarantees one
 * op at a time, which is what lets the generic `success` ack map unambiguously to
 * the active op. `apply`/`delete` carry the `presetId` so `aria-busy` can target
 * the specific card; `save` carries the preset so `success` can commit the
 * optimistic update (the message handler reads this off a ref — see below).
 */
type PendingOp =
  | { kind: 'apply'; presetId: string }
  | { kind: 'delete'; presetId: string }
  | { kind: 'save'; preset: CustomPreset }
  | { kind: 'clear' }
  | null;

const App: React.FC = () => {
  const [customName, setCustomName] = useState('');
  const [customNameError, setCustomNameError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectionCount, setSelectionCount] = useState(0);
  const [preferences, setPreferences] = useState<SavedPreferences | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CustomPreset | undefined>();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingOp, setPendingOpState] = useState<PendingOp>(null);
  // Text for the single visually-hidden live region (selection count + delete-arm).
  const [announce, setAnnounce] = useState('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirror of `pendingOp` for the message handler, which is installed once (empty
  // deps) and would otherwise only ever see the initial `null`.
  const pendingOpRef = useRef<PendingOp>(null);
  const setPendingOp = (op: PendingOp) => {
    pendingOpRef.current = op;
    setPendingOpState(op);
  };

  // All presets (default + custom)
  const customPresets = preferences?.customPresets || [];
  const hasCustomPresets = customPresets.length > 0;

  const hasSelection = selectionCount > 0;
  const lastUsedPreset = preferences?.lastUsedPreset;

  const showToast = (state: ToastState, autoDismissMs?: number) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(state);
    if (autoDismissMs !== undefined) {
      toastTimerRef.current = setTimeout(() => setToast(null), autoDismissMs);
    }
  };

  // Listen for messages from plugin
  useEffect(() => {
    window.onmessage = (event) => {
      if (!event.data || !event.data.pluginMessage) return;

      const msg = event.data.pluginMessage as PluginMessage;

      switch (msg.type) {
        case 'selection-changed': {
          setSelectionCount(msg.count);
          // A selection change invalidates any armed delete confirmation.
          setPendingDeleteId(null);
          // Debounce the SR announcement so rapid canvas selection doesn't chatter.
          if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
          const count = msg.count;
          announceTimerRef.current = setTimeout(() => {
            setAnnounce(
              count > 0 ? `${count} layer${count === 1 ? '' : 's'} selected` : 'No layers selected'
            );
          }, 300);
          break;
        }

        case 'invalid-custom-name':
          setCustomNameError(msg.message);
          // Pre-flight rejection of an apply op — clear the busy state.
          setPendingOp(null);
          break;

        case 'preferences-loaded':
          setPreferences(msg.preferences);
          setAdvancedMode(msg.preferences.advancedModeEnabled);
          break;

        case 'success': {
          console.log('✅', msg.message);
          showToast({ message: msg.message, type: 'success' }, 3000);
          // The generic `success` ack maps to whichever op is in flight.
          const op = pendingOpRef.current;
          if (op?.kind === 'save') {
            // Persist confirmed: close the creator and commit the optimistic update.
            setIsCreatorOpen(false);
            setEditingPreset(undefined);
            const saved = op.preset;
            setPreferences((prev) => {
              if (!prev) return prev;
              const idx = prev.customPresets.findIndex((p) => p.id === saved.id);
              const updated = [...prev.customPresets];
              if (idx >= 0) updated[idx] = saved;
              else updated.push(saved);
              return { ...prev, customPresets: updated };
            });
          }
          setPendingOp(null);
          break;
        }

        case 'apply-complete':
          setPendingOp(null);
          break;

        case 'clear-complete':
          setPendingOp(null);
          break;

        case 'export-success':
          // Only auto-dismiss when there is no Contents.json to copy; otherwise the
          // user must close it manually (it carries the only copy action).
          showToast(
            { message: msg.message, type: 'success', metadata: msg.metadata },
            msg.metadata?.iosContentsJson ? undefined : 5000
          );
          break;

        case 'error': {
          console.error('❌', msg.message);
          const error = new Error(msg.message);
          if (msg.stack) {
            error.stack = msg.stack;
          }
          showToast({ message: msg.message, type: 'error', error });
          // Clear busy state. For a failed `save` the creator stays open (we never
          // close it here); the reload below restores authoritative data behind it.
          setPendingOp(null);
          // Reload authoritative persisted state to snap back any unpersisted optimistic change.
          parent.postMessage({ pluginMessage: { type: 'get-preferences' } }, '*');
          break;
        }

        default: {
          console.warn('Unknown plugin message type:', (msg as { type: string }).type);
          // Exhaustiveness guard: TypeScript will flag this if a new PluginMessage variant
          // is added to the discriminated union without a matching case here.
          const _exhaustive: never = msg;
          void _exhaustive;
          break;
        }
      }
    };
  }, []);

  // While a delete is armed, auto-disarm after 3s and disarm on Escape. The effect
  // owns both — re-armed when `pendingDeleteId` becomes non-null, torn down on
  // disarm/confirm/unmount (which clears the timer and removes the listener).
  useEffect(() => {
    if (pendingDeleteId === null) return;
    const timer = setTimeout(() => setPendingDeleteId(null), 3000);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingDeleteId(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [pendingDeleteId]);

  // Clear the debounced-announce timer on unmount.
  useEffect(
    () => () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    },
    []
  );

  const applyPreset = (preset: PresetConfig) => {
    const result = validateCustomName(customName);
    if (!result.valid) {
      setCustomNameError(result.error ?? CUSTOM_NAME_ERROR);
      return;
    }
    setCustomNameError(null);

    const message: UIMessage = {
      type: 'apply-preset',
      preset,
      customName: result.value,
      advancedMode,
    };
    parent.postMessage({ pluginMessage: message }, '*');
    const usageMessage: UIMessage = {
      type: 'record-preset-usage',
      presetId: preset.id,
    };
    parent.postMessage({ pluginMessage: usageMessage }, '*');
    setPreferences((prev) => prev && { ...prev, lastUsedPreset: preset.id });
    setPendingOp({ kind: 'apply', presetId: preset.id });
  };

  const handleAdvancedModeChange = (enabled: boolean) => {
    setAdvancedMode(enabled);
    const message: UIMessage = {
      type: 'save-preferences',
      advancedModeEnabled: enabled,
    };
    parent.postMessage({ pluginMessage: message }, '*');
  };

  const clearExport = () => {
    const message: UIMessage = {
      type: 'clear-export',
    };
    parent.postMessage({ pluginMessage: message }, '*');
    setPendingOp({ kind: 'clear' });
  };

  const savePreset = (preset: CustomPreset) => {
    const message: UIMessage = {
      type: 'save-preset',
      preset,
    };
    parent.postMessage({ pluginMessage: message }, '*');
    // Keep the creator open and busy until the plugin acks. The creator closes and
    // the optimistic preset commit happens on `success`; on `error` it stays open
    // and authoritative data is reloaded (see the message handler).
    setPendingOp({ kind: 'save', preset });
  };

  const deletePreset = (presetId: string) => {
    if (pendingDeleteId !== presetId) {
      setPendingDeleteId(presetId);
      const preset = customPresets.find((p) => p.id === presetId);
      setAnnounce(`Press delete again to confirm removing ${preset?.name ?? 'this preset'}.`);
      return;
    }
    setPendingDeleteId(null);

    const message: UIMessage = {
      type: 'delete-preset',
      presetId,
    };
    parent.postMessage({ pluginMessage: message }, '*');
    setPendingOp({ kind: 'delete', presetId });

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

      {/* Single live region owning all SR announcements (selection count, delete-arm). */}
      <div role="status" aria-live="polite" className="visually-hidden">
        {announce}
      </div>

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
                    disabled={!hasSelection || pendingOp !== null}
                    busy={pendingOp?.kind === 'apply' && pendingOp.presetId === preset.id}
                    isLastUsed={preset.id === lastUsedPreset}
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
                        disabled={!hasSelection || pendingOp !== null}
                        busy={pendingOp?.kind === 'apply' && pendingOp.presetId === preset.id}
                        isLastUsed={preset.id === lastUsedPreset}
                      />
                      <div className="app__custom-preset-actions">
                        <button
                          className="app__preset-action"
                          onClick={() => openCreator(preset)}
                          title="Edit preset"
                          disabled={pendingOp !== null}
                        >
                          ✏️
                        </button>
                        <button
                          className="app__preset-action app__preset-action--danger"
                          onClick={() => deletePreset(preset.id)}
                          title={pendingDeleteId === preset.id ? 'Click again to confirm deletion' : 'Delete preset'}
                          aria-pressed={pendingDeleteId === preset.id}
                          aria-busy={(pendingOp?.kind === 'delete' && pendingOp.presetId === preset.id) || undefined}
                          disabled={pendingOp !== null}
                        >
                          {pendingDeleteId === preset.id ? '✓?' : '🗑️'}
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
                onChange={(value) => {
                  setCustomName(value);
                  if (customNameError) setCustomNameError(null);
                }}
                placeholder="e.g., icon-home"
                disabled={!hasSelection}
              />
              {customNameError ? (
                <p className="app__hint app__hint--error" role="alert">
                  {customNameError}
                </p>
              ) : (
                <p className="app__hint">
                  Leave empty to use default asset name
                </p>
              )}
            </section>

            {/* Advanced Mode Toggle */}
            <section className="app__section">
              <Toggle
                checked={advancedMode}
                onChange={handleAdvancedModeChange}
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
                disabled={!hasSelection || pendingOp !== null}
                busy={pendingOp?.kind === 'clear'}
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
          // Don't let the X / backdrop close the creator mid-save; the `success`
          // handler closes it and `error` must keep it open for retry.
          if (pendingOp?.kind === 'save') return;
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
          saving={pendingOp?.kind === 'save'}
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
