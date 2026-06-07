'use client';

import { Component, ReactNode } from 'react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: ReactNode;
  variant?: 'page' | 'section' | 'inline';
  title?: string;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { variant = 'page', title, showDetails = false } = this.props;
    const isDev = process.env.NODE_ENV === 'development';

    if (variant === 'inline') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 text-sm text-red-700 dark:text-red-400">
          <span>⚠️</span>
          <span>{title || 'This component failed to load.'}</span>
          <button
            onClick={this.handleReset}
              className="ml-auto text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
        </div>
      );
    }

    if (variant === 'section') {
      return (
        <div className="bg-white dark:bg-[#0f1120] rounded-2xl border border-red-200 dark:border-red-400/20 p-8 text-center shadow-sm">
          <p className="text-3xl mb-3">⚠️</p>
          <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">
            {title || 'Something went wrong'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            This section failed to load. Your data is safe.
          </p>
          {isDev && this.state.error && (
            <pre className="text-left text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-3 mb-4 overflow-auto max-h-32 text-red-600 dark:text-red-400">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 bg-primary/10 dark:bg-primary/15 text-primary rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/20 transition"
          >
            🔄 Try again
          </button>
        </div>
      );
    }

    // Page variant
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08091a] px-4">
        <div className="max-w-md w-full text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-400/15 dark:to-orange-400/15 border border-red-200 dark:border-red-400/20 flex items-center justify-center text-4xl">
              💥
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-[#f0f0ff] mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
            An unexpected error occurred. Your data is safe — this is a display
            issue only. Try refreshing the page or go back to safety.
          </p>

          {isDev && this.state.error && (
            <div className="text-left mb-6 bg-red-50 dark:bg-red-400/8 border border-red-200 dark:border-red-400/20 rounded-xl p-4">
              <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1 uppercase tracking-wide">
                Dev mode — error details
              </p>
              <pre className="text-xs text-red-600 dark:text-red-300 overflow-auto max-h-40 leading-relaxed">
                {this.state.error.stack || this.state.error.message}
              </pre>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:opacity-90 transition"
            >
              🔄 Try again
            </button>
            <Link
              href="/"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-gray-100 dark:bg-white/8 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-white/12 transition"
            >
              🏠 Home
            </Link>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
            If this keeps happening,{' '}
            <Link href="/contact" className="text-primary hover:underline" onClick={this.handleReset}>
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }
}