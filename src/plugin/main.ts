/**
 * Lazy Export - Figma Plugin Main Entry Point
 *
 * This file runs in the Figma plugin sandbox (no DOM access).
 * It handles:
 * - Applying export settings to selected nodes
 * - Persisting custom presets via clientStorage
 * - Generating metadata files (iOS Contents.json)
 * - Communication with the UI via postMessage
 * - Global error handling and reporting
 *
 * @see ARCHITECTURE.md for detailed technical documentation
 */

import { UIMessage, PluginMessage, SavedPreferences, ExportSetting } from '../shared/types';
import { DEFAULT_PRESETS } from '../shared/presets';

/**
 * Global error handler
 * Catches unhandled errors and sends them to the UI for user reporting
 */
function handlePluginError(error: Error): void {
  console.error('Plugin error:', error);

  const errorMessage: PluginMessage = {
    type: 'error',
    message: error.message,
    stack: error.stack,
  };

  try {
    figma.ui.postMessage(errorMessage);
  } catch (e) {
    console.error('Failed to send error message to UI:', e);
  }
}

// Wrap initialization in try-catch


/**
 * Load saved preferences from Figma's clientStorage
 *
 * clientStorage is scoped per plugin, per user, per file.
 * Data persists across plugin runs but is local to this file.
 *
 * @returns Saved preferences or default empty state
 */
async function loadPreferences(): Promise<SavedPreferences> {
  const saved = await figma.clientStorage.getAsync('preferences');
  return (
    saved || {
      customPresets: [],
      advancedModeEnabled: false,
    }
  );
}

/**
 * Save preferences to Figma's clientStorage
 *
 * @param preferences - Preferences object to persist
 */
async function savePreferences(preferences: SavedPreferences): Promise<void> {
  await figma.clientStorage.setAsync('preferences', preferences);
}

/**
 * Generate iOS Contents.json metadata file content
 *
 * iOS requires a Contents.json file in each .imageset folder
 * that describes the image assets and their scale factors.
 *
 * Example output structure:
 * ```json
 * {
 *   "images": [
 *     { "filename": "icon@1x.png", "idiom": "universal", "scale": "1x" },
 *     { "filename": "icon@2x.png", "idiom": "universal", "scale": "2x" },
 *     { "filename": "icon@3x.png", "idiom": "universal", "scale": "3x" }
 *   ],
 *   "info": { "author": "Lazy Export", "version": 1 }
 * }
 * ```
 *
 * @param assetName - Base name for the asset (e.g., "icon-home")
 * @returns Formatted JSON string for Contents.json
 */
