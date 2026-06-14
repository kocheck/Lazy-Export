import { describe, it, expect } from 'vitest';
import { buildBugReportMarkdown, BUG_REPORT_ISSUE_URL } from './bugReporting';

describe('bugReporting', () => {
  it('exposes the GitHub issue URL', () => {
    expect(BUG_REPORT_ISSUE_URL).toContain('github.com/kocheck/Lazy-Export/issues/new');
  });

  it('builds sanitized GitHub markdown from an error and context', () => {
    const error = new Error('Boom at file/ABCDEFGHIJKLMNOPQRSTUV');
    const markdown = buildBugReportMarkdown(error, {
      component: 'Plugin',
      message: 'Something failed',
    });

    expect(markdown).toContain('### Bug Report');
    expect(markdown).toContain('Plugin Version: 2.0.0');
    expect(markdown).not.toContain('ABCDEFGHIJKLMNOPQRSTUV');
  });

  it('includes provided additional context keys', () => {
    const error = new Error('Boom');
    const markdown = buildBugReportMarkdown(error, { errorBoundary: true });
    expect(markdown).toContain('errorBoundary');
  });
});
