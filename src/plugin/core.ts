/**
 * Lazy Export - Plugin core logic (importable, side-effect-free on import)
 *
 * This module runs in the Figma plugin sandbox (no DOM access). It contains the
 * pure logic and message dispatcher used by the thin entry point `main.ts`.
 * Importing this module must NOT register listeners or run the command switch —
 * that wiring lives in `initPlugin()`, which `main.ts` calls explicitly. This
 * separation is what makes the logic unit-testable.
 *
 * @see ARCHITECTURE.md for detailed technical documentation
 */

import {
  UIMessage,
  PluginMessage,
  SavedPreferences,
  ExportSetting,
  ImageExportSetting,
  CustomPreset,
  PLATFORMS,
  EXPORT_FORMATS,
} from '../shared/types';
import { DEFAULT_PRESETS } from '../shared/presets';
import { validateCustomName } from '../shared/customName';

// ---------------------------------------------------------------------------
// iOS metadata validation & generation
// ---------------------------------------------------------------------------

const VALID_IOS_SCALES: Record<string, string> = { '1': '1x', '2': '2x', '3': '3x' };

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function sendError(message: string): void {
  figma.ui.postMessage({ type: 'error', message } as PluginMessage);
}

/** Canonical iOS scale filename marker derived from a SCALE constraint value (e.g. 2 → "@2x"). */
function iosScaleMarker(constraintValue: number): string {
  return `@${constraintValue}x`;
}

/**
 * Validate that `settings` can produce a valid iOS Contents.json.
 * Returns `null` on success, or a user-facing error string on failure.
 */
export function validateIOSMetadataSettings(settings: ExportSetting[]): string | null {
  const png = settings.filter((s): s is ImageExportSetting => s.format === 'PNG');
  if (png.length === 0) {
    return 'iOS metadata requires at least one PNG export setting.';
  }
  if (png.length !== settings.length) {
    return 'iOS metadata only supports PNG settings — remove JPG or SVG entries.';
  }

  const seenScales = new Set<string>();
  for (const s of png) {
    if (!s.constraint || s.constraint.type !== 'SCALE') {
      return 'iOS metadata requires a SCALE constraint on every PNG entry.';
    }
    const val = String(s.constraint.value);
    if (!VALID_IOS_SCALES[val]) {
      return `iOS metadata only supports 1×, 2×, or 3× scales; found ${s.constraint.value}×.`;
    }
    if (seenScales.has(val)) {
      return `iOS metadata has duplicate ${VALID_IOS_SCALES[val]} entries.`;
    }
    seenScales.add(val);
  }

  return null;
}

/**
 * Generate iOS Contents.json from actual export settings.
 * Builds one image entry per PNG setting using its suffix and scale.
 * Callers must run validateIOSMetadataSettings first if coming from user input.
 */
export function generateIOSContentsJSON(assetName: string, settings: ExportSetting[]): string {
  const images = settings
    .filter((s): s is ImageExportSetting => s.format === 'PNG' && s.constraint?.type === 'SCALE')
    .map((s) => {
      const value = s.constraint!.value;
      return {
        filename: `${assetName}${iosScaleMarker(value)}.png`,
        idiom: 'universal',
        scale: VALID_IOS_SCALES[String(value)] ?? `${value}x`,
      };
    });

  return JSON.stringify({ images, info: { author: 'Lazy Export', version: 1 } }, null, 2);
}

// ---------------------------------------------------------------------------
// Preset validation
// ---------------------------------------------------------------------------

const MAX_PRESET_SETTINGS = 50;
const VALID_CONSTRAINT_TYPES = ['SCALE', 'WIDTH', 'HEIGHT'];
const SVG_FLAGS = ['svgOutlineText', 'svgIdAttribute', 'svgSimplifyStroke'] as const;

/**
 * Sound validation result: a `true` result carries the narrowed value, so a
 * caller that checks `result.valid` gets the typed `CustomPreset` with no cast.
 * (Precedent for returning a result object: `CustomNameResult` in
 * `src/shared/customName.ts` — this is a tighter, value-carrying variant.)
 */
export type ValidationResult<T> = { valid: true; value: T } | { valid: false; error: string };

