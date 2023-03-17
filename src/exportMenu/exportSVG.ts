import { ExportSetting } from '../models/types';

/**
 * Export the selected Figma layers as SVG files.
 * @param settings The export settings to apply.
 */
export function exportSVG(settings: ExportSetting[]) {
  const selectedNodes = figma.currentPage.selection;

  if (selectedNodes.length === 0) {
    figma.notify('Please select layers to export.');
    return;
  }

  // Export each selected layer with the specified settings
  for (const node of selectedNodes) {
    const exportOptions: ExportSettingsImage = {
      format: 'SVG',
      svgOutlineText: true,
      svgIdAttribute: false,
      svgSimplifyStroke: true,
      ...settings[0].constraint, // use the constraint setting from the first item in the array
    };

    for (const { suffix } of settings) {
      // Construct the filename with the layer name and the suffix
      const filename = `${node.name}${suffix}`;

      // Export the layer as SVG
      const file = figma.createFile();
      const exportData = [
        {
          node: node,
          outputSettings: exportOptions,
          fileKey: file.key,
        },
      ];
      figma
        .exportAsync(exportData)
        .then(() => figma.notify(`Exported ${filename}.svg`))
        .catch((error) =>
          figma.notify(`Exporting ${filename}.svg failed: ${error}`)
        );
    }
  }
}