function generateiOSContentsJSON(assetName: string): string {
  return JSON.stringify(
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
}

/**
 * Apply export settings to selected Figma nodes
 *
 * This is the core function that maps our preset configurations to
 * Figma's exportSettings API. It handles both basic and advanced modes.
 *
 * Basic Mode:
 * - Simple suffix applied (e.g., "/icon@2x.png")
 *
 * Advanced Mode:
 * - iOS: /asset.imageset/asset@2x.png
 * - Android: /drawable-xhdpi/asset.png
 *
 * @param nodes - Figma nodes to apply settings to (from selection)
 * @param settings - Export settings from preset configuration
 * @param customName - Optional custom asset name (defaults to "asset")
 * @param advancedMode - Whether to use production folder structures
 * @param platform - Platform identifier for advanced mode logic
 */
function applyExportSettings(
  nodes: readonly SceneNode[],
  settings: ExportSetting[],
  customName?: string,
  advancedMode: boolean = false,
  platform?: string
): void {
  if (!nodes || nodes.length === 0) {
    figma.notify('⚠️ No nodes selected');
    return;
  }

  const assetName = customName || 'asset';

  nodes.forEach((node) => {
    const exportSettings: ExportSettings[] = settings.map((setting): ExportSettings => {
      let suffix = setting.suffix || '';

      // Apply advanced directory structure
      if (advancedMode && platform) {
        if (platform === 'iOS') {
          const scale = setting.suffix || '@1x';
          suffix = `/${assetName}.imageset/${assetName}${scale}`;
        } else if (platform === 'Android') {
          const density = setting.suffix || 'drawable-mdpi';
          suffix = `/${density}/${assetName}`;
        }
      } else if (customName && setting.suffix) {
        suffix = `/${assetName}${setting.suffix}`;
      }

      if (setting.format === 'SVG') {
        return {
          format: 'SVG',
          suffix,
          ...(setting.svgOutlineText !== undefined && { svgOutlineText: setting.svgOutlineText }),
          ...(setting.svgIdAttribute !== undefined && { svgIdAttribute: setting.svgIdAttribute }),
          ...(setting.svgSimplifyStroke !== undefined && {
            svgSimplifyStroke: setting.svgSimplifyStroke,
          }),
        };
      }

      if (setting.format === 'PDF') {
        return { format: 'PDF', suffix };
      }

      // PNG | JPG → image variant (the only variant that accepts `constraint`)
      return {
        format: setting.format,
        suffix,
        ...(setting.constraint && { constraint: setting.constraint }),
      };
    });

    node.exportSettings = exportSettings;
  });

  // If iOS advanced mode, show info about Contents.json
  // If iOS advanced mode, show info about Contents.json
  if (advancedMode && platform === 'iOS') {
    const contentsJSON = generateiOSContentsJSON(assetName);
    const message: PluginMessage = {
      type: 'export-success',
      message: `✅ Applied! Copy Contents.json required for Xcode.`,
      metadata: { iosContentsJson: contentsJSON },
    };
    figma.ui.postMessage(message);
  } else {
    figma.notify(`✅ Export settings applied to ${nodes.length} node(s)`);
  }
}

// Clear export settings
function clearExportSettings(nodes: readonly SceneNode[]): void {
  if (!nodes || nodes.length === 0) {
    figma.notify('⚠️ No nodes selected');
    return;
  }

  nodes.forEach((node) => {
    node.exportSettings = [];
  });

  figma.notify(`🗑️ Export settings cleared from ${nodes.length} node(s)`);
}

// Send selection update to UI
function updateSelectionCount(): void {
  const count = figma.currentPage.selection.length;
  const message: PluginMessage = {
    type: 'selection-changed',
    count,
  };
  figma.ui.postMessage(message);
}

// Initialize
(async () => {
  try {
    switch (figma.command) {
      case 'applyIOS': {
        const preset = DEFAULT_PRESETS.find((p) => p.id === 'ios');
        if (preset) {
          applyExportSettings(figma.currentPage.selection, preset.settings, undefined, false);
        }
        figma.closePlugin();
        break;
      }

      case 'applyAndroid': {
        const preset = DEFAULT_PRESETS.find((p) => p.id === 'android');
        if (preset) {
          applyExportSettings(figma.currentPage.selection, preset.settings, undefined, false);
        }
        figma.closePlugin();
        break;
      }

      case 'applyWeb': {
        const preset = DEFAULT_PRESETS.find((p) => p.id === 'web');
        if (preset) {
          applyExportSettings(figma.currentPage.selection, preset.settings, undefined, false);
        }
        figma.closePlugin();
        break;
      }

      case 'clearExport': {
        clearExportSettings(figma.currentPage.selection);
        figma.closePlugin();
        break;
      }

      case 'openPlugin':
      default: {
        // Load and send preferences to UI
        figma.showUI(__html__, { width: 320, height: 520, themeColors: true });

        const preferences = await loadPreferences();
        const message: PluginMessage = {
          type: 'preferences-loaded',
          preferences,
        };
        figma.ui.postMessage(message);

        // Send initial selection count
        updateSelectionCount();
        break;
      }
    }
  } catch (error) {
    handlePluginError(error as Error);
  }
})();

// Listen for selection changes
figma.on('selectionchange', () => {
  try {
    updateSelectionCount();
  } catch (error) {
    handlePluginError(error as Error);
  }
});

// Handle messages from UI
figma.ui.onmessage = async (msg: UIMessage) => {
  try {
    switch (msg.type) {
      case 'apply-preset': {
        const { preset, customName, advancedMode } = msg;
        applyExportSettings(
          figma.currentPage.selection,
          preset.settings,
          customName,
          advancedMode,
          preset.platform
        );
        break;
      }

      case 'clear-export': {
        clearExportSettings(figma.currentPage.selection);
        break;
      }

      case 'save-preset': {
        const preferences = await loadPreferences();
        const existingIndex = preferences.customPresets.findIndex(
          (p) => p.id === msg.preset.id
        );

        if (existingIndex >= 0) {
          preferences.customPresets[existingIndex] = msg.preset;
        } else {
          preferences.customPresets.push(msg.preset);
        }

        await savePreferences(preferences);

        const response: PluginMessage = {
          type: 'success',
          message: 'Preset saved successfully',
        };
        figma.ui.postMessage(response);
        break;
      }

      case 'delete-preset': {
        const preferences = await loadPreferences();
        preferences.customPresets = preferences.customPresets.filter(
          (p) => p.id !== msg.presetId
        );
        await savePreferences(preferences);

        const response: PluginMessage = {
          type: 'success',
          message: 'Preset deleted',
        };
        figma.ui.postMessage(response);
        break;
      }

      case 'get-preferences': {
        const preferences = await loadPreferences();
        const response: PluginMessage = {
          type: 'preferences-loaded',
          preferences,
        };
        figma.ui.postMessage(response);
        break;
      }

      default:
        console.warn('Unknown message type:', msg);
    }
  } catch (error) {
    const errorMessage: PluginMessage = {
      type: 'error',
      message: error instanceof Error ? error.message : 'An error occurred',
    };
    figma.ui.postMessage(errorMessage);
  }
};
