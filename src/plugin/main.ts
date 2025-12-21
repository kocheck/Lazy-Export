import { UIMessage, PluginMessage, SavedPreferences, ExportSetting } from '../shared/types';

// Show the UI
figma.showUI(__html__, { width: 320, height: 520, themeColors: true });

// Load saved preferences
async function loadPreferences(): Promise<SavedPreferences> {
  const saved = await figma.clientStorage.getAsync('preferences');
  return (
    saved || {
      customPresets: [],
      advancedModeEnabled: false,
    }
  );
}

// Save preferences
async function savePreferences(preferences: SavedPreferences): Promise<void> {
  await figma.clientStorage.setAsync('preferences', preferences);
}

// Generate iOS Contents.json metadata
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

// Apply export settings with advanced directory structure
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
    // Map settings to Figma's ExportSettings format
    const exportSettings: ExportSettings[] = settings.map((setting) => {
      let suffix = setting.suffix || '';

      // Apply advanced directory structure
      if (advancedMode && platform) {
        if (platform === 'iOS') {
          // iOS: /asset.imageset/asset@1x.png
          const scale = setting.suffix || '@1x';
          suffix = `/${assetName}.imageset/${assetName}${scale}`;
        } else if (platform === 'Android') {
          // Android: /drawable-mdpi/asset.png
          const density = setting.suffix || 'drawable-mdpi';
          suffix = `/${density}/${assetName}`;
        }
      } else if (customName && setting.suffix) {
        // Simple mode with custom name
        suffix = `/${assetName}${setting.suffix}`;
      }

      const exportSetting: ExportSettings = {
        format: setting.format,
        suffix: suffix,
      };

      // Add constraint if present
      if (setting.constraint) {
        exportSetting.constraint = setting.constraint;
      }

      // Add SVG options if present
      if (setting.format === 'SVG') {
        if (setting.svgOutlineText !== undefined) {
          exportSetting.svgOutlineText = setting.svgOutlineText;
        }
        if (setting.svgIdAttribute !== undefined) {
          exportSetting.svgIdAttribute = setting.svgIdAttribute;
        }
        if (setting.svgSimplifyStroke !== undefined) {
          exportSetting.svgSimplifyStroke = setting.svgSimplifyStroke;
        }
      }

      return exportSetting;
    });

    node.exportSettings = exportSettings;
  });

  // If iOS advanced mode, show info about Contents.json
  if (advancedMode && platform === 'iOS') {
    const contentsJSON = generateiOSContentsJSON(assetName);
    console.log('iOS Contents.json:', contentsJSON);
    figma.notify(
      `✅ Applied to ${nodes.length} node(s). Remember to create Contents.json in ${assetName}.imageset/`,
      { timeout: 4000 }
    );
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
  // Load and send preferences to UI
  const preferences = await loadPreferences();
  const message: PluginMessage = {
    type: 'preferences-loaded',
    preferences,
  };
  figma.ui.postMessage(message);

  // Send initial selection count
  updateSelectionCount();
})();

// Listen for selection changes
figma.on('selectionchange', () => {
  updateSelectionCount();
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
