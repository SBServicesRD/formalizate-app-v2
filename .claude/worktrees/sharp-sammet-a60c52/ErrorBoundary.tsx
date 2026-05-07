import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-premium p-8 text-center">
            <h1 className="text-2xl font-bold text-sbs-blue mb-4">Algo salió mal</h1>
            <p className="text-text-secondary mb-6">
              Ocurrió un error al cargar la aplicación. Por favor, recarga la página.
            </p>
            {this.state.error && (
              <details className="text-left mb-4 p-4 bg-premium-surface-subtle rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-text-secondary mb-2">
                  Detalles del error
                </summary>
                <pre className="text-xs text-text-tertiary overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-sbs-blue text-white py-3 px-6 rounded-lg font-medium hover:bg-sbs-blue-light transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


