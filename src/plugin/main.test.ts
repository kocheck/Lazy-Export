/**
 * Tests for plugin core: applyExportSettings, clearExportSettings,
 * generateiOSContentsJSON, load/savePreferences — invoked for real.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { installFigmaMock, createMockNode, FigmaMock } from '../test/figma-mock.js';
import {
  applyExportSettings,
  clearExportSettings,
  generateiOSContentsJSON,
  loadPreferences,
  savePreferences,
} from './core.js';
import type { ExportSetting, SavedPreferences } from '../shared/types.js';

describe('loadPreferences / savePreferences', () => {
  let figmaMock: FigmaMock;

  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  it('returns defaults when nothing is stored', async () => {
    const prefs = await loadPreferences();
    expect(prefs).toEqual({ customPresets: [], advancedModeEnabled: false });
  });

  it('round-trips saved preferences through clientStorage', async () => {
    const preferences: SavedPreferences = {
      customPresets: [
        {
          id: 'custom-1',
          name: 'My Preset',
          platform: 'iOS',
          isCustom: true,
          createdAt: 123,
          settings: [{ format: 'PNG', suffix: '@2x', constraint: { type: 'SCALE', value: 2 } }],
        },
      ],
      advancedModeEnabled: true,
    };

    await savePreferences(preferences);
    expect(figmaMock.clientStorage.setAsync).toHaveBeenCalledWith('preferences', preferences);

    const loaded = await loadPreferences();
    expect(loaded).toEqual(preferences);
  });
});

describe('generateiOSContentsJSON', () => {
  beforeEach(() => {
    installFigmaMock();
  });

  it('produces the @1x/@2x/@3x Contents.json structure', () => {
    const parsed = JSON.parse(generateiOSContentsJSON('icon-home'));
    expect(parsed.images).toHaveLength(3);
    expect(parsed.images[0].filename).toBe('icon-home@1x.png');
    expect(parsed.images[1].filename).toBe('icon-home@2x.png');
    expect(parsed.images[2].filename).toBe('icon-home@3x.png');
    expect(parsed.info).toEqual({ author: 'Lazy Export', version: 1 });
  });
});

describe('applyExportSettings', () => {
  let figmaMock: FigmaMock;

  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  it('notifies and applies nothing when no nodes are selected', () => {
    applyExportSettings([], [{ format: 'PNG', suffix: '@2x' }]);
    expect(figmaMock.notify).toHaveBeenCalledWith('⚠️ No nodes selected');
  });

  it('applies basic PNG settings to a node and notifies success', () => {
    const node = createMockNode();
    const settings: ExportSetting[] = [
      { format: 'PNG', suffix: '@2x', constraint: { type: 'SCALE', value: 2 } },
    ];

    applyExportSettings([node], settings);

    expect(node.exportSettings).toHaveLength(1);
    const applied = node.exportSettings[0];
    expect(applied.format).toBe('PNG');
    expect(applied.suffix).toBe('@2x');
    expect(figmaMock.notify).toHaveBeenCalledWith('✅ Export settings applied to 1 node(s)');
    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled();
  });

  it('emits SVG-only fields for SVG settings', () => {
    const node = createMockNode();
    const settings: ExportSetting[] = [
      {
        format: 'SVG',
        suffix: '',
        svgOutlineText: true,
        svgIdAttribute: false,
        svgSimplifyStroke: true,
      },
    ];

    applyExportSettings([node], settings);

    const applied = node.exportSettings[0];
    expect(applied.format).toBe('SVG');
    if (applied.format === 'SVG') {
      expect(applied.svgOutlineText).toBe(true);
      expect(applied.svgIdAttribute).toBe(false);
      expect(applied.svgSimplifyStroke).toBe(true);
    }
  });

  it('emits a PDF variant for PDF settings', () => {
    const node = createMockNode();
    applyExportSettings([node], [{ format: 'PDF', suffix: '' }]);
    expect(node.exportSettings[0].format).toBe('PDF');
  });

  it('basic mode with a custom name prefixes the suffix', () => {
    const node = createMockNode();
    applyExportSettings([node], [{ format: 'PNG', suffix: '@2x' }], 'icon-home');
    expect(node.exportSettings[0].suffix).toBe('/icon-home@2x');
  });

  it('advanced iOS builds the imageset path and posts export-success with Contents.json', () => {
    const node = createMockNode();
    applyExportSettings([node], [{ format: 'PNG', suffix: '@2x' }], 'icon-home', true, 'iOS');

    expect(node.exportSettings[0].suffix).toBe('/icon-home.imageset/icon-home@2x');

    const calls = figmaMock.ui.postMessage.mock.calls;
    expect(calls).toHaveLength(1);
    const msg = calls[0][0] as {
      type: string;
      message: string;
      metadata?: { iosContentsJson?: string };
    };
    expect(msg.type).toBe('export-success');
    expect(msg.metadata?.iosContentsJson).toContain('icon-home@2x.png');
    // iOS advanced posts a message instead of notifying.
    expect(figmaMock.notify).not.toHaveBeenCalled();
  });

  it('advanced Android builds the density path and notifies (no postMessage)', () => {
    const node = createMockNode();
    applyExportSettings(
      [node],
      [{ format: 'PNG', suffix: 'drawable-xhdpi' }],
      'icon-home',
      true,
      'Android'
    );

    expect(node.exportSettings[0].suffix).toBe('/drawable-xhdpi/icon-home');
    expect(figmaMock.notify).toHaveBeenCalledWith('✅ Export settings applied to 1 node(s)');
    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled();
  });

  it('advanced Web (no platform branch) applies the raw suffix', () => {
    const node = createMockNode();
    // Web is not iOS/Android, so the advanced directory branch does not rewrite the suffix.
    applyExportSettings([node], [{ format: 'SVG', suffix: '' }], undefined, true, 'Web');
    expect(node.exportSettings[0].suffix).toBe('');
    expect(figmaMock.notify).toHaveBeenCalledWith('✅ Export settings applied to 1 node(s)');
  });
});

describe('clearExportSettings', () => {
  let figmaMock: FigmaMock;

  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  it('notifies when no nodes are selected', () => {
    clearExportSettings([]);
    expect(figmaMock.notify).toHaveBeenCalledWith('⚠️ No nodes selected');
  });

  it('clears export settings and notifies', () => {
    const node = createMockNode();
    node.exportSettings = [{ format: 'PNG', suffix: '@2x' }];
    clearExportSettings([node]);
    expect(node.exportSettings).toHaveLength(0);
    expect(figmaMock.notify).toHaveBeenCalledWith('🗑️ Export settings cleared from 1 node(s)');
  });
});
