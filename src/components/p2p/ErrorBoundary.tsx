"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A1628] text-white p-6">
          <div className="max-w-md text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold mb-2">Une erreur est survenue</h1>
            <p className="text-sm text-white/60 mb-4">
              L&apos;application a rencontré une erreur inattendue. Rafraîchis la page ou
              contacte le support si le problème persiste.
            </p>
            <pre className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 overflow-auto max-h-32 text-left">
              {this.state.error?.message || "Unknown error"}
              {this.state.error?.stack ? "\n\n" + this.state.error.stack.slice(0, 500) : ""}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 rounded-lg gradient-success text-white text-sm font-semibold"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