/**
 * Validate untrusted preset input. Checks EVERY field the `CustomPreset`
 * contract declares — the closing `p as CustomPreset` cast is sound only because
 * each field is verified above it. Per-setting validation branches on `format`
 * so illegal field/format combinations (constraint on SVG, `svg*` on PNG, …) are
 * rejected rather than silently carried through.
 */
export function validateCustomPreset(p: unknown): ValidationResult<CustomPreset> {
  if (typeof p !== 'object' || p === null) return { valid: false, error: 'Preset is not an object.' };
  const preset = p as Record<string, unknown>;
  if (typeof preset.id !== 'string' || preset.id.length === 0)
    return { valid: false, error: 'Preset id must be a non-empty string.' };
  if (typeof preset.name !== 'string' || preset.name.length === 0)
    return { valid: false, error: 'Preset name must be a non-empty string.' };
  if (typeof preset.platform !== 'string' || !(PLATFORMS as string[]).includes(preset.platform))
    return { valid: false, error: 'Preset platform is invalid.' };
  if (!Array.isArray(preset.settings) || preset.settings.length > MAX_PRESET_SETTINGS)
    return { valid: false, error: 'Preset settings are invalid.' };

  for (const s of preset.settings as unknown[]) {
    if (typeof s !== 'object' || s === null)
      return { valid: false, error: 'Each setting must be an object.' };
    const setting = s as Record<string, unknown>;
    const format = setting.format;
    if (typeof format !== 'string' || !(EXPORT_FORMATS as string[]).includes(format))
      return { valid: false, error: `Setting format "${String(format)}" is invalid.` };
    if (setting.suffix !== undefined && typeof setting.suffix !== 'string')
      return { valid: false, error: 'Setting suffix must be a string.' };

    const isImage = format === 'PNG' || format === 'JPG';
    const isSvg = format === 'SVG';

    // `constraint` is valid ONLY on the image (PNG/JPG) variant, and is OPTIONAL
    // there — a constraint-less PNG/JPG is valid. Validate the shape only when present.
    if (setting.constraint !== undefined) {
      if (!isImage)
        return { valid: false, error: `Setting format "${format}" does not support a constraint.` };
      if (typeof setting.constraint !== 'object' || setting.constraint === null)
        return { valid: false, error: 'Setting constraint must be an object.' };
      const c = setting.constraint as Record<string, unknown>;
      if (typeof c.type !== 'string' || !VALID_CONSTRAINT_TYPES.includes(c.type))
        return { valid: false, error: 'Setting constraint type is invalid.' };
      if (typeof c.value !== 'number' || !Number.isFinite(c.value) || c.value <= 0)
        return { valid: false, error: 'Setting constraint value must be a finite number greater than 0.' };
    }

    // The `svg*` flags are valid ONLY on the SVG variant.
    for (const flag of SVG_FLAGS) {
      if (setting[flag] === undefined) continue;
      if (!isSvg)
        return { valid: false, error: `Setting format "${format}" does not support ${flag}.` };
      if (typeof setting[flag] !== 'boolean')
        return { valid: false, error: `Setting ${flag} must be a boolean.` };
    }
  }

  if (preset.isCustom !== true) return { valid: false, error: 'Preset must be a custom preset.' };
  if (typeof preset.createdAt !== 'number' || !Number.isFinite(preset.createdAt))
    return { valid: false, error: 'Preset createdAt must be a finite number.' };
  if (preset.icon !== undefined && typeof preset.icon !== 'string')
    return { valid: false, error: 'Preset icon must be a string.' };
  if (preset.generateMetadata !== undefined && typeof preset.generateMetadata !== 'boolean')
    return { valid: false, error: 'Preset generateMetadata must be a boolean.' };
  if (preset.directoryStructure !== undefined && typeof preset.directoryStructure !== 'boolean')
    return { valid: false, error: 'Preset directoryStructure must be a boolean.' };
  if (preset.generateMetadata === true && preset.platform === 'iOS' && preset.directoryStructure !== true)
    return { valid: false, error: 'iOS metadata (Contents.json) requires "Use Directory Structure" to be enabled.' };

  return { valid: true, value: p as CustomPreset };
}

