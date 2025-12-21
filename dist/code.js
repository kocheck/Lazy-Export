"use strict";

// src/plugin/main.ts
figma.showUI(__html__, { width: 320, height: 520, themeColors: true });
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
      const exportSetting = {
        format: setting.format,
        suffix
      };
      if (setting.constraint) {
        exportSetting.constraint = setting.constraint;
      }
      if (setting.format === "SVG") {
        if (setting.svgOutlineText !== void 0) {
          exportSetting.svgOutlineText = setting.svgOutlineText;
        }
        if (setting.svgIdAttribute !== void 0) {
          exportSetting.svgIdAttribute = setting.svgIdAttribute;
        }
        if (setting.svgSimplifyStroke !== void 0) {
          exportSetting.svgSimplifyStroke = setting.svgSimplifyStroke;
        }
      }
      return exportSetting;
    });
    node.exportSettings = exportSettings;
  });
  if (advancedMode && platform === "iOS") {
    const contentsJSON = generateiOSContentsJSON(assetName);
    console.log("iOS Contents.json:", contentsJSON);
    figma.notify(
      `\u2705 Applied to ${nodes.length} node(s). Remember to create Contents.json in ${assetName}.imageset/`,
      { timeout: 4e3 }
    );
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
  const preferences = await loadPreferences();
  const message = {
    type: "preferences-loaded",
    preferences
  };
  figma.ui.postMessage(message);
  updateSelectionCount();
})();
figma.on("selectionchange", () => {
  updateSelectionCount();
});
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case "apply-preset": {
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
