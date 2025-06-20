import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could also log the error to an error reporting service here
    // Example: logErrorToMyService(error, errorInfo);
  }

  handleRetry = () => {
    // Reset the error state which will re-render the children
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex items-center justify-center mb-4 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-center mb-2">Oups, quelque chose s'est mal passé</h1>
            <p className="text-gray-600 text-center mb-4">
              Une erreur inattendue s'est produite. Nous sommes désolés pour ce désagrément.
            </p>
            {this.state.error && (
              <div className="bg-red-50 p-3 rounded mb-4 overflow-auto max-h-40">
                <p className="text-sm text-red-700 font-mono">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <div className="flex justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;