/**
 * Sanitize Log Utility
 * 
 * Removes sensitive user data from error logs while preserving
 * useful debugging information for GitHub issue reports.
 * 
 * Removes:
 * - File Keys (Figma document identifiers)
 * - User Names and IDs
 * - Image Hashes
 * - Specific Layer IDs
 * 
 * Retains:
 * - Error Types and Messages
 * - Stack Traces (with sanitized paths)
 * - Plugin Version
 * - Figma API Version
 */

export interface ErrorContext {
  error: Error;
  pluginVersion: string;
  figmaVersion?: string;
  userAgent?: string;
  timestamp: number;
  additionalContext?: Record<string, any>;
}

export interface SanitizedLog {
  pluginVersion: string;
  figmaVersion: string;
  timestamp: string;
  errorType: string;
  errorMessage: string;
  stackTrace: string;
  context?: Record<string, any>;
}

/**
 * Sanitize a single string by removing sensitive patterns
 */
function sanitizeString(input: string): string {
  return input
    // Remove image hashes (must come before file keys as they're more specific)
    .replace(/\b[a-f0-9]{32,}\b/gi, '[IMAGE_HASH]')
    // Remove file keys (format: xxxxxx or file/xxxxxx)
    .replace(/file\/[\w-]+/gi, 'file/[SANITIZED]')
    .replace(/\b[a-zA-Z0-9]{22,}\b/g, '[FILE_KEY]')
    // Remove user IDs (numeric or alphanumeric)
    .replace(/user[_-]?id[:\s=]+[\w-]+/gi, 'user_id:[SANITIZED]')
    // Remove node IDs (format: 123:456)
    .replace(/\b\d+:\d+\b/g, '[NODE_ID]')
    // Remove email addresses
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]')
    // Sanitize absolute file paths while keeping relative structure
    .replace(/\/Users\/[\w/.-]+/g, '/Users/[USER]')
    .replace(/C:\\Users\\[\w\\.-]+/g, 'C:\\Users\\[USER]')
    .replace(/\/home\/[\w/.-]+/g, '/home/[USER]');
}

/**
 * Sanitize error context and format for GitHub issue report
 */
export function sanitizeLog(context: ErrorContext): SanitizedLog {
  const sanitizedMessage = sanitizeString(context.error.message);
  const sanitizedStack = context.error.stack
    ? sanitizeString(context.error.stack)
    : 'No stack trace available';

  // Sanitize additional context if provided
  const sanitizedContext: Record<string, any> = {};
  if (context.additionalContext) {
    for (const [key, value] of Object.entries(context.additionalContext)) {
      if (typeof value === 'string') {
        sanitizedContext[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitizedContext[key] = JSON.parse(
          sanitizeString(JSON.stringify(value))
        );
      } else {
        sanitizedContext[key] = value;
      }
    }
  }

  return {
    pluginVersion: context.pluginVersion,
    figmaVersion: context.figmaVersion || 'Unknown',
    timestamp: new Date(context.timestamp).toISOString(),
    errorType: context.error.name || 'Error',
    errorMessage: sanitizedMessage,
    stackTrace: sanitizedStack,
    context: Object.keys(sanitizedContext).length > 0 ? sanitizedContext : undefined,
  };
}

/**
 * Format sanitized log as Markdown for GitHub issue
 */
export function formatLogForGitHub(log: SanitizedLog): string {
  let markdown = '### Bug Report\n\n';
  markdown += '**Context:**\n';
  markdown += `- Plugin Version: ${log.pluginVersion}\n`;
  markdown += `- Figma Version: ${log.figmaVersion}\n`;
  markdown += `- Timestamp: ${log.timestamp}\n\n`;
  
  markdown += '**Error:**\n';
  markdown += `- Type: ${log.errorType}\n`;
  markdown += `- Message: ${log.errorMessage}\n\n`;
  
  markdown += '**Stack Trace:**\n';
  markdown += '```\n';
  markdown += log.stackTrace;
  markdown += '\n```\n';

  if (log.context && Object.keys(log.context).length > 0) {
    markdown += '\n**Additional Context:**\n';
    markdown += '```json\n';
    markdown += JSON.stringify(log.context, null, 2);
    markdown += '\n```\n';
  }

  return markdown;
}
