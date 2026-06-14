"use strict";

// src/shared/presets.ts
var DEFAULT_PRESETS = [
  {
    id: "ios",
    name: "iOS",
    platform: "iOS",
    icon: "\u{1F4F1}",
    generateMetadata: true,
    directoryStructure: true,
    settings: [
      {
        format: "PNG",
        suffix: "@3x",
        constraint: { type: "SCALE", value: 3 }
      },
      {
        format: "PNG",
        suffix: "@2x",
        constraint: { type: "SCALE", value: 2 }
      },
      {
        format: "PNG",
        suffix: "@1x",
        constraint: { type: "SCALE", value: 1 }
      }
    ]
  },
  {
    id: "android",
    name: "Android",
    platform: "Android",
    icon: "\u{1F916}",
    generateMetadata: false,
    directoryStructure: true,
    settings: [
      {
        format: "PNG",
        suffix: "drawable-xxxhdpi",
        constraint: { type: "SCALE", value: 4 }
      },
      {
        format: "PNG",
        suffix: "drawable-xxhdpi",
        constraint: { type: "SCALE", value: 3 }
      },
      {
        format: "PNG",
        suffix: "drawable-xhdpi",
        constraint: { type: "SCALE", value: 2 }
      },
      {
        format: "PNG",
        suffix: "drawable-hdpi",
        constraint: { type: "SCALE", value: 1.5 }
      },
      {
        format: "PNG",
        suffix: "drawable-mdpi",
        constraint: { type: "SCALE", value: 1 }
      },
      {
        format: "PNG",
        suffix: "drawable-ldpi",
        constraint: { type: "SCALE", value: 0.75 }
      }
    ]
  },
  {
    id: "web",
    name: "Web",
    platform: "Web",
    icon: "\u{1F310}",
    generateMetadata: false,
    directoryStructure: false,
    settings: [
      {
        format: "SVG",
        suffix: "",
        svgOutlineText: true,
        svgIdAttribute: false,
        svgSimplifyStroke: true
      },
      {
        format: "PNG",
        suffix: "@3x",
        constraint: { type: "SCALE", value: 3 }
      },
      {
        format: "PNG",
        suffix: "@2x",
        constraint: { type: "SCALE", value: 2 }
      },
      {
        format: "PNG",
        suffix: "@1x",
        constraint: { type: "SCALE", value: 1 }
      }
    ]
  },
  {
    id: "pdf",
    name: "PDF",
    platform: "PDF",
    icon: "\u{1F4C4}",
    generateMetadata: false,
    directoryStructure: false,
    settings: [
      {
        format: "PDF",
        suffix: ""
      }
    ]
  }
];

// src/shared/customName.ts
var CUSTOM_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;
var CUSTOM_NAME_MAX_LENGTH = 64;
var CUSTOM_NAME_ERROR = "Use letters, numbers, spaces, - or _";
function validateCustomName(raw) {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { valid: true, value: void 0 };
  }
  if (trimmed.length > CUSTOM_NAME_MAX_LENGTH || !CUSTOM_NAME_PATTERN.test(trimmed)) {
    return { valid: false, error: CUSTOM_NAME_ERROR };
  }
  return { valid: true, value: trimmed };
}

