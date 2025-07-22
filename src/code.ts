figma.showUI(__html__, { width: 280, height: 480 });

figma.ui.onmessage = async (msg) => {
  const handleMessage = async () => {
    switch (msg.type) {
      case 'applySettings':
        await applyExportSettings(msg.platform, msg.name, msg.isAdvanced);
        figma.notify(`${msg.platform} Export Settings Applied`);
        break;
      case 'clearSettings':
        await clearExportSettings();
        figma.notify('Cleared Export Settings');
        break;
      case 'loadCustomPresets':
        await loadCustomPresets();
        break;
      case 'saveCustomPreset':
        await saveCustomPreset(msg.preset);
        break;
      case 'cancel':
        figma.closePlugin();
        break;
    }
  };

  await handleMessage();
};

if (figma.command) {
  handleMenuCommand(figma.command);
}

async function handleMenuCommand(command: string) {
  let platform: string;
  switch (command) {
    case 'applyIOS':
      platform = 'IOS';
      break;
    case 'applyAndroid':
      platform = 'Android';
      break;
    case 'applyWeb':
      platform = 'Web';
      break;
    case 'clearExport':
      await clearExportSettings();
      figma.closePlugin('Cleared Export Settings');
      return;
    case 'openPlugin':
      return;
    default:
      return;
  }

  await applyExportSettings(platform, 'default-asset', false);
  figma.closePlugin(`${platform} Settings Applied`);
}

async function applyExportSettings(platform: string, userEnteredString: string, isAdvanced: boolean) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.notify('Please select at least one item.');
    return;
  }

  const settings = getExportSettings(platform, userEnteredString, isAdvanced);

  for (const node of selection) {
    node.exportSettings = settings;
  }
}

async function clearExportSettings() {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.notify('Please select at least one item.');
    return;
  }

  for (const node of selection) {
    node.exportSettings = [];
  }
}

async function loadCustomPresets() {
  const presets = await figma.clientStorage.getAsync('customPresets') || [];
  figma.ui.postMessage({ type: 'customPresetsLoaded', presets });
}

async function saveCustomPreset(preset: any) {
  const presets = await figma.clientStorage.getAsync('customPresets') || [];
  presets.push(preset);
  await figma.clientStorage.setAsync('customPresets', presets);
  figma.ui.postMessage({ type: 'customPresetsLoaded', presets });
}

function getExportSettings(platform: string, userEnteredString: string, isAdvanced: boolean): ReadonlyArray<ExportSettings> {
  const name = userEnteredString || 'default-asset';

  switch (platform) {
    case 'IOS':
      if (isAdvanced) {
        return [
          { format: 'PNG', suffix: `/${name}.imageset/${name}@3x`, constraint: { type: 'SCALE', value: 3 } },
          { format: 'PNG', suffix: `/${name}.imageset/${name}@2x`, constraint: { type: 'SCALE', value: 2 } },
          { format: 'PNG', suffix: `/${name}.imageset/${name}@1x`, constraint: { type: 'SCALE', value: 1 } },
        ];
      }
      return [
        { format: 'PNG', suffix: `/${name}@3x`, constraint: { type: 'SCALE', value: 3 } },
        { format: 'PNG', suffix: `/${name}@2x`, constraint: { type: 'SCALE', value: 2 } },
        { format: 'PNG', suffix: `/${name}@1x`, constraint: { type: 'SCALE', value: 1 } },
      ];
    case 'Android':
      if (isAdvanced) {
        return [
          { format: 'PNG', suffix: `/drawable-xxxhdpi/${name}`, constraint: { type: 'SCALE', value: 4 } },
          { format: 'PNG', suffix: `/drawable-xxhdpi/${name}`, constraint: { type: 'SCALE', value: 3 } },
          { format: 'PNG', suffix: `/drawable-xhdpi/${name}`, constraint: { type: 'SCALE', value: 2 } },
          { format: 'PNG', suffix: `/drawable-hdpi/${name}`, constraint: { type: 'SCALE', value: 1.5 } },
          { format: 'PNG', suffix: `/drawable-ldpi/${name}`, constraint: { type: 'SCALE', value: 0.75 } },
          { format: 'PNG', suffix: `/drawable-mdpi/${name}`, constraint: { type: 'SCALE', value: 1 } },
        ];
      }
      return [
        { format: 'PNG', suffix: `drawable-xxxhdpi${name}`, constraint: { type: 'SCALE', value: 4 } },
        { format: 'PNG', suffix: 'drawable-xxhdpi', constraint: { type: 'SCALE', value: 3 } },
        { format: 'PNG', suffix: 'drawable-xhdpi', constraint: { type: 'SCALE', value: 2 } },
        { format: 'PNG', suffix: 'drawable-hdpi', constraint: { type: 'SCALE', value: 1.5 } },
        { format: 'PNG', suffix: 'drawable-ldpi', constraint: { type: 'SCALE', value: 0.75 } },
        { format: 'PNG', suffix: 'drawable-mdpi', constraint: { type: 'SCALE', value: 1 } },
      ];
    case 'Web':
      return [
        { format: 'SVG', suffix: '', svgOutlineText: true, svgIdAttribute: false, svgSimplifyStroke: true },
        { format: 'PNG', suffix: `/${name}@3x`, constraint: { type: 'SCALE', value: 3 } },
        { format: 'PNG', suffix: `/${name}@2x`, constraint: { type: 'SCALE', value: 2 } },
        { format: 'PNG', suffix: `/${name}@1x`, constraint: { type: 'SCALE', value: 1 } },
      ];
    default:
      return [];
  }
}