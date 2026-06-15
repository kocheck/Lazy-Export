// Shared types between UI and Plugin

export type Platform = 'iOS' | 'Android' | 'Web' | 'PDF';
export const PLATFORMS: Platform[] = ['iOS', 'Android', 'Web', 'PDF'];

export type ExportFormat = 'PNG' | 'JPG' | 'SVG' | 'PDF';
export const EXPORT_FORMATS: ExportFormat[] = ['PNG', 'JPG', 'SVG', 'PDF'];

// `ExportSetting` is a format-discriminated union (modelled on the UIMessage/
// PluginMessage unions below). Narrowing on `format` makes the variant-specific
// fields — `constraint` (image only) and the `svg*` flags (SVG only) — type-safe,
// and makes illegal combinations (e.g. a `constraint` on an SVG) unrepresentable.
interface BaseExportSetting {
  suffix?: string;
}
export interface ImageExportSetting extends BaseExportSetting {
  format: 'PNG' | 'JPG';
  constraint?: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
}
export interface SvgExportSetting extends BaseExportSetting {
  format: 'SVG';
  svgOutlineText?: boolean;
  svgIdAttribute?: boolean;
  svgSimplifyStroke?: boolean;
}
export interface PdfExportSetting extends BaseExportSetting {
  format: 'PDF';
}
export type ExportSetting = ImageExportSetting | SvgExportSetting | PdfExportSetting;

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

/**
 * Shape of an exported preset file (D2). Design: docs/preset-import-export-design.md.
 * Type-only stub — no runtime export/import logic lands until plan 012.
 *
 * The wire types are defined EXPLICITLY and are intentionally NOT aliased to
 * `CustomPreset`/`ExportSetting`. The on-disk v1 contract must stay frozen even
 * if the runtime types evolve — aliasing would let a future runtime change
 * silently mutate the v1 format. New runtime shapes get a `PresetV2`, etc.
 */
export interface PresetV1Setting {
  format: 'PNG' | 'JPG' | 'SVG' | 'PDF';
  suffix?: string;
  constraint?: { type: 'SCALE' | 'WIDTH' | 'HEIGHT'; value: number };
  svgOutlineText?: boolean;
  svgIdAttribute?: boolean;
  svgSimplifyStroke?: boolean;
}
export interface PresetV1 {
  id: string;
  name: string;
  platform: 'iOS' | 'Android' | 'Web' | 'PDF';
  icon?: string;
  settings: PresetV1Setting[];
  generateMetadata?: boolean;
  directoryStructure?: boolean;
  isCustom: true;
  createdAt: number;
}
export interface PresetExportFile {
  format: 'lazy-export-presets';
  version: 1;
  exportedAt: number;
  presets: PresetV1[];
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
      type: 'save-preferences';
      advancedModeEnabled: boolean;
    }
  | {
      type: 'record-preset-usage';
      presetId: string;
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
    }
  | {
      type: 'invalid-custom-name';
      message: string;
    }
  | {
      // Ack: the apply-preset op finished (success path). Lets the UI clear its
      // in-flight/busy state — `applyExportSettings` itself only `figma.notify`s.
      type: 'apply-complete';
    }
  | {
      // Ack: the clear-export op finished. Same rationale as `apply-complete`.
      type: 'clear-complete';
    };
