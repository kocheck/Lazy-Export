import { ExportSetting } from './types';

const menuSettingsWeb: ExportSetting[] = [
  {
    format: 'SVG',
    suffix: '',
    svgOutlineText: true,
    svgIdAttribute: false,
    svgSimplifyStroke: true,
  },
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

export default menuSettingsWeb;
