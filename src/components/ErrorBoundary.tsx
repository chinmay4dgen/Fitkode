import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Global React Error Boundary for Fitkode.
 * Prevents any single malformed record or transient component error from white-screening the app,
 * and provides a one-click cache repair + reload action that preserves user authentication.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  declare public props: Readonly<Props>;
  declare public setState: React.Component<Props, State>['setState'];

  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Fitkode ErrorBoundary] Caught runtime error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  private handleRepairCacheAndReload = () => {
    try {
      // Clear cached data registries that might contain malformed JSON while preserving Supabase auth tokens
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith('fitkode_members_registry') ||
            k.startsWith('fk_meal_plans') ||
            k.startsWith('fk_workout_plans') ||
            k.startsWith('fitkode_weekly_entries_'))
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    this.setState({ hasError: false, errorMessage: '' });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-natural-oat">
          <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-lg p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">
              Something interrupted this view
            </h2>
            <p className="text-sm text-stone-600 mb-4 leading-relaxed">
              Your account and cloud data are safe. A temporary display error occurred while rendering this section.
            </p>
            {this.state.errorMessage && (
              <div className="text-xs font-mono text-stone-500 bg-stone-50 border border-stone-200 rounded-lg p-2.5 mb-5 text-left truncate">
                {this.state.errorMessage}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-dark-green text-white text-sm font-semibold hover:bg-emerald-900 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload View
              </button>
              <button
                type="button"
                onClick={this.handleRepairCacheAndReload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Repair Local Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
