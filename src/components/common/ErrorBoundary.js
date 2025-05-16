import React, { Component } from 'react';

/**
 * Error Boundary component to catch errors in child components
 * and display a fallback UI instead of crashing the whole app
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // You can render any custom fallback UI
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(error, this.reset)
          : fallback;
      }

      return (
        <div className="error-boundary-fallback">
          <h3>Something went wrong</h3>
          <p>{error?.message || 'An unexpected error occurred'}</p>
          <button onClick={this.reset}>Try Again</button>
        </div>
      );
    }

    return children;
  }
} 