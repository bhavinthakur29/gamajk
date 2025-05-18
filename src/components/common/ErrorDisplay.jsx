import React from 'react';
import './ErrorDisplay.css';

const ErrorDisplay = ({ error, onRetry }) => {
    return (
        <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3 className="error-title">Something went wrong</h3>
            <p className="error-message">{error.message || 'An unknown error occurred'}</p>
            {onRetry && (
                <button className="retry-button" onClick={onRetry}>
                    Try Again
                </button>
            )}
        </div>
    );
};

export default ErrorDisplay; 