import { PresetConfig } from './types';

export const DEFAULT_PRESETS: PresetConfig[] = [
  {
    id: 'ios',
    name: 'iOS',
    platform: 'iOS',
    icon: '📱',
    generateMetadata: true,
    directoryStructure: true,
    settings: [
      {
        format: 'PNG',
        suffix: '@3x',
        constraint: { type: 'SCALE', value: 3 },
      },
      {
        format: 'PNG',
        suffix: '@2x',
        constraint: { type: 'SCALE', value: 2 },
      },
      {
        format: 'PNG',
        suffix: '@1x',
        constraint: { type: 'SCALE', value: 1 },
      },
    ],
  },
  {
    id: 'android',
    name: 'Android',
    platform: 'Android',
    icon: '🤖',
    generateMetadata: false,
    directoryStructure: true,
    settings: [
      {
        format: 'PNG',
        suffix: 'drawable-xxxhdpi',
        constraint: { type: 'SCALE', value: 4 },
      },
      {
        format: 'PNG',
        suffix: 'drawable-xxhdpi',
        constraint: { type: 'SCALE', value: 3 },
      },
      {
        format: 'PNG',
        suffix: 'drawable-xhdpi',
        constraint: { type: 'SCALE', value: 2 },
      },
      {
        format: 'PNG',
        suffix: 'drawable-hdpi',
        constraint: { type: 'SCALE', value: 1.5 },
      },
      {
        format: 'PNG',
        suffix: 'drawable-mdpi',
        constraint: { type: 'SCALE', value: 1 },
      },
      {
        format: 'PNG',
        suffix: 'drawable-ldpi',
        constraint: { type: 'SCALE', value: 0.75 },
      },
    ],
  },
  {
    id: 'web',
    name: 'Web',
    platform: 'Web',
    icon: '🌐',
    generateMetadata: false,
    directoryStructure: false,
    settings: [
      {
        format: 'SVG',
        suffix: '',
        svgOutlineText: true,
        svgIdAttribute: false,
        svgSimplifyStroke: true,
      },
      {
        format: 'PNG',
        suffix: '@3x',
        constraint: { type: 'SCALE', value: 3 },
      },
      {
        format: 'PNG',
        suffix: '@2x',
        constraint: { type: 'SCALE', value: 2 },
      },
      {
        format: 'PNG',
        suffix: '@1x',
        constraint: { type: 'SCALE', value: 1 },
      },
    ],
  },

  {
    id: 'pdf',
    name: 'PDF',
    platform: 'PDF',
    icon: '📄',
    generateMetadata: false,
    directoryStructure: false,
    settings: [
      {
        format: 'PDF',
        suffix: '',
      },
    ],
  },
];
