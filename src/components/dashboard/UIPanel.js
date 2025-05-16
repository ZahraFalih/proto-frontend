// components/dashboard/UIPanel.js
import React, { useEffect, useState, useCallback } from 'react';
import ErrorBoundary from '../common/ErrorBoundary';
import PanelErrorState from '../common/PanelErrorState';
import { UISkeleton } from '../common/Skeleton';
import '../../styles/UIPanel.css';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';
import { panelStatusStore, PANEL_STATUS, PANEL_TYPES } from '../../utils/panelStatus';

export default function UIPanel({ pageId, onSummaryReady }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  /* ───────── Data Fetch Function ────────── */
  const fetchUIData = useCallback(async () => {
    if (!pageId) return;

    const cacheKey = `ui_eval_page_${pageId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCategories(parsed || []);
        setError(null);
        setLoading(false);
        
        // Notify parent of cached UI evaluation
        if (typeof onSummaryReady === 'function') {
          onSummaryReady(parsed);
        }
        
        // Update panel status
        panelStatusStore.setPanelStatus(pageId, PANEL_TYPES.UI, PANEL_STATUS.SUCCESS);
        
        console.log(`[UIPanel] Loaded from cache for pageId=${pageId}`);
        return;
      } catch {
        console.warn('[UIPanel] Corrupted cache, ignoring.');
      }
    }

    // Update status to loading
    panelStatusStore.setPanelStatus(pageId, PANEL_TYPES.UI, PANEL_STATUS.LOADING);

    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const evalUrl = buildApiUrl(API_ENDPOINTS.AI.EVALUATE.UI(pageId, timestamp));
    console.log(`[UIPanel] Fetching: ${evalUrl}`);

    setLoading(true);
    setError(null);
    setCategories([]);

    try {
      const response = await fetch(evalUrl, { headers: { Accept: 'application/json' } });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      let evaluation = data.evaluation;
      if (typeof evaluation === 'string') {
        try {
          evaluation = JSON.parse(evaluation);
        } catch (e) {
          console.error('[UIPanel] Failed to parse evaluation string:', e);
          throw new Error('Invalid evaluation data format');
        }
      }

      if (!evaluation?.categories) {
        throw new Error('No categories in response');
      }

      // Process categories, ensuring evidence is handled as a string
      const categoriesArray = Array.isArray(evaluation.categories) 
        ? evaluation.categories.map(cat => ({
            name: cat.name || '',
            score: cat.score || 0,
            evidence: cat.evidence || ''
          }))
        : [];

      setCategories(categoriesArray);
      sessionStorage.setItem(cacheKey, JSON.stringify(categoriesArray));
      
      // Update panel status
      panelStatusStore.setPanelStatus(pageId, PANEL_TYPES.UI, PANEL_STATUS.SUCCESS);
      
      // Notify parent of fresh UI evaluation
      if (typeof onSummaryReady === 'function') {
        onSummaryReady(categoriesArray);
      }
      
      console.log(`[UIPanel] Cached response for pageId=${pageId}, categories:`, categoriesArray);
    } catch (err) {
      console.error('[UIPanel] Fetch failed:', err);
      const errorMsg = err.message || 'Failed to load UI evaluation data.';
      setError(errorMsg);
      setCategories([]); // Ensure categories is an empty array on error
      
      // Update panel status
      panelStatusStore.setPanelStatus(pageId, PANEL_TYPES.UI, PANEL_STATUS.ERROR, errorMsg);
    } finally {
      setLoading(false);
    }
  }, [pageId, onSummaryReady]);

  /* ───────── Retry handler ────────── */
  const handleRetry = useCallback(() => {
    console.log('[UIPanel] Manual retry triggered');
    setRetryCount(prev => prev + 1);
    panelStatusStore.resetPanelErrorCount(pageId, PANEL_TYPES.UI);
    fetchUIData();
  }, [pageId, fetchUIData]);

  /* ───────── Auto retry effect ────────── */
  useEffect(() => {
    // Check if we should auto-retry
    if (error && panelStatusStore.shouldAutoRetry(pageId, PANEL_TYPES.UI)) {
      const errorCount = panelStatusStore.getPanelErrorCount(pageId, PANEL_TYPES.UI);
      console.log(`[UIPanel] Auto-retry attempt ${errorCount}/3`);
      
      // Auto-retry with exponential backoff
      const retryDelay = Math.min(2000 * Math.pow(2, errorCount - 1), 10000);
      
      const retryTimer = setTimeout(() => {
        console.log(`[UIPanel] Executing auto-retry after ${retryDelay}ms`);
        fetchUIData();
      }, retryDelay);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, pageId, fetchUIData]);

  /* ───────── Initial data load ────────── */
  useEffect(() => {
    if (!pageId) return;
    fetchUIData();
  }, [pageId, fetchUIData]);

  // Tab clicks
  const handleCategoryClick = (categoryName) => {
    setActiveCategory(activeCategory === categoryName ? null : categoryName);
  };

  const formatCategoryName = (name) => {
    return name.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getActiveCategory = () => {
    const category = categories.find(c => c.name === activeCategory);
    return category || { evidence: '' };
  };

  /* ───────── Error fallback ────────── */
  const renderErrorFallback = (error, reset) => (
    <PanelErrorState 
      message={error?.message || 'Failed to load UI evaluation data.'}
      retryFunction={handleRetry}
      errorType="server"
    />
  );

  return (
    <ErrorBoundary fallback={renderErrorFallback}>
      <div className="panel-container">
        <div className="panel-header">User Interface Evaluation</div>

        {loading && <UISkeleton />}
        
        {error && !loading && (
          <PanelErrorState
            message={error}
            retryFunction={handleRetry}
            errorType="server"
          />
        )}

        {!loading && !error && (
          <div className="ui-eval-body">
            {/* Left column: ratings */}
            <div className="ui-categories-container">
              {Array.isArray(categories) && categories.map(({ name, score }) => (
                <div 
                  key={name} 
                  className={`ui-category ${activeCategory === name ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(name)}
                >
                  <span className="category-name">{formatCategoryName(name)}</span>
                  <div className="rating-container">
                    <div className="rating-bar">
                      <div 
                        className="rating-fill" 
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="rating-value">{score}/10</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right column: evidence */}
            <div className="ui-evidence-container">
              {activeCategory ? (
                <div className="ui-evidence">
                  <h3>{formatCategoryName(activeCategory)}</h3>
                  <div className="ui-evidence-content">
                    <div className="evidence-item">
                      <p>{getActiveCategory().evidence}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ui-evidence-placeholder">
                  Select a category to see detailed analysis
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
