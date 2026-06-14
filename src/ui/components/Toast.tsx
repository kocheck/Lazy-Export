/**
 * Toast Notification Component
 *
 * Displays non-fatal error messages with option to report bugs
 */

import React, { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import { buildBugReportMarkdown, BUG_REPORT_ISSUE_URL } from '../utils/bugReporting';
import './Toast.css';

export interface ToastProps {
  message: string;
  type: 'error' | 'success' | 'info';
  error?: Error;
  metadata?: { iosContentsJson?: string };
  onClose: () => void;
}

const COPIED = 'Copied!';
const COPY_FAILED = 'Copy failed — select and copy manually';

export const Toast: React.FC<ToastProps> = ({ message, type, error, metadata, onClose }) => {
  const [status, setStatus] = useState<string | null>(null);

  const copyDebugInfo = () => {
    if (!error) return;

    const markdown = buildBugReportMarkdown(error, {
      component: 'Plugin',
      message,
    });

    copyToClipboard(markdown)
      .then(() => setStatus(COPIED))
      .catch(() => setStatus(COPY_FAILED));
  };

  const copyContents = () => {
    if (!metadata?.iosContentsJson) return;
    copyToClipboard(metadata.iosContentsJson)
      .then(() => setStatus(COPIED))
      .catch(() => setStatus(COPY_FAILED));
  };

  const reportIssue = () => {
    parent.postMessage(
      { pluginMessage: { type: 'open-external-url', url: BUG_REPORT_ISSUE_URL } },
      '*'
    );
  };

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__content">
        <div className="toast__icon">
          {type === 'error' && '❌'}
          {type === 'success' && '✅'}
          {type === 'info' && 'ℹ️'}
        </div>
        <div className="toast__message">{message}</div>
        <button className="toast__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {metadata?.iosContentsJson && (
          <button className="toast__action-btn" onClick={copyContents}>
            Copy Contents.json
          </button>
        )}
      </div>
      {type === 'error' && error && (
        <div className="toast__actions">
          <button className="toast__action" onClick={copyDebugInfo}>
            📋 Copy Debug Info
          </button>
          <button className="toast__action" onClick={reportIssue}>
            🐛 Report Issue
          </button>
        </div>
      )}
      {status && (
        <div className="toast__status" role="status" aria-live="polite">
          {status}
        </div>
      )}
    </div>
  );
};