// src/plugin/main.ts
function handlePluginError(error) {
  console.error("Plugin error:", error);
  const errorMessage = {
    type: "error",
    message: error.message,
    stack: error.stack
  };
  try {
    figma.ui.postMessage(errorMessage);
  } catch (e) {
    console.error("Failed to send error message to UI:", e);
  }
}
async function loadPreferences() {
  const saved = await figma.clientStorage.getAsync("preferences");
  return saved || {
    customPresets: [],
    advancedModeEnabled: false
  };
}
async function savePreferences(preferences) {
  await figma.clientStorage.setAsync("preferences", preferences);
}
function generateiOSContentsJSON(assetName) {
  return JSON.stringify(
    {
      images: [
        {
          filename: `${assetName}@1x.png`,
          idiom: "universal",
          scale: "1x"
        },
        {
          filename: `${assetName}@2x.png`,
          idiom: "universal",
          scale: "2x"
        },
        {
          filename: `${assetName}@3x.png`,
          idiom: "universal",
          scale: "3x"
        }
      ],
      info: {
        author: "Lazy Export",
        version: 1
      }
    },
    null,
    2
  );
}
function applyExportSettings(nodes, settings, customName, advancedMode = false, platform) {
  if (!nodes || nodes.length === 0) {
    figma.notify("\u26A0\uFE0F No nodes selected");
    return;
  }
  const assetName = customName || "asset";
  nodes.forEach((node) => {
    const exportSettings = settings.map((setting) => {
      let suffix = setting.suffix || "";
      if (advancedMode && platform) {
        if (platform === "iOS") {
          const scale = setting.suffix || "@1x";
          suffix = `/${assetName}.imageset/${assetName}${scale}`;
        } else if (platform === "Android") {
          const density = setting.suffix || "drawable-mdpi";
          suffix = `/${density}/${assetName}`;
        }
      } else if (customName && setting.suffix) {
        suffix = `/${assetName}${setting.suffix}`;
      }
      if (setting.format === "SVG") {
        return {
          format: "SVG",
          suffix,
          ...setting.svgOutlineText !== void 0 && { svgOutlineText: setting.svgOutlineText },
          ...setting.svgIdAttribute !== void 0 && { svgIdAttribute: setting.svgIdAttribute },
          ...setting.svgSimplifyStroke !== void 0 && {
            svgSimplifyStroke: setting.svgSimplifyStroke
          }
        };
      }
      if (setting.format === "PDF") {
        return { format: "PDF", suffix };
      }
      return {
        format: setting.format,
        suffix,
        ...setting.constraint && { constraint: setting.constraint }
      };
    });
    node.exportSettings = exportSettings;
  });
  if (advancedMode && platform === "iOS") {
    const contentsJSON = generateiOSContentsJSON(assetName);
    const message = {
      type: "export-success",
      message: `\u2705 Applied! Copy Contents.json required for Xcode.`,
      metadata: { iosContentsJson: contentsJSON }
    };
    figma.ui.postMessage(message);
  } else {
    figma.notify(`\u2705 Export settings applied to ${nodes.length} node(s)`);
  }
}
function clearExportSettings(nodes) {
  if (!nodes || nodes.length === 0) {
    figma.notify("\u26A0\uFE0F No nodes selected");
    return;
  }
  nodes.forEach((node) => {
    node.exportSettings = [];
  });
  figma.notify(`\u{1F5D1}\uFE0F Export settings cleared from ${nodes.length} node(s)`);
}
function updateSelectionCount() {
  const count = figma.currentPage.selection.length;
  const message = {
    type: "selection-changed",
    count
  };
  figma.ui.postMessage(message);
}
(async () => {
  try {
    switch (figma.command) {
      case "applyIOS": {
        const preset = DEFAULT_PRESETS.find((p) => p.id === "ios");
        if (preset) {
          applyExportSettings(figma.currentPage.selection, preset.settings, void 0, false);
        }
        figma.closePlugin();
        break;
      }
      case "applyAndroid": {
        const preset = DEFAULT_PRESETS.find((p) => p.id === "android");
        if (preset) {
          applyExportSettings(figma.currentPage.selection, preset.settings, void 0, false);
        }
        figma.closePlugin();
        break;
      }
      case "applyWeb": {
        const preset = DEFAULT_PRESETS.find((p) => p.id === "web");
        if (preset) {
          applyExportSettings(figma.currentPage.selection, preset.settings, void 0, false);
        }
        figma.closePlugin();
        break;
      }
      case "clearExport": {
        clearExportSettings(figma.currentPage.selection);
        figma.closePlugin();
        break;
      }
      case "openPlugin":
      default: {
        figma.showUI(__html__, { width: 320, height: 520, themeColors: true });
        const preferences = await loadPreferences();
        const message = {
          type: "preferences-loaded",
          preferences
        };
        figma.ui.postMessage(message);
        updateSelectionCount();
        break;
      }
    }
  } catch (error) {
    handlePluginError(error);
  }
})();
figma.on("selectionchange", () => {
  try {
    updateSelectionCount();
  } catch (error) {
    handlePluginError(error);
  }
});
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case "apply-preset": {
        const { preset, customName, advancedMode } = msg;
        const nameResult = validateCustomName(customName ?? "");
        if (!nameResult.valid) {
          const rejection = {
            type: "invalid-custom-name",
            message: nameResult.error ?? "Invalid custom name"
          };
          figma.ui.postMessage(rejection);
          break;
        }
        applyExportSettings(
          figma.currentPage.selection,
          preset.settings,
          nameResult.value,
          advancedMode,
          preset.platform
        );
        break;
      }
      case "clear-export": {
        clearExportSettings(figma.currentPage.selection);
        break;
      }
      case "save-preset": {
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
        const response = {
          type: "success",
          message: "Preset saved successfully"
        };
        figma.ui.postMessage(response);
        break;
      }
      case "delete-preset": {
        const preferences = await loadPreferences();
        preferences.customPresets = preferences.customPresets.filter(
          (p) => p.id !== msg.presetId
        );
        await savePreferences(preferences);
        const response = {
          type: "success",
          message: "Preset deleted"
        };
        figma.ui.postMessage(response);
        break;
      }
      case "get-preferences": {
        const preferences = await loadPreferences();
        const response = {
          type: "preferences-loaded",
          preferences
        };
        figma.ui.postMessage(response);
        break;
      }
      case "save-preferences": {
        const preferences = await loadPreferences();
        preferences.advancedModeEnabled = msg.advancedModeEnabled;
        await savePreferences(preferences);
        break;
      }
      case "record-preset-usage": {
        const preferences = await loadPreferences();
        preferences.lastUsedPreset = msg.presetId;
        await savePreferences(preferences);
        break;
      }
      case "open-external-url": {
        figma.openExternal(msg.url);
        break;
      }
      default:
        console.warn("Unknown message type:", msg);
    }
  } catch (error) {
    const errorMessage = {
      type: "error",
      message: error instanceof Error ? error.message : "An error occurred"
    };
    figma.ui.postMessage(errorMessage);
  }
};
