/**
 * Panel status tracking utilities for the dashboard
 */

// Status constants
export const PANEL_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success'
};

// Panel types
export const PANEL_TYPES = {
  WEB_METRICS: 'web_metrics',
  UBA: 'uba',
  UI: 'ui',
  CHAT: 'chat'
};

// Create the panel status store
const createPanelStatusStore = () => {
  // Map to store panel statuses by pageId and panelType
  const statusMap = new Map();
  
  // List of subscribers
  const subscribers = [];
  
  // Initial error counts - track consecutive errors
  const errorCounts = {};

  // Helper to generate a key for the map
  const getKey = (pageId, panelType) => `${pageId}:${panelType}`;
  
  // Set panel status
  const setPanelStatus = (pageId, panelType, status, error = null) => {
    if (!pageId || !panelType) return;
    
    const key = getKey(pageId, panelType);
    const timestamp = Date.now();
    
    // Track error counts
    if (status === PANEL_STATUS.ERROR) {
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    } else {
      errorCounts[key] = 0;
    }
    
    statusMap.set(key, { 
      status, 
      error, 
      timestamp,
      errorCount: errorCounts[key] 
    });
    
    // Notify subscribers
    notifySubscribers();
  };
  
  // Get panel status
  const getPanelStatus = (pageId, panelType) => {
    if (!pageId || !panelType) return null;
    
    const key = getKey(pageId, panelType);
    return statusMap.get(key) || { 
      status: PANEL_STATUS.IDLE, 
      error: null, 
      timestamp: 0,
      errorCount: 0 
    };
  };
  
  // Get panel error count
  const getPanelErrorCount = (pageId, panelType) => {
    if (!pageId || !panelType) return 0;
    
    const key = getKey(pageId, panelType);
    return errorCounts[key] || 0;
  };
  
  // Check if panel should auto-retry
  const shouldAutoRetry = (pageId, panelType) => {
    if (!pageId || !panelType) return false;
    
    const key = getKey(pageId, panelType);
    const status = statusMap.get(key);
    
    // Only retry if in error state and error count is less than 3
    return status && 
           status.status === PANEL_STATUS.ERROR && 
           status.errorCount < 3;
  };
  
  // Reset panel error count
  const resetPanelErrorCount = (pageId, panelType) => {
    if (!pageId || !panelType) return;
    
    const key = getKey(pageId, panelType);
    errorCounts[key] = 0;
    
    // Update the status object if it exists
    const status = statusMap.get(key);
    if (status) {
      statusMap.set(key, { ...status, errorCount: 0 });
      notifySubscribers();
    }
  };
  
  // Subscribe to status changes
  const subscribe = (callback) => {
    if (typeof callback !== 'function') return () => {};
    
    subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = subscribers.indexOf(callback);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    };
  };
  
  // Notify all subscribers
  const notifySubscribers = () => {
    subscribers.forEach(callback => callback(statusMap));
  };
  
  // Clear all statuses for a pageId
  const clearPageStatuses = (pageId) => {
    if (!pageId) return;
    
    // Find all keys for this pageId
    const keysToRemove = [];
    statusMap.forEach((value, key) => {
      if (key.startsWith(`${pageId}:`)) {
        keysToRemove.push(key);
      }
    });
    
    // Remove entries and error counts
    keysToRemove.forEach(key => {
      statusMap.delete(key);
      delete errorCounts[key];
    });
    
    notifySubscribers();
  };
  
  // Get all statuses for a pageId
  const getPageStatuses = (pageId) => {
    if (!pageId) return {};
    
    const result = {};
    
    Object.values(PANEL_TYPES).forEach(panelType => {
      const key = getKey(pageId, panelType);
      result[panelType] = statusMap.get(key) || { 
        status: PANEL_STATUS.IDLE, 
        error: null, 
        timestamp: 0,
        errorCount: 0  
      };
    });
    
    return result;
  };
  
  return {
    setPanelStatus,
    getPanelStatus,
    getPanelErrorCount,
    shouldAutoRetry,
    resetPanelErrorCount,
    subscribe,
    clearPageStatuses,
    getPageStatuses
  };
};

// Export a singleton instance
export const panelStatusStore = createPanelStatusStore(); 