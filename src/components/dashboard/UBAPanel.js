// components/dashboard/UBAPanel.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { UBASkeleton } from '../common/Skeleton';
import '../../styles/UBAPanel.css';
import '../../styles/Dashboard.css';
import { getToken } from '../../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';
import { fetchWithRetry, parseJsonResponse } from '../../utils/api';

// Constants for retry mechanism
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 10000; // 10 seconds

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
  const [retryTimeout, setRetryTimeout] = useState(null);

  /* ─── Cache Helpers ───────────────────────────────────────────────── */
  const cacheKey = pageId ? `uba_cache_${pageId}` : null;
  
  const isValidData = (data) => {
    return data && 
           typeof data === 'object' && 
           Object.keys(data).length > 0 &&
           !data.error;
  };

  const hydrateFromCache = () => {
    if (!cacheKey) return false;
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return false;

    try {
      const { data, timestamp } = JSON.parse(cached);
      
      // Check cache freshness (1 hour)
      const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
      if (Date.now() - timestamp > CACHE_TTL) {
        console.log('[UBAPanel] Cache expired, removing');
        sessionStorage.removeItem(cacheKey);
        return false;
      }

      if (!isValidData(data)) {
        console.log('[UBAPanel] Invalid data in cache, removing');
        sessionStorage.removeItem(cacheKey);
        return false;
      }

      setFormulation(data.formulation);
      setObservationSections(data.observationSections);
      setSolutions(data.solutions);
      // Notify parent of cached UBA analysis
      if (typeof onSummaryReady === 'function') {
        onSummaryReady(data.formulation);
      }
      setLoading(false);
      return true;
    } catch (error) {
      console.error('[UBAPanel] Cache hydration error:', error);
      sessionStorage.removeItem(cacheKey);
      return false;
    }
  };
  
  const persistToCache = (newData) => {
    if (!cacheKey || !isValidData(newData)) return;
    
    console.log('[UBAPanel] Persisting valid data to cache');
    
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        data: newData,
        timestamp: Date.now()
      })
    );
  };

  const clearRetryTimeout = () => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }
  };

  const fetchData = async (attempt = 0) => {
    console.log(`[UBAPanel] Attempt ${attempt + 1} of ${MAX_RETRIES}`);
    setLoading(true);
    setError(null);
    setRetryCount(attempt);

    try {
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const url = buildApiUrl(API_ENDPOINTS.TOOLKIT.UBA.ANALYZE(pageId));
      const response = await fetchWithRetry(url, { headers });
      const responseData = await parseJsonResponse(response);

      // Check if we got valid data or need to retry
      if (!isValidData(responseData)) {
        console.log('[UBAPanel] Invalid data received, will retry');
        throw new Error('Invalid data received from server');
      }

      setFormulation(responseData.formulation);
      setObservationSections(responseData.observationSections);
      setSolutions(responseData.solutions);
      persistToCache(responseData);
      setLoading(false);
      clearRetryTimeout();

      // Notify parent of UBA analysis
      if (typeof onSummaryReady === 'function') {
        onSummaryReady(responseData.formulation);
      }
      
      console.log('[UBAPanel] Successfully completed all requests and updated state:', {
        formulationLength: responseData.formulation.length,
        sectionsCount: responseData.observationSections.length,
        solutionsCount: responseData.solutions.length
      });
    } catch (err) {
      console.error('[UBAPanel] Fetch error:', err);
      
      // Check if we should retry
      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
        console.log(`[UBAPanel] Scheduling retry in ${delay}ms`);
        const timeout = setTimeout(() => fetchData(attempt + 1), delay);
        setRetryTimeout(timeout);
      } else {
        setError('Failed to load UBA data after multiple attempts. Please try again later.');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log('[UBAPanel] Component mounted/updated with pageId:', pageId);
    
    if (!pageId) {
      console.log('[UBAPanel] No pageId provided, skipping fetch');
      return;
    }

    if (hydrateFromCache()) {
      console.log('[UBAPanel] Valid data loaded from cache for pageId:', pageId);
      return;
    }
    
    fetchData();
    
    // Cleanup function
    return () => {
      console.log('[UBAPanel] Cleaning up component');
      clearRetryTimeout();
    };
  }, [pageId]);

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

  console.log('[UBAPanel] Rendering component. Loading:', loading, 'Error:', error, 
    'Has formulation:', !!formulation, 'Has solutions:', solutions?.length > 0);
  
  return (
    <div className="panel-container">
      <div className="panel-header">User Behaviour Analytics</div>
      <div className="panel-subtitle">
        {loading && retryCount > 0 ? 
          `Retrying to load UBA data (Attempt ${retryCount + 1}/${MAX_RETRIES})...` :
          'Analyzing user behavior patterns and interactions..'}
      </div>

      {loading && (
        <div className="uba-loading">
          <div className="loading-spinner"></div>
          <p>Loading user behavior analytics...</p>
        </div>
      )}

      {error && (
        <div className="uba-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry Loading
          </button>
        </div>
      )}

      {!loading && !error && formulation && (
        <div className="uba-content">
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
              
              <div className="uba-formulation-content">
                {renderFormulation()}
                <div className="uba-interaction-hint">
                  <div className="uba-hint-icon">💡</div>
                  <span>Hover over text to see relevant resources. Click to pin your selection.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="uba-links-container">
            <h4>Related Resources</h4>
            {renderSolutions()}
          </div>
        </div>
      )}
    </div>
  );
}
