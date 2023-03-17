import { ExportSetting } from '../models/types';
import { applyExportSettingsToSelection } from './applyExportSettingsToSelection';

export function applyIOSSettings() {
  const iosSettings: ExportSetting[] =
    require('./ios').menuSettingsIOS;
  applyExportSettingsToSelection(iosSettings);
}

export function applyAndroidSettings() {
  const androidSettings: ExportSetting[] =
    require('./android').menuSettingsAndroid;
  applyExportSettingsToSelection(androidSettings);
}

export function applyWebSettings() {
  const webSettings: ExportSetting[] =
    require('./web').menuSettingsWeb;
  applyExportSettingsToSelection(webSettings);
}
