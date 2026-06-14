// Shared types between UI and Plugin

export type Platform = 'iOS' | 'Android' | 'Web' | 'PDF';

export type ExportFormat = 'PNG' | 'JPG' | 'SVG' | 'PDF';

export interface ExportSetting {
  format: ExportFormat;
  suffix?: string;
  constraint?: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
  svgOutlineText?: boolean;
  svgIdAttribute?: boolean;
  svgSimplifyStroke?: boolean;
}

export interface PresetConfig {
  id: string;
  name: string;
  platform: Platform;
  icon?: string;
  settings: ExportSetting[];
  generateMetadata?: boolean; // For iOS Contents.json, Android XML, etc.
  directoryStructure?: boolean; // Whether to create folder structure
}

export interface CustomPreset extends PresetConfig {
  isCustom: true;
  createdAt: number;
}

export interface SavedPreferences {
  customPresets: CustomPreset[];
  lastUsedPreset?: string;
  advancedModeEnabled: boolean;
}

// Messages from UI to Plugin
export type UIMessage =
  | {
      type: 'apply-preset';
      preset: PresetConfig;
      customName?: string;
      advancedMode: boolean;
    }
  | {
      type: 'clear-export';
    }
  | {
      type: 'save-preset';
      preset: CustomPreset;
    }
  | {
      type: 'delete-preset';
      presetId: string;
    }
  | {
      type: 'get-preferences';
    }
  | {
      type: 'open-external-url';
      url: string;
    };

// Messages from Plugin to UI
export type PluginMessage =
  | {
      type: 'selection-changed';
      count: number;
    }
  | {
      type: 'preferences-loaded';
      preferences: SavedPreferences;
    }
  | {
      type: 'export-success';
      message: string;
      metadata?: { iosContentsJson?: string };
    }
  | {
      type: 'error';
      message: string;
      stack?: string;
    }
  | {
      type: 'success';
      message: string;
    };
