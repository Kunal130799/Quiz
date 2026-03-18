import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-center">
          <div className="card" style={{ maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛠️</div>
            <h2 style={{ marginBottom: '12px' }}>Something went wrong.</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              The AI might have had a little too much fun. Try refreshing the page.
            </p>
            <button className="btn btn-primary btn-full" onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
