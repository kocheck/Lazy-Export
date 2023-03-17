// code
import { ExportSetting } from './types';

export function hasValidSelection(
  selection: readonly SceneNode[]
): boolean {
  // Only allow export of supported types
  const supportedTypes = [
    'RECTANGLE',
    'TEXT',
    'VECTOR',
    'BOOLEAN_OPERATION',
    'ELLIPSE',
    'LINE',
    'FRAME',
  ];

  for (const node of selection) {
    if (supportedTypes.includes(node.type) === false) {
      return false;
    }

    // Only allow export of nodes with export settings
    const exportSettings = node.exportSettings;
    if (exportSettings == null || exportSettings.length === 0) {
      return false;
    }

    // Only allow export of nodes with valid export settings
    for (const exportSetting of exportSettings) {
      if (!isValidExportSetting(exportSetting)) {
        return false;
      }
    }
  }

  return true;
}

function isValidExportSetting(exportSetting: ExportSetting): boolean {
  if (
    exportSetting.format !== 'PNG' &&
    exportSetting.format !== 'SVG'
  ) {
    return false;
  }

  if (exportSetting.constraint == null) {
    return false;
  }

  if (
    exportSetting.constraint.type !== 'SCALE' &&
    exportSetting.constraint.type !== 'WIDTH' &&
    exportSetting.constraint.type !== 'HEIGHT'
  ) {
    return false;
  }

  return true;
}
