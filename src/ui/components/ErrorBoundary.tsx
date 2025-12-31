/**
 * Error Boundary Component
 * 
 * Catches React errors and provides a user-friendly interface
 * for reporting bugs with sanitized debug information.
 */

import React, { Component, ReactNode } from 'react';
import { sanitizeLog, formatLogForGitHub } from '../../shared/sanitizeLog';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  copyDebugInfo = () => {
    const { error } = this.state;
    if (!error) return;

    const sanitized = sanitizeLog({
      error,
      pluginVersion: '2.0.0',
      figmaVersion: (window as any).figma?.version || 'Unknown',
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      additionalContext: {
        component: 'UI',
        errorBoundary: true,
      },
    });

    const markdown = formatLogForGitHub(sanitized);

    // Copy to clipboard
    navigator.clipboard.writeText(markdown).then(() => {
      alert('Debug info copied to clipboard! You can now paste it into a GitHub issue.');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      // Fallback: show in a text area
      const textarea = document.createElement('textarea');
      textarea.value = markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Debug info copied to clipboard! You can now paste it into a GitHub issue.');
    });
  };

  reportIssue = () => {
    const issueUrl = 'https://github.com/kocheck/Lazy-Export/issues/new?title=%5BBug%5D%3A%20Runtime%20Error%20in%20v2.0';
    window.open(issueUrl, '_blank');
  };

  reload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">⚠️</div>
            <h2 className="error-boundary__title">Something went wrong</h2>
            <p className="error-boundary__description">
              The plugin encountered an unexpected error. You can help us fix this by reporting it.
            </p>
            
            <div className="error-boundary__actions">
              <button
                className="error-boundary__button error-boundary__button--primary"
                onClick={this.copyDebugInfo}
              >
                📋 Copy Debug Info
              </button>
              <button
                className="error-boundary__button error-boundary__button--secondary"
                onClick={this.reportIssue}
              >
                🐛 Report on GitHub
              </button>
              <button
                className="error-boundary__button error-boundary__button--secondary"
                onClick={this.reload}
              >
                🔄 Reload Plugin
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-boundary__details">
                <summary>Error Details (dev only)</summary>
                <pre className="error-boundary__stack">
                  {this.state.error?.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
