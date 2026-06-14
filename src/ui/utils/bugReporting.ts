import { sanitizeLog, formatLogForGitHub } from '../../shared/sanitizeLog';

export const BUG_REPORT_ISSUE_URL =
  'https://github.com/kocheck/Lazy-Export/issues/new?title=%5BBug%5D%3A%20Runtime%20Error%20in%20v2.0';

const PLUGIN_VERSION = '2.0.0';

export function buildBugReportMarkdown(
  error: Error,
  additionalContext?: Record<string, unknown>
): string {
  const sanitized = sanitizeLog({
    error,
    pluginVersion: PLUGIN_VERSION,
    figmaVersion: (window as unknown as { figma?: { version?: string } }).figma?.version || 'Unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    timestamp: Date.now(),
    additionalContext,
  });

  return formatLogForGitHub(sanitized);
}
