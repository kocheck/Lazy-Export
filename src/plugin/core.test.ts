/**
 * Tests for the plugin message dispatcher (handleUIMessage) and error path.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installFigmaMock, createMockNode, FigmaMock } from '../test/figma-mock.js';
import { handleUIMessage, handlePluginError, generateIOSContentsJSON, applyExportSettings, validateCustomPreset } from './core.js';
import type { CustomPreset, ExportSetting, PresetConfig, SavedPreferences } from '../shared/types.js';

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
    figmaMock.clientStorage.setAsync.mockImplementation(async (_key: string, value: unknown) => {
      await new Promise((r) => setTimeout(r, 5));
      figmaMock.clientStorage.getAsync.mockResolvedValueOnce(
        JSON.parse(JSON.stringify(value))
      );
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

describe('open-external-url handler', () => {
  let figmaMock: FigmaMock;
  const openExternalMock = vi.fn();

  beforeEach(() => {
    figmaMock = installFigmaMock();
    // openExternal is not in FigmaMock; add it directly to the global so core.ts can call it.
    (global as any).figma.openExternal = openExternalMock;
    openExternalMock.mockReset();
    figmaMock.ui.postMessage.mockReset();
  });

  it('allows an https:// URL and calls figma.openExternal exactly once', async () => {
    const url = 'https://github.com/example/repo/issues/1';
    await handleUIMessage({ type: 'open-external-url', url });
    expect(openExternalMock).toHaveBeenCalledOnce();
    expect(openExternalMock).toHaveBeenCalledWith(url);
    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled();
  });

  it('rejects a non-web URL without calling openExternal and posts an error', async () => {
    // javascript: scheme used only as test input — never executed
    await handleUIMessage({ type: 'open-external-url', url: 'javascript:void(0)' });
    expect(openExternalMock).not.toHaveBeenCalled();
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'error',
      message: 'Refused to open a non-web URL.',
    });
  });
});

describe('iOS filename derivation', () => {
  beforeEach(() => {
    installFigmaMock();
  });

  const builtInSettings: ExportSetting[] = [
    { format: 'PNG', suffix: '@3x', constraint: { type: 'SCALE', value: 3 } },
    { format: 'PNG', suffix: '@2x', constraint: { type: 'SCALE', value: 2 } },
    { format: 'PNG', suffix: '@1x', constraint: { type: 'SCALE', value: 1 } },
  ];

  it('regression: built-in iOS preset produces @1x/@2x/@3x in both the imageset path and Contents.json', () => {
    const node = createMockNode();
    applyExportSettings([node], builtInSettings, 'asset', true, 'iOS', false, true);
    const suffixes = node.exportSettings.map((s) => s.suffix);
    expect(suffixes).toEqual([
      '/asset.imageset/asset@3x',
      '/asset.imageset/asset@2x',
      '/asset.imageset/asset@1x',
    ]);

    const contents = JSON.parse(generateIOSContentsJSON('asset', builtInSettings));
    expect(contents.images.map((img: { filename: string }) => img.filename)).toEqual([
      'asset@3x.png',
      'asset@2x.png',
      'asset@1x.png',
    ]);
  });

  it('empty-suffix custom preset: imageset path and Contents.json both use @1x/@2x/@3x', () => {
    const settings: ExportSetting[] = [
      { format: 'PNG', suffix: '', constraint: { type: 'SCALE', value: 1 } },
      { format: 'PNG', suffix: '', constraint: { type: 'SCALE', value: 2 } },
      { format: 'PNG', suffix: '', constraint: { type: 'SCALE', value: 3 } },
    ];
    const node = createMockNode();
    applyExportSettings([node], settings, 'asset', true, 'iOS', false, true);
    const suffixes = node.exportSettings.map((s) => s.suffix);
    expect(suffixes).toEqual([
      '/asset.imageset/asset@1x',
      '/asset.imageset/asset@2x',
      '/asset.imageset/asset@3x',
    ]);

    const contents = JSON.parse(generateIOSContentsJSON('asset', settings));
    expect(contents.images.map((img: { filename: string }) => img.filename)).toEqual([
      'asset@1x.png',
      'asset@2x.png',
      'asset@3x.png',
    ]);
  });

  it('mismatched-suffix case: scale 2 with suffix "foo" still produces asset@2x in both places', () => {
    const settings: ExportSetting[] = [
      { format: 'PNG', suffix: 'foo', constraint: { type: 'SCALE', value: 2 } },
    ];
    const node = createMockNode();
    applyExportSettings([node], settings, 'asset', true, 'iOS', false, true);
    expect(node.exportSettings[0].suffix).toBe('/asset.imageset/asset@2x');

    const contents = JSON.parse(generateIOSContentsJSON('asset', settings));
    expect(contents.images[0].filename).toBe('asset@2x.png');
  });
});

describe('validateCustomPreset', () => {
  const validPreset = {
    id: 'custom-abc',
    name: 'My Preset',
    platform: 'iOS',
    isCustom: true as const,
    createdAt: 1,
    settings: [{ format: 'PNG' as const, suffix: '@2x' }],
  };

  it('accepts a valid CustomPreset', () => {
    expect(validateCustomPreset(validPreset)).toEqual({ valid: true, value: validPreset });
  });

  it('rejects null / non-object', () => {
    expect(validateCustomPreset(null).valid).toBe(false);
    expect(validateCustomPreset('string').valid).toBe(false);
    expect(validateCustomPreset(42).valid).toBe(false);
  });

  it('rejects missing or empty id', () => {
    expect(validateCustomPreset({ ...validPreset, id: '' }).valid).toBe(false);
    expect(validateCustomPreset({ ...validPreset, id: 123 }).valid).toBe(false);
  });

  it('rejects missing or empty name', () => {
    expect(validateCustomPreset({ ...validPreset, name: '' }).valid).toBe(false);
    expect(validateCustomPreset({ ...validPreset, name: undefined }).valid).toBe(false);
  });

  it('rejects unknown platform', () => {
    expect(validateCustomPreset({ ...validPreset, platform: 'Windows' }).valid).toBe(false);
    expect(validateCustomPreset({ ...validPreset, platform: '' }).valid).toBe(false);
  });

  it('rejects non-array settings', () => {
    expect(validateCustomPreset({ ...validPreset, settings: 'not-array' }).valid).toBe(false);
    expect(validateCustomPreset({ ...validPreset, settings: null }).valid).toBe(false);
  });

  it('rejects oversized settings (> 50)', () => {
    const big = Array.from({ length: 51 }, () => ({ format: 'PNG' as const, suffix: '' }));
    expect(validateCustomPreset({ ...validPreset, settings: big }).valid).toBe(false);
  });

  it('rejects when isCustom is not true', () => {
    expect(validateCustomPreset({ ...validPreset, isCustom: false }).valid).toBe(false);
    expect(validateCustomPreset({ ...validPreset, isCustom: undefined }).valid).toBe(false);
  });

  it('accepts all valid platforms', () => {
    for (const platform of ['iOS', 'Android', 'Web', 'PDF']) {
      expect(validateCustomPreset({ ...validPreset, platform }).valid).toBe(true);
    }
  });

  // iOS cross-field rule (#6)
  it('rejects iOS + generateMetadata without directoryStructure', () => {
    expect(
      validateCustomPreset({ ...validPreset, generateMetadata: true, directoryStructure: false }).valid
    ).toBe(false);
  });
  it('accepts iOS + generateMetadata WITH directoryStructure', () => {
    expect(
      validateCustomPreset({ ...validPreset, generateMetadata: true, directoryStructure: true }).valid
    ).toBe(true);
  });
  it('accepts Android + generateMetadata without directoryStructure (cross-field is iOS-only)', () => {
    expect(
      validateCustomPreset({
        ...validPreset,
        platform: 'Android',
        generateMetadata: true,
        directoryStructure: false,
      }).valid
    ).toBe(true);
  });

  // Per-format completeness (F6) — illegal field/format combinations
  it('rejects a constraint on SVG or PDF', () => {
    expect(
      validateCustomPreset({
        ...validPreset,
        settings: [{ format: 'SVG', constraint: { type: 'SCALE', value: 1 } }],
      }).valid
    ).toBe(false);
    expect(
      validateCustomPreset({
        ...validPreset,
        settings: [{ format: 'PDF', constraint: { type: 'SCALE', value: 1 } }],
      }).valid
    ).toBe(false);
  });
  it('rejects an svg* flag on a non-SVG setting', () => {
    expect(
      validateCustomPreset({ ...validPreset, settings: [{ format: 'PNG', svgOutlineText: true }] }).valid
    ).toBe(false);
    expect(
      validateCustomPreset({ ...validPreset, settings: [{ format: 'PDF', svgIdAttribute: true }] }).valid
    ).toBe(false);
  });
  it('rejects a non-string suffix', () => {
    expect(
      validateCustomPreset({ ...validPreset, settings: [{ format: 'PNG', suffix: 123 }] }).valid
    ).toBe(false);
  });
  it('rejects a non-boolean svg flag value', () => {
    expect(
      validateCustomPreset({ ...validPreset, settings: [{ format: 'SVG', svgOutlineText: 'yes' }] }).valid
    ).toBe(false);
  });
  it('rejects a non-finite or non-positive constraint value (I4)', () => {
    for (const value of [NaN, Infinity, 0, -1]) {
      expect(
        validateCustomPreset({
          ...validPreset,
          settings: [{ format: 'PNG', constraint: { type: 'SCALE', value } }],
        }).valid
      ).toBe(false);
    }
  });
  it('accepts a constraint-less PNG (constraint optional on image, F12)', () => {
    expect(
      validateCustomPreset({ ...validPreset, settings: [{ format: 'PNG', suffix: '@1x' }] }).valid
    ).toBe(true);
  });

  // F2 fields
  it('rejects missing or non-finite createdAt', () => {
    expect(validateCustomPreset({ ...validPreset, createdAt: undefined }).valid).toBe(false);
    expect(validateCustomPreset({ ...validPreset, createdAt: NaN }).valid).toBe(false);
    expect(validateCustomPreset({ ...validPreset, createdAt: 'soon' }).valid).toBe(false);
  });
  it('rejects a non-string icon', () => {
    expect(validateCustomPreset({ ...validPreset, icon: 42 }).valid).toBe(false);
  });
  it('rejects non-boolean metadata flags', () => {
    expect(validateCustomPreset({ ...validPreset, generateMetadata: 'true' }).valid).toBe(false);
    expect(validateCustomPreset({ ...validPreset, directoryStructure: 1 }).valid).toBe(false);
  });
  it('returns the validated value on success', () => {
    const result = validateCustomPreset(validPreset);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.value).toEqual(validPreset);
  });
});

describe('record-preset-usage and save-preferences handlers', () => {
  let figmaMock: FigmaMock;

  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  it('record-preset-usage persists lastUsedPreset without clobbering customPresets', async () => {
    await handleUIMessage({ type: 'save-preset', preset: makeCustomPreset({ id: 'custom-1' }) });
    figmaMock.ui.postMessage.mockClear();

    await handleUIMessage({ type: 'record-preset-usage', presetId: 'web' });
    await handleUIMessage({ type: 'get-preferences' });

    const prefsMsg = (figmaMock.ui.postMessage.mock.calls.map((c) => c[0]) as Array<{ type: string; preferences?: SavedPreferences }>)
      .find((m) => m.type === 'preferences-loaded');
    expect(prefsMsg?.preferences?.lastUsedPreset).toBe('web');
    expect(prefsMsg?.preferences?.customPresets).toHaveLength(1);
  });

  it('save-preferences persists advancedModeEnabled without clobbering customPresets', async () => {
    await handleUIMessage({ type: 'save-preset', preset: makeCustomPreset({ id: 'custom-1' }) });
    figmaMock.ui.postMessage.mockClear();

    await handleUIMessage({ type: 'save-preferences', advancedModeEnabled: true });
    await handleUIMessage({ type: 'get-preferences' });

    const prefsMsg = (figmaMock.ui.postMessage.mock.calls.map((c) => c[0]) as Array<{ type: string; preferences?: SavedPreferences }>)
      .find((m) => m.type === 'preferences-loaded');
    expect(prefsMsg?.preferences?.advancedModeEnabled).toBe(true);
    expect(prefsMsg?.preferences?.customPresets).toHaveLength(1);
  });
});

describe('save-preset with validateCustomPreset guard', () => {
  let figmaMock: FigmaMock;

  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  it('rejects a malformed preset with an error and does not write to storage', async () => {
    const badPreset = { id: '', name: 'Bad', platform: 'iOS', isCustom: true, createdAt: 1, settings: [] };
    await handleUIMessage({ type: 'save-preset', preset: badPreset as CustomPreset });

    const stored = await figmaMock.clientStorage.getAsync('preferences');
    expect(stored).toBeUndefined();
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    );
  });

  it('regression: a valid preset still writes and posts success', async () => {
    const goodPreset = makeCustomPreset({ id: 'good-1', name: 'Good' });
    await handleUIMessage({ type: 'save-preset', preset: goodPreset });

    const stored = (await figmaMock.clientStorage.getAsync('preferences')) as SavedPreferences;
    expect(stored.customPresets).toHaveLength(1);
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'success',
      message: 'Preset saved successfully',
    });
  });
});

describe('apply/clear completion acks (busy-state protocol)', () => {
  let figmaMock: FigmaMock;
  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  const webPreset: PresetConfig = {
    id: 'web',
    name: 'Web',
    platform: 'Web',
    settings: [{ format: 'PNG', suffix: '@2x' }],
  };

  it('apply-preset posts apply-complete on the success path', async () => {
    figmaMock.currentPage.selection = [createMockNode()];
    await handleUIMessage({ type: 'apply-preset', preset: webPreset, advancedMode: false });
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({ type: 'apply-complete' });
  });

  it('apply-preset posts apply-complete even with an empty selection', async () => {
    figmaMock.currentPage.selection = [];
    await handleUIMessage({ type: 'apply-preset', preset: webPreset, advancedMode: false });
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({ type: 'apply-complete' });
  });

  it('clear-export posts clear-complete', async () => {
    figmaMock.currentPage.selection = [createMockNode()];
    await handleUIMessage({ type: 'clear-export' });
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({ type: 'clear-complete' });
  });
});

describe('record-preset-usage persistence failure (#8)', () => {
  let figmaMock: FigmaMock;
  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  it('swallows a setAsync failure: no error toast, no throw, re-sends authoritative prefs', async () => {
    figmaMock.ui.postMessage.mockClear();
    // The lastUsedPreset bookkeeping write fails.
    figmaMock.clientStorage.setAsync.mockRejectedValueOnce(new Error('quota exceeded'));

    await expect(
      handleUIMessage({ type: 'record-preset-usage', presetId: 'web' })
    ).resolves.toBeUndefined();

    const posted = figmaMock.ui.postMessage.mock.calls.map((c) => c[0] as { type: string });
    expect(posted.some((m) => m.type === 'error')).toBe(false);
    expect(posted.some((m) => m.type === 'preferences-loaded')).toBe(true);
  });
});

describe('open-external-url parse failure (#9)', () => {
  let figmaMock: FigmaMock;
  const openExternalMock = vi.fn();

  beforeEach(() => {
    figmaMock = installFigmaMock();
    (global as any).figma.openExternal = openExternalMock;
    openExternalMock.mockReset();
    figmaMock.ui.postMessage.mockReset();
  });

  it('accepts an http:// URL', async () => {
    const url = 'http://example.com/';
    await handleUIMessage({ type: 'open-external-url', url });
    expect(openExternalMock).toHaveBeenCalledWith(url);
    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled();
  });

  it('rejects an unparseable URL (exercises the catch) and posts an error', async () => {
    await handleUIMessage({ type: 'open-external-url', url: 'not a valid url' });
    expect(openExternalMock).not.toHaveBeenCalled();
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'error',
      message: 'Refused to open a non-web URL.',
    });
  });
});
