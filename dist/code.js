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

// src/plugin/core.ts
var VALID_IOS_SCALES = { "1": "1x", "2": "2x", "3": "3x" };
function iosScaleMarker(constraintValue) {
  return `@${constraintValue}x`;
}
function validateIOSMetadataSettings(settings) {
  const png = settings.filter((s) => s.format === "PNG");
  if (png.length === 0) {
    return "iOS metadata requires at least one PNG export setting.";
  }
  if (png.length !== settings.length) {
    return "iOS metadata only supports PNG settings \u2014 remove JPG or SVG entries.";
  }
  const seenScales = /* @__PURE__ */ new Set();
  for (const s of png) {
    if (!s.constraint || s.constraint.type !== "SCALE") {
      return "iOS metadata requires a SCALE constraint on every PNG entry.";
    }
    const val = String(s.constraint.value);
    if (!VALID_IOS_SCALES[val]) {
      return `iOS metadata only supports 1\xD7, 2\xD7, or 3\xD7 scales; found ${s.constraint.value}\xD7.`;
    }
    if (seenScales.has(val)) {
      return `iOS metadata has duplicate ${VALID_IOS_SCALES[val]} entries.`;
    }
    seenScales.add(val);
  }
  return null;
}
function generateIOSContentsJSON(assetName, settings) {
  const images = settings.filter((s) => s.format === "PNG" && s.constraint?.type === "SCALE").map((s) => {
    const value = s.constraint.value;
    return {
      filename: `${assetName}${iosScaleMarker(value)}.png`,
      idiom: "universal",
      scale: VALID_IOS_SCALES[String(value)] ?? `${value}x`
    };
  });
  return JSON.stringify({ images, info: { author: "Lazy Export", version: 1 } }, null, 2);
}
var _prefQueue = Promise.resolve();
function enqueuePrefMutation(fn) {
  const next = _prefQueue.then(fn, fn);
  _prefQueue = next.then(
    () => void 0,
    () => void 0
  );
  return next;
}
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
function applyExportSettings(nodes, settings, customName, advancedMode = false, platform, generateMetadata = false, directoryStructure = false) {
  if (!nodes || nodes.length === 0) {
    figma.notify("\u26A0\uFE0F No nodes selected");
    return;
  }
  const assetName = customName || "asset";
  nodes.forEach((node) => {
    const exportSettings = settings.map((setting) => {
      let suffix = setting.suffix || "";
      if (advancedMode && directoryStructure && platform) {
        if (platform === "iOS") {
          const scale = setting.constraint?.type === "SCALE" ? iosScaleMarker(setting.constraint.value) : setting.suffix || "@1x";
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
  if (advancedMode && generateMetadata && platform === "iOS") {
    const contentsJSON = generateIOSContentsJSON(assetName, settings);
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
async function handleUIMessage(msg) {
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
        if (preset.generateMetadata && preset.platform === "iOS") {
          const metaErr = validateIOSMetadataSettings(preset.settings);
          if (metaErr) {
            const rejection = { type: "error", message: metaErr };
            figma.ui.postMessage(rejection);
            break;
          }
        }
        applyExportSettings(
          figma.currentPage.selection,
          preset.settings,
          nameResult.value,
          advancedMode,
          preset.platform,
          preset.generateMetadata ?? false,
          preset.directoryStructure ?? false
        );
        break;
      }
      case "clear-export": {
        clearExportSettings(figma.currentPage.selection);
        break;
      }
      case "save-preset": {
        const preset = msg.preset;
        await enqueuePrefMutation(async () => {
          const preferences = await loadPreferences();
          const existingIndex = preferences.customPresets.findIndex((p) => p.id === preset.id);
          if (existingIndex >= 0) {
            preferences.customPresets[existingIndex] = preset;
          } else {
            preferences.customPresets.push(preset);
          }
          await savePreferences(preferences);
        });
        const response = { type: "success", message: "Preset saved successfully" };
        figma.ui.postMessage(response);
        break;
      }
      case "delete-preset": {
        const presetId = msg.presetId;
        await enqueuePrefMutation(async () => {
          const preferences = await loadPreferences();
          preferences.customPresets = preferences.customPresets.filter((p) => p.id !== presetId);
          await savePreferences(preferences);
        });
        const response = { type: "success", message: "Preset deleted" };
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
        const advancedModeEnabled = msg.advancedModeEnabled;
        await enqueuePrefMutation(async () => {
          const preferences = await loadPreferences();
          preferences.advancedModeEnabled = advancedModeEnabled;
          await savePreferences(preferences);
        });
        break;
      }
      case "record-preset-usage": {
        const presetId = msg.presetId;
        await enqueuePrefMutation(async () => {
          const preferences = await loadPreferences();
          preferences.lastUsedPreset = presetId;
          await savePreferences(preferences);
        });
        break;
      }
      case "open-external-url": {
        let allowed = false;
        try {
          const scheme = new URL(msg.url).protocol;
          allowed = scheme === "http:" || scheme === "https:";
        } catch {
          allowed = false;
        }
        if (allowed) {
          figma.openExternal(msg.url);
        } else {
          const rejection = {
            type: "error",
            message: "Refused to open a non-web URL."
          };
          figma.ui.postMessage(rejection);
        }
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
}
async function runCommand() {
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
    case "applyPDF": {
      const preset = DEFAULT_PRESETS.find((p) => p.id === "pdf");
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
}
function initPlugin() {
  runCommand().catch((error) => handlePluginError(error));
  figma.on("selectionchange", () => {
    try {
      updateSelectionCount();
    } catch (error) {
      handlePluginError(error);
    }
  });
  figma.ui.onmessage = (msg) => {
    void handleUIMessage(msg);
  };
}

// src/plugin/main.ts
initPlugin();
