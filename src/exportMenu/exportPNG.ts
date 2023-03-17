import { ExportSetting } from '../models/types';

interface PNGExportSetting extends ExportSetting {
  format: 'PNG';
  constraint: {
    type: 'SCALE';
    value: number;
  };
  suffix?: string;
}

/**
 * Export selected layers as PNG images with the given settings.
 *
 * @param selection The selected layers to export.
 * @param settings The export settings to use.
 */
export function exportPNG(
  selection: readonly SceneNode[],
  settings: readonly PNGExportSetting[]
): void {
  selection.forEach((node) => {
    settings.forEach((exportSetting) => {
      const suffix = exportSetting.suffix ?? '';
      const fileName = `${node.name}${suffix}.png`;
      const exportScale = exportSetting.constraint.value;

      node
        .exportAsync({
          format: 'PNG',
          constraint: {
            type: 'SCALE',
            value: exportScale,
          },
          suffix,
          constraintId:
            node.constraints && node.constraints.horizontal,
        })
        .then((buffer) => {
          // Save the exported file
          figma.saveBytes(buffer, { name: fileName });
        });
    });
  });
}
