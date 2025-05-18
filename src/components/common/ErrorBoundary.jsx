import React, { Component } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

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
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to an error reporting service
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
        this.setState({ errorInfo });

        // You could also log to a service like Sentry here
        // if (window.Sentry) {
        //     window.Sentry.captureException(error);
        // }
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Render fallback UI
            return (
                <div className="container my-5">
                    <div className="card border-danger">
                        <div className="card-header bg-danger text-white">
                            <FaExclamationTriangle className="me-2" />
                            <span className="fw-bold">Application Error</span>
                        </div>
                        <div className="card-body">
                            <h5 className="card-title">Something went wrong</h5>
                            <p className="card-text">
                                We apologize for the inconvenience. The application encountered an unexpected error.
                            </p>

                            <div className="alert alert-secondary overflow-auto" style={{ maxHeight: '200px' }}>
                                <p className="mb-1 fw-bold">Error details:</p>
                                <pre className="text-danger mb-0">
                                    {this.state.error?.toString() || 'Unknown error'}
                                </pre>
                                {this.state.errorInfo && (
                                    <details className="mt-3">
                                        <summary>Component Stack</summary>
                                        <pre className="text-secondary small mt-2">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>

                            <div className="d-flex gap-2 mt-3">
                                <button
                                    className="btn btn-primary"
                                    onClick={this.handleReload}
                                >
                                    Reload Page
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={this.handleGoHome}
                                >
                                    Go to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // If no error, render children normally
        return this.props.children;
    }
}

export default ErrorBoundary; 