/**
 * Toast Notification Component
 *
 * Displays non-fatal error messages with option to report bugs
 */

import React from 'react';
import { sanitizeLog, formatLogForGitHub } from '../../shared/sanitizeLog';
import { copyToClipboard } from '../utils/clipboard';
import './Toast.css';

export interface ToastProps {
  message: string;
  type: 'error' | 'success' | 'info';
  error?: Error;
  metadata?: { iosContentsJson?: string };
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, error, metadata, onClose }) => {
  const copyDebugInfo = () => {
    if (!error) return;

    const sanitized = sanitizeLog({
      error,
      pluginVersion: '2.0.0',
      figmaVersion: (window as any).figma?.version || 'Unknown',
      timestamp: Date.now(),
      additionalContext: {
        component: 'Plugin',
        message,
      },
    });

    const markdown = formatLogForGitHub(sanitized);

    copyToClipboard(markdown).then(() => {
      alert('Debug info copied! You can paste it into a GitHub issue.');
    });
  };

  const reportIssue = () => {
    const issueUrl = 'https://github.com/kocheck/Lazy-Export/issues/new?title=%5BBug%5D%3A%20Runtime%20Error%20in%20v2.0';
    window.open(issueUrl, '_blank');
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
        <button
          className="toast__action-btn"
          onClick={() => {
            copyToClipboard(metadata.iosContentsJson!);
            alert('Contents.json copied to clipboard!');
          }}
        >
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
    </div>
  );
};
