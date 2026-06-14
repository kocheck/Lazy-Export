/**
 * Tests for the plugin message dispatcher (handleUIMessage) and error path.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { installFigmaMock, createMockNode, FigmaMock } from '../test/figma-mock.js';
import { handleUIMessage, handlePluginError } from './core.js';
import type { CustomPreset, PresetConfig, SavedPreferences } from '../shared/types.js';

const makeCustomPreset = (overrides: Partial<CustomPreset> = {}): CustomPreset => ({
  id: 'custom-1',
  name: 'My Preset',
  platform: 'iOS',
  isCustom: true,
  createdAt: 1,
  settings: [{ format: 'PNG', suffix: '@2x', constraint: { type: 'SCALE', value: 2 } }],
  ...overrides,
});

describe('handleUIMessage', () => {
  let figmaMock: FigmaMock;

  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  it('apply-preset applies settings to the current selection', async () => {
    const node = createMockNode();
    figmaMock.currentPage.selection = [node];

    const preset: PresetConfig = {
      id: 'web',
      name: 'Web',
      platform: 'Web',
      settings: [{ format: 'PNG', suffix: '@2x' }],
    };

    await handleUIMessage({ type: 'apply-preset', preset, advancedMode: false });

    expect(node.exportSettings).toHaveLength(1);
    expect(node.exportSettings[0].format).toBe('PNG');
  });

  it('save-preset persists a new preset and replies with success', async () => {
    const preset = makeCustomPreset();
    await handleUIMessage({ type: 'save-preset', preset });

    const stored = (await figmaMock.clientStorage.getAsync('preferences')) as SavedPreferences;
    expect(stored.customPresets).toHaveLength(1);
    expect(stored.customPresets[0].id).toBe('custom-1');
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'success',
      message: 'Preset saved successfully',
    });
  });

  it('save-preset replaces an existing preset with the same id', async () => {
    await handleUIMessage({ type: 'save-preset', preset: makeCustomPreset({ name: 'First' }) });
    await handleUIMessage({ type: 'save-preset', preset: makeCustomPreset({ name: 'Second' }) });

    const stored = (await figmaMock.clientStorage.getAsync('preferences')) as SavedPreferences;
    expect(stored.customPresets).toHaveLength(1);
    expect(stored.customPresets[0].name).toBe('Second');
  });

  it('delete-preset removes the matching preset and replies with success', async () => {
    await handleUIMessage({ type: 'save-preset', preset: makeCustomPreset() });
    await handleUIMessage({ type: 'delete-preset', presetId: 'custom-1' });

    const stored = (await figmaMock.clientStorage.getAsync('preferences')) as SavedPreferences;
    expect(stored.customPresets).toHaveLength(0);
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'success',
      message: 'Preset deleted',
    });
  });

  it('get-preferences replies with preferences-loaded', async () => {
    await handleUIMessage({ type: 'get-preferences' });
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'preferences-loaded',
      preferences: { customPresets: [], advancedModeEnabled: false },
    });
  });

  it('clear-export clears the selection', async () => {
    const node = createMockNode();
    node.exportSettings = [{ format: 'PNG', suffix: '@2x' }];
    figmaMock.currentPage.selection = [node];

    await handleUIMessage({ type: 'clear-export' });
    expect(node.exportSettings).toHaveLength(0);
  });

  it('posts an error message when a handler throws', async () => {
    figmaMock.clientStorage.getAsync.mockRejectedValueOnce(new Error('storage boom'));

    await handleUIMessage({ type: 'get-preferences' });

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'error',
      message: 'storage boom',
    });
  });
});

describe('handlePluginError', () => {
  let figmaMock: FigmaMock;

  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  it('posts an error message with the message and stack', () => {
    const err = new Error('kaboom');
    handlePluginError(err);

    const calls = figmaMock.ui.postMessage.mock.calls;
    expect(calls).toHaveLength(1);
    const msg = calls[0][0] as { type: string; message: string; stack?: string };
    expect(msg.type).toBe('error');
    expect(msg.message).toBe('kaboom');
    expect(msg.stack).toBe(err.stack);
  });

  it('does not throw if postMessage itself fails', () => {
    figmaMock.ui.postMessage.mockImplementationOnce(() => {
      throw new Error('postMessage down');
    });
    expect(() => handlePluginError(new Error('kaboom'))).not.toThrow();
  });
});

describe('apply-preset — iOS metadata validation', () => {
  let figmaMock: FigmaMock;

  beforeEach(() => {
    figmaMock = installFigmaMock();
    figmaMock.currentPage.selection = [createMockNode()];
  });

  it('rejects a JPG iOS preset with generateMetadata before touching nodes', async () => {
    const preset: PresetConfig = {
      id: 'ios-bad',
      name: 'Bad iOS',
      platform: 'iOS',
      generateMetadata: true,
      settings: [{ format: 'JPG', suffix: '@2x', constraint: { type: 'SCALE', value: 2 } }],
    };
    await handleUIMessage({ type: 'apply-preset', preset, advancedMode: true });

    const node = figmaMock.currentPage.selection[0] as SceneNode & { exportSettings: unknown[] };
    expect((node as { exportSettings: unknown[] }).exportSettings).toHaveLength(0);

    const posted = figmaMock.ui.postMessage.mock.calls.map((c) => c[0]) as Array<{ type: string }>;
    expect(posted.some((m) => m.type === 'error')).toBe(true);
  });

  it('accepts a valid 2× PNG iOS preset with generateMetadata', async () => {
    const preset: PresetConfig = {
      id: 'ios-ok',
      name: 'Good iOS',
      platform: 'iOS',
      generateMetadata: true,
      directoryStructure: true,
      settings: [{ format: 'PNG', suffix: '@2x', constraint: { type: 'SCALE', value: 2 } }],
    };
    await handleUIMessage({ type: 'apply-preset', preset, advancedMode: true });

    const posted = figmaMock.ui.postMessage.mock.calls.map((c) => c[0]) as Array<{ type: string }>;
    expect(posted.some((m) => m.type === 'error')).toBe(false);
    expect(posted.some((m) => m.type === 'export-success')).toBe(true);
  });

  it('skips metadata validation for non-iOS presets even if generateMetadata is true', async () => {
    const preset: PresetConfig = {
      id: 'android-meta',
      name: 'Android',
      platform: 'Android',
      generateMetadata: true,
      settings: [{ format: 'PNG', suffix: 'drawable-mdpi', constraint: { type: 'SCALE', value: 1 } }],
    };
    await handleUIMessage({ type: 'apply-preset', preset, advancedMode: true });

    const posted = figmaMock.ui.postMessage.mock.calls.map((c) => c[0]) as Array<{ type: string }>;
    expect(posted.some((m) => m.type === 'error')).toBe(false);
  });
});

describe('preference mutation queue', () => {
  let figmaMock: FigmaMock;

  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  it('serialises concurrent save-preset messages — no preset is lost', async () => {
    // Make getAsync return a cloned snapshot so concurrent reads see stale data,
    // simulating the race that the queue prevents.
    let writeCount = 0;
    figmaMock.clientStorage.setAsync.mockImplementation(async (_key: string, value: unknown) => {
      await new Promise((r) => setTimeout(r, 5));
      figmaMock.clientStorage.getAsync.mockResolvedValueOnce(
        JSON.parse(JSON.stringify(value))
      );
      writeCount++;
    });

    const presetA = makeCustomPreset({ id: 'a', name: 'A' });
    const presetB = makeCustomPreset({ id: 'b', name: 'B' });

    await Promise.all([
      handleUIMessage({ type: 'save-preset', preset: presetA }),
      handleUIMessage({ type: 'save-preset', preset: presetB }),
    ]);

    const stored = (await figmaMock.clientStorage.getAsync('preferences')) as SavedPreferences;
    const ids = stored.customPresets.map((p) => p.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('queue recovers after a storage failure — subsequent mutations succeed', async () => {
    figmaMock.clientStorage.setAsync.mockRejectedValueOnce(new Error('disk full'));

    const presetA = makeCustomPreset({ id: 'a' });
    const presetB = makeCustomPreset({ id: 'b' });

    // First mutation fails; second must still complete.
    await handleUIMessage({ type: 'save-preset', preset: presetA });
    await handleUIMessage({ type: 'save-preset', preset: presetB });

    const stored = (await figmaMock.clientStorage.getAsync('preferences')) as SavedPreferences;
    expect(stored.customPresets.some((p) => p.id === 'b')).toBe(true);
  });
});
