export interface ExportSetting {
  format: 'PNG' | 'JPG' | 'SVG';
  suffix: string;
  constraint: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
  svgOutlineText?: boolean;
  svgIdAttribute?: boolean;
  svgSimplifyStroke?: boolean;
}

export interface PlatformSettings {
  name: string;
  settings: ExportSetting[];
}

export type Platforms = 'ios' | 'android' | 'web';
