import { ExportSettingImageConstraint } from './types';

export const androidSettings = [
  {
    format: 'PNG',
    suffix: ' drawable-xxxhdpi',
    constraint: {
      type: 'SCALE',
      value: 4,
    } as ExportSettingImageConstraint,
  },
  {
    format: 'PNG',
    suffix: ' drawable-xxhdpi',
    constraint: {
      type: 'SCALE',
      value: 3,
    } as ExportSettingImageConstraint,
  },
  {
    format: 'PNG',
    suffix: ' drawable-xhdpi',
    constraint: {
      type: 'SCALE',
      value: 2,
    } as ExportSettingImageConstraint,
  },
  {
    format: 'PNG',
    suffix: ' drawable-hdpi',
    constraint: {
      type: 'SCALE',
      value: 1.5,
    } as ExportSettingImageConstraint,
  },
  {
    format: 'PNG',
    suffix: ' drawable-ldpi',
    constraint: {
      type: 'SCALE',
      value: 0.75,
    } as ExportSettingImageConstraint,
  },
  {
    format: 'PNG',
    suffix: ' drawable-mdpi',
    constraint: {
      type: 'SCALE',
      value: 1,
    } as ExportSettingImageConstraint,
  },
];
