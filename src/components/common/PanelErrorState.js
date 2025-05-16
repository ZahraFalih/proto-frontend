import React from 'react';
import '../../styles/PanelErrorState.css';

/**
 * Component to display an error state in dashboard panels with retry functionality
 */
const PanelErrorState = ({ 
  message = 'Failed to load data.', 
  retryFunction = null,
  errorType = 'general' // 'general', 'network', 'timeout', 'server'
}) => {
  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return '🌐';
      case 'timeout':
        return '⏱️';
      case 'server':
        return '🖥️';
      default:
        return '⚠️';
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'network':
        return 'Connection Error';
      case 'timeout':
        return 'Request Timed Out';
      case 'server':
        return 'Server Error';
      default:
        return 'Error Loading Data';
    }
  };

  return (
    <div className="panel-error-state">
      <div className="panel-error-icon">{getErrorIcon()}</div>
      <h4 className="panel-error-title">{getErrorTitle()}</h4>
      <p className="panel-error-message">{message}</p>
      {retryFunction && (
        <button 
          className="panel-error-retry-button" 
          onClick={retryFunction}
        >
          Reload Panel
        </button>
      )}
    </div>
  );
};

export default PanelErrorState; 