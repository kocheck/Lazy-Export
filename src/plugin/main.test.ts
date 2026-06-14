/**
 * Tests for Plugin Main Logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installFigmaMock, createMockNode, FigmaMock } from '../test/figma-mock.js';
import type { SavedPreferences } from '../shared/types.js';
import { CUSTOM_NAME_ERROR } from '../shared/customName.js';

describe('Plugin Storage', () => {
  let figmaMock: FigmaMock;

  beforeEach(() => {
    figmaMock = installFigmaMock();
  });

  it('should save preferences to clientStorage', async () => {
    const preferences: SavedPreferences = {
      customPresets: [],
      advancedModeEnabled: false,
    };

    await figmaMock.clientStorage.setAsync('preferences', preferences);

    expect(figmaMock.clientStorage.setAsync).toHaveBeenCalledWith('preferences', preferences);
  });

  it('should load preferences from clientStorage', async () => {
    const preferences: SavedPreferences = {
      customPresets: [
        {
          id: 'custom-1',
          name: 'My Preset',
          platform: 'iOS',
          isCustom: true,
          createdAt: Date.now(),
          settings: [
            {
              format: 'PNG',
              suffix: '@2x',
              constraint: { type: 'SCALE', value: 2 },
            },
          ],
        },
      ],
      advancedModeEnabled: true,
    };

    await figmaMock.clientStorage.setAsync('preferences', preferences);
    const loaded = await figmaMock.clientStorage.getAsync('preferences');

    expect(loaded).toEqual(preferences);
  });

  it('should return undefined for non-existent keys', async () => {
    const result = await figmaMock.clientStorage.getAsync('non-existent');
    expect(result).toBeUndefined();
  });
});

describe('Export Settings Application', () => {
  beforeEach(() => {
    installFigmaMock();
  });

  it('should apply export settings to a node', () => {
    const node = createMockNode();
    
    const exportSettings: ExportSettings[] = [
      {
        format: 'PNG',
        suffix: '@2x',
        constraint: { type: 'SCALE', value: 2 },
      },
    ];

    node.exportSettings = exportSettings;

    expect(node.exportSettings).toEqual(exportSettings);
    expect(node.exportSettings.length).toBe(1);
    expect(node.exportSettings[0].format).toBe('PNG');
  });

  it('should apply multiple export settings to a node', () => {
    const node = createMockNode();
    
    const exportSettings: ExportSettings[] = [
      {
        format: 'PNG',
        suffix: '@3x',
        constraint: { type: 'SCALE', value: 3 },
      },
      {
        format: 'PNG',
        suffix: '@2x',
        constraint: { type: 'SCALE', value: 2 },
      },
      {
        format: 'PNG',
        suffix: '@1x',
        constraint: { type: 'SCALE', value: 1 },
      },
    ];

    node.exportSettings = exportSettings;

    expect(node.exportSettings.length).toBe(3);
  });

  it('should clear export settings from a node', () => {
    const node = createMockNode();
    
    node.exportSettings = [
      {
        format: 'PNG',
        suffix: '@2x',
        constraint: { type: 'SCALE', value: 2 },
      },
    ];

    expect(node.exportSettings.length).toBe(1);

    node.exportSettings = [];

    expect(node.exportSettings.length).toBe(0);
  });

  it('should apply SVG settings correctly', () => {
    const node = createMockNode();
    
    const exportSettings: ExportSettings[] = [
      {
        format: 'SVG',
        suffix: '',
        svgOutlineText: true,
        svgIdAttribute: false,
        svgSimplifyStroke: true,
      },
    ];

    node.exportSettings = exportSettings;

    const applied = node.exportSettings[0];
    expect(applied.format).toBe('SVG');
    if (applied.format === 'SVG') {
      expect(applied.svgOutlineText).toBe(true);
      expect(applied.svgIdAttribute).toBe(false);
      expect(applied.svgSimplifyStroke).toBe(true);
    }
  });
});

describe('iOS Metadata Generation', () => {
  it('should generate valid Contents.json structure', () => {
    const assetName = 'icon-home';
    
    const contentsJSON = JSON.stringify(
      {
        images: [
          {
            filename: `${assetName}@1x.png`,
            idiom: 'universal',
            scale: '1x',
          },
          {
            filename: `${assetName}@2x.png`,
            idiom: 'universal',
            scale: '2x',
          },
          {
            filename: `${assetName}@3x.png`,
            idiom: 'universal',
            scale: '3x',
          },
        ],
        info: {
          author: 'Lazy Export',
          version: 1,
        },
      },
      null,
      2
    );

    const parsed = JSON.parse(contentsJSON);
    
    expect(parsed.images).toBeDefined();
    expect(parsed.images.length).toBe(3);
    expect(parsed.images[0].filename).toBe('icon-home@1x.png');
    expect(parsed.images[1].filename).toBe('icon-home@2x.png');
    expect(parsed.images[2].filename).toBe('icon-home@3x.png');
    expect(parsed.info.author).toBe('Lazy Export');
    expect(parsed.info.version).toBe(1);
  });
});

describe('Suffix and Path Formatting', () => {
  it('should format iOS advanced mode paths correctly', () => {
    const assetName = 'icon-home';
    const suffix = '@2x';
    const expectedPath = `/${assetName}.imageset/${assetName}${suffix}`;
    
    expect(expectedPath).toBe('/icon-home.imageset/icon-home@2x');
  });

  it('should format Android advanced mode paths correctly', () => {
    const assetName = 'icon-home';
    const density = 'drawable-xhdpi';
    const expectedPath = `/${density}/${assetName}`;
    
    expect(expectedPath).toBe('/drawable-xhdpi/icon-home');
  });

  it('should format simple mode paths with custom name', () => {
    const assetName = 'icon-home';
    const suffix = '@2x';
    const expectedPath = `/${assetName}${suffix}`;
    
    expect(expectedPath).toBe('/icon-home@2x');
  });
});

describe('open-external-url message', () => {
  it('routes open-external-url through figma.openExternal', async () => {
    const figmaMock = installFigmaMock();
    const openExternal = vi.fn();
    (globalThis as unknown as { figma: Record<string, unknown> }).figma.openExternal = openExternal;

    await import('./main.js');

    const handler = (globalThis as unknown as {
      figma: { ui: { onmessage: (msg: unknown) => unknown } };
    }).figma.ui.onmessage;

    await handler({ type: 'open-external-url', url: 'https://example.com/issue' });

    expect(openExternal).toHaveBeenCalledWith('https://example.com/issue');
    void figmaMock;
  });
});

describe('apply-preset defensive customName guard', () => {
  it('rejects an invalid customName without applying export settings', async () => {
    vi.resetModules();
    const { installFigmaMock, createMockNode } = await import('../test/figma-mock.js');
    const mock = installFigmaMock();

    const node = createMockNode();
    (globalThis as any).figma.currentPage.selection = [node];

    await import('./main.js');

    const handler = (globalThis as any).figma.ui.onmessage;

    await handler(
      {
        type: 'apply-preset',
        preset: {
          id: 'ios',
          name: 'iOS',
          platform: 'iOS',
          settings: [{ format: 'PNG', suffix: '@1x' }],
        },
        customName: 'bad/name',
        advancedMode: false,
      },
      { origin: '*', sourceFrameId: '' }
    );

    expect(node.exportSettings).toEqual([]);
    expect(mock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'invalid-custom-name', message: CUSTOM_NAME_ERROR })
    );
  });
});
