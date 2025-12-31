/**
 * Tests for sanitizeLog utility
 */

import { describe, it, expect } from 'vitest';
import { sanitizeLog, formatLogForGitHub, ErrorContext } from './sanitizeLog.js';

describe('sanitizeLog', () => {
  const baseContext: ErrorContext = {
    error: new Error('Test error'),
    pluginVersion: '2.0.0',
    figmaVersion: '124.5.6',
    timestamp: Date.now(),
  };

  it('should sanitize file keys', () => {
    const context: ErrorContext = {
      ...baseContext,
      error: new Error('Failed to load file/abc123def456ghi789'),
    };

    const sanitized = sanitizeLog(context);
    expect(sanitized.errorMessage).toContain('file/[SANITIZED]');
    expect(sanitized.errorMessage).not.toContain('abc123def456ghi789');
  });

  it('should sanitize user IDs', () => {
    const context: ErrorContext = {
      ...baseContext,
      error: new Error('User user_id:12345 not found'),
    };

    const sanitized = sanitizeLog(context);
    expect(sanitized.errorMessage).toContain('user_id:[SANITIZED]');
    expect(sanitized.errorMessage).not.toContain('12345');
  });

  it('should sanitize node IDs', () => {
    const error = new Error('Node 123:456 failed to export');
    const context: ErrorContext = {
      ...baseContext,
      error,
    };

    const sanitized = sanitizeLog(context);
    expect(sanitized.errorMessage).toContain('[NODE_ID]');
    expect(sanitized.errorMessage).not.toContain('123:456');
  });

  it('should sanitize email addresses', () => {
    const context: ErrorContext = {
      ...baseContext,
      error: new Error('User test@example.com encountered an error'),
    };

    const sanitized = sanitizeLog(context);
    expect(sanitized.errorMessage).toContain('[EMAIL]');
    expect(sanitized.errorMessage).not.toContain('test@example.com');
  });

  it('should sanitize file paths', () => {
    const error = new Error('Failed at /Users/john/project/file.ts');
    error.stack = `Error: Failed
    at /Users/john/project/file.ts:10:5
    at /home/runner/work/repo/file.js:20:3`;

    const context: ErrorContext = {
      ...baseContext,
      error,
    };

    const sanitized = sanitizeLog(context);
    expect(sanitized.stackTrace).toContain('/Users/[USER]');
    expect(sanitized.stackTrace).toContain('/home/[USER]');
    expect(sanitized.stackTrace).not.toContain('/Users/john');
    expect(sanitized.stackTrace).not.toContain('/home/runner');
  });

  it('should sanitize image hashes', () => {
    const context: ErrorContext = {
      ...baseContext,
      error: new Error('Image hash a1b2c3d4e5f6789012345678901234567890 not found'),
    };

    const sanitized = sanitizeLog(context);
    expect(sanitized.errorMessage).toContain('[IMAGE_HASH]');
    expect(sanitized.errorMessage).not.toContain('a1b2c3d4e5f6789012345678901234567890');
  });

  it('should preserve error type and basic message structure', () => {
    const error = new TypeError('Invalid type');
    const context: ErrorContext = {
      ...baseContext,
      error,
    };

    const sanitized = sanitizeLog(context);
    expect(sanitized.errorType).toBe('TypeError');
    expect(sanitized.errorMessage).toContain('Invalid type');
  });

  it('should include plugin and Figma versions', () => {
    const sanitized = sanitizeLog(baseContext);
    expect(sanitized.pluginVersion).toBe('2.0.0');
    expect(sanitized.figmaVersion).toBe('124.5.6');
  });

  it('should format timestamp as ISO string', () => {
    const now = Date.now();
    const context: ErrorContext = {
      ...baseContext,
      timestamp: now,
    };

    const sanitized = sanitizeLog(context);
    expect(sanitized.timestamp).toBe(new Date(now).toISOString());
  });

  it('should sanitize additional context', () => {
    const context: ErrorContext = {
      ...baseContext,
      additionalContext: {
        userId: 'user_id:secret123',
        nodeId: '123:456',
        safeProp: 'This is safe',
      },
    };

    const sanitized = sanitizeLog(context);
    expect(sanitized.context).toBeDefined();
    expect(sanitized.context?.userId).toContain('[SANITIZED]');
    expect(sanitized.context?.nodeId).toBe('[NODE_ID]');
    expect(sanitized.context?.safeProp).toBe('This is safe');
  });
});

describe('formatLogForGitHub', () => {
  it('should format sanitized log as Markdown', () => {
    const sanitizedLog = {
      pluginVersion: '2.0.0',
      figmaVersion: '124.5.6',
      timestamp: '2024-01-01T00:00:00.000Z',
      errorType: 'Error',
      errorMessage: 'Test error message',
      stackTrace: 'Error: Test error\n    at testFunction (file.ts:10:5)',
    };

    const markdown = formatLogForGitHub(sanitizedLog);

    expect(markdown).toContain('### Bug Report');
    expect(markdown).toContain('Plugin Version: 2.0.0');
    expect(markdown).toContain('Figma Version: 124.5.6');
    expect(markdown).toContain('Type: Error');
    expect(markdown).toContain('Message: Test error message');
    expect(markdown).toContain('```');
    expect(markdown).toContain('Error: Test error');
  });

  it('should include additional context if present', () => {
    const sanitizedLog = {
      pluginVersion: '2.0.0',
      figmaVersion: '124.5.6',
      timestamp: '2024-01-01T00:00:00.000Z',
      errorType: 'Error',
      errorMessage: 'Test error',
      stackTrace: 'Error: Test',
      context: {
        action: 'export',
        count: 5,
      },
    };

    const markdown = formatLogForGitHub(sanitizedLog);

    expect(markdown).toContain('Additional Context');
    expect(markdown).toContain('"action": "export"');
    expect(markdown).toContain('"count": 5');
  });

  it('should not include context section if empty', () => {
    const sanitizedLog = {
      pluginVersion: '2.0.0',
      figmaVersion: '124.5.6',
      timestamp: '2024-01-01T00:00:00.000Z',
      errorType: 'Error',
      errorMessage: 'Test error',
      stackTrace: 'Error: Test',
    };

    const markdown = formatLogForGitHub(sanitizedLog);

    expect(markdown).not.toContain('Additional Context');
  });
});
