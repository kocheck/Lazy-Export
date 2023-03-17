import { ExportSetting } from './types';

export const IOS_EXPORT_SETTINGS: ExportSetting[] = [
  {
    format: 'PNG',
    suffix: ' @3x',
    constraint: { type: 'SCALE', value: 3 },
  },
  {
    format: 'PNG',
    suffix: ' @2x',
    constraint: { type: 'SCALE', value: 2 },
  },
  {
    format: 'PNG',
    suffix: ' @1x',
    constraint: { type: 'SCALE', value: 1 },
  },
];

export default IOS_EXPORT_SETTINGS;
