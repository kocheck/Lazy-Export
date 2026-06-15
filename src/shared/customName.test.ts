import { describe, it, expect } from 'vitest';
import {
  CUSTOM_NAME_PATTERN,
  CUSTOM_NAME_MAX_LENGTH,
  CUSTOM_NAME_ERROR,
  validateCustomName,
  isValidCustomName,
} from './customName.js';

describe('validateCustomName', () => {
  it('treats an empty string as valid with no value', () => {
    expect(validateCustomName('')).toEqual({ valid: true, value: undefined });
  });

  it('treats whitespace-only input as valid with no value (trimmed to empty)', () => {
    expect(validateCustomName('   ')).toEqual({ valid: true, value: undefined });
  });

  it('trims surrounding whitespace from a valid name', () => {
    expect(validateCustomName('  icon-home  ')).toEqual({
      valid: true,
      value: 'icon-home',
    });
  });

  it('accepts letters, numbers, spaces, hyphen and underscore', () => {
    expect(validateCustomName('Icon Home_2-x')).toEqual({
      valid: true,
      value: 'Icon Home_2-x',
    });
  });

  it('rejects characters outside the allowed set with the contract message', () => {
    const result = validateCustomName('icon/home');
    expect(result.valid).toBe(false);
    expect(result.value).toBeUndefined();
    expect(result.error).toBe(CUSTOM_NAME_ERROR);
  });

  it('rejects names with path separators or dots', () => {
    expect(validateCustomName('../etc').valid).toBe(false);
    expect(validateCustomName('icon.png').valid).toBe(false);
  });

  it('accepts a name exactly at the max length', () => {
    const name = 'a'.repeat(CUSTOM_NAME_MAX_LENGTH);
    expect(validateCustomName(name)).toEqual({ valid: true, value: name });
  });

  it('rejects a name longer than the max length', () => {
    const name = 'a'.repeat(CUSTOM_NAME_MAX_LENGTH + 1);
    const result = validateCustomName(name);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(CUSTOM_NAME_ERROR);
  });

  it('exposes a max length of 64', () => {
    expect(CUSTOM_NAME_MAX_LENGTH).toBe(64);
  });

  it('the contract message matches the spec exactly', () => {
    expect(CUSTOM_NAME_ERROR).toBe('Use letters, numbers, spaces, - or _');
  });

  it('the pattern matches a representative valid string', () => {
    expect(CUSTOM_NAME_PATTERN.test('My Asset_01-final')).toBe(true);
    expect(CUSTOM_NAME_PATTERN.test('nope!')).toBe(false);
  });
});

describe('isValidCustomName', () => {
  it('returns true for empty input', () => {
    expect(isValidCustomName('')).toBe(true);
  });

  it('returns true for an allowed trimmed name', () => {
    expect(isValidCustomName('  icon-home  ')).toBe(true);
  });

  it('returns false for disallowed characters', () => {
    expect(isValidCustomName('icon/home')).toBe(false);
  });

  it('returns false for an over-length name', () => {
    expect(isValidCustomName('a'.repeat(65))).toBe(false);
  });
});
