/** Allowed characters: letters, digits, spaces, hyphen, underscore. */
export const CUSTOM_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

/** Maximum length for a custom name (after trimming). */
export const CUSTOM_NAME_MAX_LENGTH = 64;

/** User-facing message shown when a custom name violates the contract. */
export const CUSTOM_NAME_ERROR = 'Use letters, numbers, spaces, - or _';

export interface CustomNameResult {
  valid: boolean;
  value?: string;
  error?: string;
}

export function validateCustomName(raw: string): CustomNameResult {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return { valid: true, value: undefined };
  }

  if (trimmed.length > CUSTOM_NAME_MAX_LENGTH || !CUSTOM_NAME_PATTERN.test(trimmed)) {
    return { valid: false, error: CUSTOM_NAME_ERROR };
  }

  return { valid: true, value: trimmed };
}

export function isValidCustomName(raw: string): boolean {
  return validateCustomName(raw).valid;
}
