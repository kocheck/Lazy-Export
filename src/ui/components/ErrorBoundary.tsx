/**
 * Error Boundary Component
 *
 * Catches React errors and provides a user-friendly interface
 * for reporting bugs with sanitized debug information.
 */

import React, { Component, ReactNode } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import { buildBugReportMarkdown, BUG_REPORT_ISSUE_URL, COPY_SUCCESS_MSG, COPY_FAILURE_MSG } from '../utils/bugReporting';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  copyStatus: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copyStatus: null,
    };
  }

  static getDerivedStateFromError(_: Error): Partial<State> {
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

    const markdown = buildBugReportMarkdown(error, {
      component: 'UI',
      errorBoundary: true,
    });

    copyToClipboard(markdown)
      .then(() => this.setState({ copyStatus: COPY_SUCCESS_MSG }))
      .catch(() => this.setState({ copyStatus: COPY_FAILURE_MSG }));
  };

  reportIssue = () => {
    parent.postMessage(
      { pluginMessage: { type: 'open-external-url', url: BUG_REPORT_ISSUE_URL } },
      '*'
    );
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

            {this.state.copyStatus && (
              <div className="error-boundary__status" role="status" aria-live="polite">
                {this.state.copyStatus}
              </div>
            )}

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