// ---------------------------------------------------------------------------
// Preference mutation queue — serialises all read-modify-write operations so
// concurrent messages cannot clobber each other's writes.
// ---------------------------------------------------------------------------

let _prefQueue: Promise<unknown> = Promise.resolve();

/**
 * Run `fn` exclusively: it starts only after the previous enqueued mutation
 * completes (or fails). A rejected `fn` does not poison later queue entries.
 */
function enqueuePrefMutation<T>(fn: () => Promise<T>): Promise<T> {
  const next = _prefQueue.then(() => fn(), () => fn());
  // Let the queue tail ignore errors so a later enqueue always proceeds.
  _prefQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

/**
 * Global error handler.
 * Catches errors and sends them to the UI for user reporting.
 */
export function handlePluginError(error: Error): void {
  console.error('Plugin error:', error);

  const errorMessage: PluginMessage = {
    type: 'error',
    message: error.message,
    stack: error.stack,
  };

  try {
    figma.ui.postMessage(errorMessage);
  } catch (e) {
    console.error('Failed to send error message to UI:', e);
  }
}

/**
 * Load saved preferences from Figma's clientStorage.
 * @returns Saved preferences or default empty state
 */
export async function loadPreferences(): Promise<SavedPreferences> {
  const saved = await figma.clientStorage.getAsync('preferences');
  return (
    saved || {
      customPresets: [],
      advancedModeEnabled: false,
    }
  );
}

/**
 * Save preferences to Figma's clientStorage.
 * @param preferences - Preferences object to persist
 */
export async function savePreferences(preferences: SavedPreferences): Promise<void> {
  await figma.clientStorage.setAsync('preferences', preferences);
}

/**
 * Apply export settings to selected Figma nodes.
 * @param nodes - Figma nodes to apply settings to (from selection)
 * @param settings - Export settings from preset configuration
 * @param customName - Optional custom asset name (defaults to "asset")
 * @param advancedMode - Whether to use production folder structures
 * @param platform - Platform identifier for advanced mode logic
 */
export function applyExportSettings(
  nodes: readonly SceneNode[],
  settings: ExportSetting[],
  customName?: string,
  advancedMode: boolean = false,
  platform?: string,
  generateMetadata: boolean = false,
  directoryStructure: boolean = false
): void {
  if (nodes.length === 0) {
    figma.notify('⚠️ No nodes selected');
    return;
  }

  const assetName = customName || 'asset';

  const exportSettings: ExportSettings[] = settings.map((setting): ExportSettings => {
    let suffix = setting.suffix || '';

    // Apply advanced directory structure (only when the preset opts in)
    if (advancedMode && directoryStructure && platform) {
      if (platform === 'iOS') {
        const scale =
          (setting.format === 'PNG' || setting.format === 'JPG') && setting.constraint?.type === 'SCALE'
            ? iosScaleMarker(setting.constraint.value)
            : setting.suffix || '@1x';
        suffix = `/${assetName}.imageset/${assetName}${scale}`;
      } else if (platform === 'Android') {
        const density = setting.suffix || 'drawable-mdpi';
        suffix = `/${density}/${assetName}`;
      }
    } else if (customName && setting.suffix) {
      suffix = `/${assetName}${setting.suffix}`;
    }

    if (setting.format === 'SVG') {
      return {
        format: 'SVG',
        suffix,
        ...(setting.svgOutlineText !== undefined && { svgOutlineText: setting.svgOutlineText }),
        ...(setting.svgIdAttribute !== undefined && { svgIdAttribute: setting.svgIdAttribute }),
        ...(setting.svgSimplifyStroke !== undefined && {
          svgSimplifyStroke: setting.svgSimplifyStroke,
        }),
      };
    }

    if (setting.format === 'PDF') {
      return { format: 'PDF', suffix };
    }

    // PNG | JPG → image variant (the only variant that accepts `constraint`)
    return {
      format: setting.format,
      suffix,
      ...(setting.constraint && { constraint: setting.constraint }),
    };
  });

  nodes.forEach((node) => {
    node.exportSettings = exportSettings;
  });

  // If iOS advanced mode AND the preset opts into metadata, surface Contents.json
  if (advancedMode && generateMetadata && platform === 'iOS') {
    const contentsJSON = generateIOSContentsJSON(assetName, settings);
    const message: PluginMessage = {
      type: 'export-success',
      message: `✅ Applied! Copy Contents.json required for Xcode.`,
      metadata: { iosContentsJson: contentsJSON },
    };
    figma.ui.postMessage(message);
  } else {
    figma.notify(`✅ Export settings applied to ${nodes.length} node(s)`);
  }
}

/**
 * Clear export settings from selected nodes.
 */
export function clearExportSettings(nodes: readonly SceneNode[]): void {
  if (nodes.length === 0) {
    figma.notify('⚠️ No nodes selected');
    return;
  }

  nodes.forEach((node) => {
    node.exportSettings = [];
  });

  figma.notify(`🗑️ Export settings cleared from ${nodes.length} node(s)`);
}

/**
 * Send the current selection count to the UI.
 */
export function updateSelectionCount(): void {
  const count = figma.currentPage.selection.length;
  const message: PluginMessage = {
    type: 'selection-changed',
    count,
  };
  figma.ui.postMessage(message);
}

/**
 * Dispatch a single message received from the UI.
 * Adapted from the previous `figma.ui.onmessage` body and extended with
 * custom-name validation, iOS-metadata validation, the preference write queue,
 * and new cases: `save-preferences`, `record-preset-usage`, `open-external-url`.
 */
export async function handleUIMessage(msg: UIMessage): Promise<void> {
  try {
    switch (msg.type) {
      case 'apply-preset': {
        const { preset, customName, advancedMode } = msg;

        const nameResult = validateCustomName(customName ?? '');
        if (!nameResult.valid) {
          const rejection: PluginMessage = {
            type: 'invalid-custom-name',
            message: nameResult.error ?? 'Invalid custom name',
          };
          figma.ui.postMessage(rejection);
          break;
        }

        // Validate iOS metadata settings before touching any node.
        if (preset.generateMetadata && preset.platform === 'iOS') {
          // Contents.json filenames derive from the imageset path — only valid with directory structure.
          if (!(preset.directoryStructure ?? false)) {
            sendError('iOS metadata (Contents.json) requires "Use Directory Structure" to be enabled.');
            break;
          }
          const metaErr = validateIOSMetadataSettings(preset.settings);
          if (metaErr) {
            sendError(metaErr);
            break;
          }
        }

        applyExportSettings(
          figma.currentPage.selection,
          preset.settings,
          nameResult.value,
          advancedMode,
          preset.platform,
          preset.generateMetadata ?? false,
          preset.directoryStructure ?? false
        );
        // Only the success path reaches here — the early breaks (invalid-custom-name,
        // iOS-metadata errors) and the outer catch each post their own terminal message.
        figma.ui.postMessage({ type: 'apply-complete' } as PluginMessage);
        break;
      }

      case 'clear-export': {
        clearExportSettings(figma.currentPage.selection);
        figma.ui.postMessage({ type: 'clear-complete' } as PluginMessage);
        break;
      }

      case 'save-preset': {
        const result = validateCustomPreset(msg.preset);
        if (!result.valid) {
          sendError(result.error);
          break;
        }
        const preset = result.value;
        await enqueuePrefMutation(async () => {
          const preferences = await loadPreferences();
          const existingIndex = preferences.customPresets.findIndex((p) => p.id === preset.id);
          if (existingIndex >= 0) {
            preferences.customPresets[existingIndex] = preset;
          } else {
            preferences.customPresets.push(preset);
          }
          await savePreferences(preferences);
        });
        const response: PluginMessage = { type: 'success', message: 'Preset saved successfully' };
        figma.ui.postMessage(response);
        break;
      }

      case 'delete-preset': {
        const presetId = msg.presetId;
        await enqueuePrefMutation(async () => {
          const preferences = await loadPreferences();
          preferences.customPresets = preferences.customPresets.filter((p) => p.id !== presetId);
          await savePreferences(preferences);
        });
        const response: PluginMessage = { type: 'success', message: 'Preset deleted' };
        figma.ui.postMessage(response);
        break;
      }

      case 'get-preferences': {
        const preferences = await loadPreferences();
        const response: PluginMessage = {
          type: 'preferences-loaded',
          preferences,
        };
        figma.ui.postMessage(response);
        break;
      }

      case 'save-preferences': {
        const advancedModeEnabled = msg.advancedModeEnabled;
        await enqueuePrefMutation(async () => {
          const preferences = await loadPreferences();
          preferences.advancedModeEnabled = advancedModeEnabled;
          await savePreferences(preferences);
        });
        break;
      }

      case 'record-preset-usage': {
        const presetId = msg.presetId;
        // Wrap in its own try/catch so a bookkeeping write failure never posts an
        // error toast after a successful apply.
        try {
          await enqueuePrefMutation(async () => {
            const preferences = await loadPreferences();
            preferences.lastUsedPreset = presetId;
            await savePreferences(preferences);
          });
        } catch (err) {
          console.warn('record-preset-usage: failed to persist', err);
          // The UI optimistically set `lastUsedPreset` (App.tsx) — the write failed,
          // so re-send the authoritative (unmutated) prefs to snap it back. Best-effort;
          // never escalate a bookkeeping failure into a user-facing error toast.
          try {
            const preferences = await loadPreferences();
            const reload: PluginMessage = { type: 'preferences-loaded', preferences };
            figma.ui.postMessage(reload);
          } catch (reloadErr) {
            console.warn('record-preset-usage: failed to reload preferences', reloadErr);
          }
        }
        break;
      }

      case 'open-external-url': {
        let allowed = false;
        try {
          const scheme = new URL(msg.url).protocol;
          allowed = scheme === 'http:' || scheme === 'https:';
        } catch (e) {
          // Log the failure for debugging, but cap the URL — it may carry sensitive
          // pasted content (cf. src/shared/sanitizeLog.ts hygiene).
          console.warn('open-external-url: failed to parse URL', {
            url: String(msg.url).slice(0, 60),
            error: e,
          });
          allowed = false;
        }
        if (allowed) {
          figma.openExternal(msg.url);
        } else {
          sendError('Refused to open a non-web URL.');
        }
        break;
      }

      default:
        console.warn('Unknown message type:', msg);
    }
  } catch (error) {
    sendError(error instanceof Error ? error.message : 'An error occurred');
  }
}

/**
 * Run the plugin's command switch for one invocation.
 * Adapted from the previous init IIFE; `applyPDF` is new (plan 009).
 */
const QUICK_APPLY_MAP: Record<string, string> = {
  applyIOS: 'ios',
  applyAndroid: 'android',
  applyWeb: 'web',
  applyPDF: 'pdf',
};

async function runCommand(): Promise<void> {
  const quickPresetId = QUICK_APPLY_MAP[figma.command];
  if (quickPresetId !== undefined) {
    const preset = DEFAULT_PRESETS.find((p) => p.id === quickPresetId);
    if (preset) {
      applyExportSettings(figma.currentPage.selection, preset.settings, undefined, false);
    }
    figma.closePlugin();
    return;
  }

  switch (figma.command) {
    case 'clearExport': {
      clearExportSettings(figma.currentPage.selection);
      figma.closePlugin();
      break;
    }

    case 'openPlugin':
    default: {
      figma.showUI(__html__, { width: 320, height: 520, themeColors: true });

      const preferences = await loadPreferences();
      const message: PluginMessage = {
        type: 'preferences-loaded',
        preferences,
      };
      figma.ui.postMessage(message);

      updateSelectionCount();
      break;
    }
  }
}

/**
 * Wire up the plugin: run the command switch, register the selection listener,
 * and install the UI message handler. Called once by `main.ts` at startup.
 * This is the ONLY function that produces import-time-style side effects, and it
 * only runs when explicitly invoked — so importing this module is side-effect-free.
 */
export function initPlugin(): void {
  // Run the command switch (was the top-level IIFE).
  runCommand().catch((error) => handlePluginError(error as Error));

  // Listen for selection changes.
  figma.on('selectionchange', () => {
    try {
      updateSelectionCount();
    } catch (error) {
      handlePluginError(error as Error);
    }
  });

  // Handle messages from the UI.
  figma.ui.onmessage = (msg: UIMessage) => {
    void handleUIMessage(msg);
  };
}
