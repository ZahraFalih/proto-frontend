// components/dashboard/UBAPanel.js
import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import ErrorBoundary from '../common/ErrorBoundary';
import PanelErrorState from '../common/PanelErrorState';
import { UBASkeleton } from '../common/Skeleton';
import '../../styles/UBAPanel.css';
import '../../styles/Dashboard.css';
import { getToken } from '../../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';
import { panelStatusStore, PANEL_STATUS, PANEL_TYPES } from '../../utils/panelStatus';

export default function UBAPanel({ pageId, onSummaryReady }) {
  const [formulation, setFormulation] = useState('');
  const [observationSections, setObservationSections] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeObservation, setActiveObservation] = useState(null);
  const [expandedSolution, setExpandedSolution] = useState(null);
  const [pinnedObservation, setPinnedObservation] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  /* ─── Cache Helpers ───────────────────────────────────────────────── */
  const cacheKey = pageId ? `uba_cache_${pageId}` : null;
  
  const hydrateFromCache = () => {
    if (!cacheKey) return false;
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return false;
    
    try {
      const { formulation, observationSections, solutions } = JSON.parse(cached);
      setFormulation(formulation);
      setObservationSections(observationSections);
      setSolutions(solutions);
      
      // Notify parent of cached UBA analysis
      if (typeof onSummaryReady === 'function') {
        onSummaryReady(formulation);
      }
      
      // Update panel status
      panelStatusStore.setPanelStatus(pageId, PANEL_TYPES.UBA, PANEL_STATUS.SUCCESS);
      
      return true;
    } catch {
      sessionStorage.removeItem(cacheKey); // corrupted cache
      return false;
    }
  };
  
  const persistToCache = (form, sections, sols) => {
    if (!cacheKey) return;
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ formulation: form, observationSections: sections, solutions: sols })
    );
  };

  /* ─── Data Fetch Function ───────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    console.log('[UBAPanel] Starting fresh data fetch for pageId:', pageId);
    
    // Update status to loading
    panelStatusStore.setPanelStatus(pageId, PANEL_TYPES.UBA, PANEL_STATUS.LOADING);
    
    setLoading(true);
    setError(null);

    try {
      // Get auth token
      const token = getToken();
      console.log('[UBAPanel] Auth token retrieved:', token ? 'Token found' : 'Token missing');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Append a cache-busting query parameter 
      const timestamp = Date.now();
      
      // ── 1) Evaluate UBA (must be called first) ─────────────────────────────────────
      const evalUrl = buildApiUrl(API_ENDPOINTS.AI.EVALUATE.UBA(pageId, timestamp));
      console.log('[UBAPanel] Starting UBA evaluation:', evalUrl);
      
      try {
        const evaluateResponse = await fetch(evalUrl, { headers });
        console.log('[UBAPanel] UBA evaluation response status:', evaluateResponse.status);
        
        if (!evaluateResponse.ok) {
          const errorText = await evaluateResponse.text();
          console.error('[UBAPanel] UBA evaluation error response:', errorText);
          throw new Error(`UBA evaluation failed: ${evaluateResponse.status} - ${errorText}`);
        }
        
        await evaluateResponse.json();
        console.log('[UBAPanel] UBA evaluation completed');
      } catch (evalError) {
        console.error('[UBAPanel] UBA evaluation error:', evalError);
        const errorMsg = 'Failed to evaluate UBA data.';
        setError(errorMsg);
        panelStatusStore.setPanelStatus(pageId, PANEL_TYPES.UBA, PANEL_STATUS.ERROR, errorMsg);
        setLoading(false);
        return;
      }

      // ── 2) Web Search (must be called after evaluation) ─────────────────────────────────────
      const searchUrl = buildApiUrl(API_ENDPOINTS.AI.WEB_SEARCH(pageId, timestamp));
      console.log('[UBAPanel] Fetching web search results:', searchUrl);
      
      let searchData = { results: [] };
      try {
        const searchResponse = await fetch(searchUrl, { headers });
        console.log('[UBAPanel] Web search response status:', searchResponse.status);
        
        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error('[UBAPanel] Web search error response:', errorText);
          console.warn('[UBAPanel] Continuing with empty search results');
        } else {
          searchData = await searchResponse.json();
          console.log('[UBAPanel] Received web search data:', {
            hasResults: !!searchData.results,
            resultCount: searchData.results?.length
          });
        }
      } catch (searchError) {
        console.warn('[UBAPanel] Web search error, continuing with empty results:', searchError);
      }

      // Process solutions with their associated problem
      const problemSolutions = searchData.results || [];
      setSolutions(problemSolutions);

      // ── 3) UBA formulation (must be called last) ─────────────────────────────────────────────
      const formUrl = buildApiUrl(API_ENDPOINTS.AI.FORMULATE_UBA(pageId, timestamp));
      console.log('[UBAPanel] Fetching UBA formulation:', formUrl);
      
      try {
        const formResponse = await fetch(formUrl, { headers });
        console.log('[UBAPanel] Formulation response status:', formResponse.status);
        
        if (!formResponse.ok) {
          const errorText = await formResponse.text();
          console.error('[UBAPanel] Formulation error response:', errorText);
          throw new Error(`UBA formulation fetch failed: ${formResponse.status} - ${errorText}`);
        }
        
        const data = await formResponse.json();
        console.log('[UBAPanel] Received formulation data:', {
          hasFormulation: !!data.uba_formulation,
          observationCount: data.uba_formulation ? Object.keys(data.uba_formulation).length : 0
        });
        
        if (!data.uba_formulation) {
          throw new Error('No UBA formulation data received');
        }
        
        // Process observations
        const observations = data.uba_formulation;
        let combinedText = '';
        let sectionData = [];
        
        Object.entries(observations).forEach(([key, text], index) => {
          if (!text) {
            console.log(`[UBAPanel] Skipping empty observation ${index + 1}`);
            return;
          }
          
          const startPos = combinedText.length;
          combinedText += text + ' ';
          const endPos = combinedText.length - 1;
          
          sectionData.push({
            observationNumber: index + 1,
            startPos,
            endPos,
            text
          });
        });
        
        const formText = combinedText.trim();
        
        // Update state
        setFormulation(formText);
        setObservationSections(sectionData);
        
        // Cache the results
        persistToCache(formText, sectionData, problemSolutions);

        // Update panel status
        panelStatusStore.setPanelStatus(pageId, PANEL_TYPES.UBA, PANEL_STATUS.SUCCESS);

        // Notify parent of UBA analysis
        if (typeof onSummaryReady === 'function') {
          onSummaryReady(formText);
        }
        
        console.log('[UBAPanel] Successfully completed all requests and updated state:', {
          formulationLength: formText.length,
          sectionsCount: sectionData.length,
          solutionsCount: problemSolutions.length
        });
      } catch (formError) {
        console.error('[UBAPanel] Error fetching formulation:', formError);
        const errorMsg = 'Failed to generate UBA insights.';
        setError(errorMsg);
        panelStatusStore.setPanelStatus(pageId, PANEL_TYPES.UBA, PANEL_STATUS.ERROR, errorMsg);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('[UBAPanel] Error in data fetch:', err);
      const errorMsg = err.message || 'Failed to analyze user behavior data.';
      setError(errorMsg);
      panelStatusStore.setPanelStatus(pageId, PANEL_TYPES.UBA, PANEL_STATUS.ERROR, errorMsg);
    } finally {
      console.log('[UBAPanel] Request chain completed');
      setLoading(false);
    }
  }, [pageId, onSummaryReady]);

  /* ─── Retry handler ───────────────────────────────────────────────── */
  const handleRetry = useCallback(() => {
    console.log('[UBAPanel] Manual retry triggered');
    setRetryCount(prev => prev + 1);
    panelStatusStore.resetPanelErrorCount(pageId, PANEL_TYPES.UBA);
    fetchData();
  }, [pageId, fetchData]);

  /* ─── Auto retry effect ───────────────────────────────────────────── */
  useEffect(() => {
    // Check if we should auto-retry
    if (error && panelStatusStore.shouldAutoRetry(pageId, PANEL_TYPES.UBA)) {
      const errorCount = panelStatusStore.getPanelErrorCount(pageId, PANEL_TYPES.UBA);
      console.log(`[UBAPanel] Auto-retry attempt ${errorCount}/3`);
      
      // Auto-retry with exponential backoff
      const retryDelay = Math.min(2000 * Math.pow(2, errorCount - 1), 10000);
      
      const retryTimer = setTimeout(() => {
        console.log(`[UBAPanel] Executing auto-retry after ${retryDelay}ms`);
        fetchData();
      }, retryDelay);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, pageId, fetchData]);

  /* ─── Initial data load ───────────────────────────────────────────── */
  useEffect(() => {
    console.log('[UBAPanel] Component mounted/updated with pageId:', pageId);
    
    if (!pageId) {
      console.log('[UBAPanel] No pageId provided, skipping fetch');
      return;
    }

    // Try to load from cache first
    if (hydrateFromCache()) {
      console.log('[UBAPanel] Data loaded from cache');
      return;
    }
    
    // Fetch fresh data if cache miss
    fetchData();
    
    // Cleanup function
    return () => {
      console.log('[UBAPanel] Cleaning up component');
    };
  }, [pageId, fetchData]);

  const handleObservationHover = (observationNumber) => {
    console.log('[UBAPanel] Observation hover:', observationNumber);
    // Don't override a pinned observation with hover state
    if (pinnedObservation === null) {
      setActiveObservation(observationNumber);
    }
  };

  const handleObservationLeave = () => {
    console.log('[UBAPanel] Observation leave');
    // Only clear active observation if not pinned
    if (pinnedObservation === null) {
      setActiveObservation(null);
    }
  };
  
  const handleObservationClick = (observationNumber) => {
    console.log('[UBAPanel] Observation click:', observationNumber);
    // Toggle pinned state
    if (pinnedObservation === observationNumber) {
      setPinnedObservation(null);
      setActiveObservation(null);
    } else {
      setPinnedObservation(observationNumber);
      setActiveObservation(observationNumber);
      
      // Auto-expand the corresponding solution
      setExpandedSolution(observationNumber - 1);
    }
  };

  const toggleSolutionExpand = (problemIndex) => {
    setExpandedSolution(expandedSolution === problemIndex ? null : problemIndex);
  };

  const renderFormulation = () => {
    console.log('[UBAPanel] Rendering formulation, length:', formulation?.length);
    
    if (!formulation) {
      return null;
    }
    
    if (!observationSections || observationSections.length === 0) {
      return (
        <div className="uba-formulation-text">
          <ReactMarkdown>{formulation}</ReactMarkdown>
        </div>
      );
    }
    
    const segments = observationSections.map((section, index) => {
      const text = formulation.substring(section.startPos, section.endPos + 1);
      const isPinned = pinnedObservation === section.observationNumber;
      
      return (
        <span 
          key={index} 
          className={`uba-observation-segment ${isPinned ? 'uba-observation-pinned' : ''}`}
          data-observation-number={section.observationNumber}
          onMouseEnter={() => handleObservationHover(section.observationNumber)}
          onMouseLeave={handleObservationLeave}
          onClick={() => handleObservationClick(section.observationNumber)}
        >
          <ReactMarkdown>{text}</ReactMarkdown>
        </span>
      );
    });
    
    return <div className="uba-formulation-text">{segments}</div>;
  };

  const extractDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch (e) {
      return url;
    }
  };

  const renderSolutions = () => {
    console.log('[UBAPanel] Rendering solutions, count:', solutions?.length);
    
    if (!solutions || solutions.length === 0) {
      console.log('[UBAPanel] No solutions available to render');
      return <p>No resources available.</p>;
    }

    // Fallback for when we have solutions but they don't match expected format
    let hasValidSolutions = false;
    for (const problem of solutions) {
      if (problem.solutions && problem.solutions.length > 0) {
        hasValidSolutions = true;
        break;
      }
    }

    if (!hasValidSolutions) {
      console.log('[UBAPanel] No valid solutions found in data');
      return <p>No resources available.</p>;
    }

    return (
      <div className="uba-solutions-list">
        {solutions.map((problemSolution, problemIndex) => {
          const isActive = activeObservation === problemIndex + 1;
          const isExpanded = expandedSolution === problemIndex;
          console.log(`[UBAPanel] Rendering problem ${problemIndex + 1}, active:`, isActive);
          
          if (!problemSolution.solutions || problemSolution.solutions.length === 0) {
            console.log(`[UBAPanel] No solutions for problem ${problemIndex + 1}`);
            return null;
          }
          
          // Extract the problem title (first sentence from problem)
          const problemTitle = problemSolution.problem?.split('.')[0] + '.';
          
          return (
            <div 
              key={problemIndex} 
              className={`uba-solution-group ${isActive ? 'uba-solution-active' : ''} ${isExpanded ? 'uba-solution-expanded' : ''}`}
              data-problem-number={problemIndex + 1}
            >
              <div 
                className="uba-solution-header" 
                onClick={() => toggleSolutionExpand(problemIndex)}
              >
                <span className="uba-solution-number">{problemIndex + 1}</span>
                <h5 className="uba-solution-title">{problemTitle}</h5>
                <span className="uba-solution-toggle">
                  {isExpanded ? '−' : '+'}
                </span>
              </div>
              
              <div className="uba-solution-content">
                {problemSolution.solutions.map((solution, solutionIndex) => {
                  const domain = extractDomain(solution.source);
                  return (
                    <div key={solutionIndex} className="uba-solution-item">
                      <a 
                        href={solution.source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="uba-solution-link"
                      >
                        <span className="uba-solution-domain">{domain}</span>
                        <span className="uba-solution-summary">{solution.summary}</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ─────────── error fallback ─────────── */
  const renderErrorFallback = (error, reset) => (
    <PanelErrorState 
      message={error?.message || 'Failed to load user behavior data.'}
      retryFunction={handleRetry}
      errorType="server"
    />
  );

  console.log('[UBAPanel] Rendering component. Loading:', loading, 'Error:', error, 
    'Has formulation:', !!formulation, 'Has solutions:', solutions?.length > 0);
  
  return (
    <ErrorBoundary fallback={renderErrorFallback}>
      <div className="panel-container">
        <div className="panel-header">User Behaviour Analytics</div>
        <div className="panel-subtitle">We analyzed how users interact with your website and identified key behavior patterns.</div>

        {loading && <UBASkeleton />}
        
        {error && !loading && (
          <PanelErrorState
            message={error}
            retryFunction={handleRetry}
            errorType="server"
          />
        )}

        {!loading && !error && (
          <div className="uba-content-container">
            <div className="uba-formulation-container">
              <div className="uba-formulation-wrapper">
                <div className="uba-formulation-header">
                  <h4>Analysis</h4>
                  {pinnedObservation && (
                    <button 
                      className="uba-pin-clear-button" 
                      onClick={() => {
                        setPinnedObservation(null);
                        setActiveObservation(null);
                      }}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                
                {!formulation && (
                  <p className="uba-loading-placeholder">Analyzing user behavior patterns...</p>
                )}
                
                {formulation && (
                  <div className="uba-formulation-content">
                    {renderFormulation()}
                    <div className="uba-interaction-hint">
                      <div className="uba-hint-icon">💡</div>
                      <span>Hover over text to see relevant resources. Click to pin your selection.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="uba-links-container">
              <h4>Related Resources</h4>
              {!loading && !error && renderSolutions()}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
