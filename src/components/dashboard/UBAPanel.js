// components/dashboard/UBAPanel.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { UBASkeleton } from '../common/Skeleton';
import '../../styles/UBAPanel.css';
import '../../styles/Dashboard.css';
import { getToken } from '../../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';

export default function UBAPanel({ pageId, onSummaryReady }) {
  const [formulation, setFormulation] = useState('');
  const [observationSections, setObservationSections] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeObservation, setActiveObservation] = useState(null);
  const [expandedSolution, setExpandedSolution] = useState(null);
  const [pinnedObservation, setPinnedObservation] = useState(null);

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

  const fetchData = async (pageId) => {
    console.log('[UBAPanel] Starting fresh data fetch for pageId:', pageId);
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
      
      const evaluateResponse = await fetch(evalUrl, { headers });
      console.log('[UBAPanel] UBA evaluation response status:', evaluateResponse.status);
      
      if (!evaluateResponse.ok) {
        const errorText = await evaluateResponse.text();
        console.error('[UBAPanel] UBA evaluation error response:', errorText);
        
        // Check if it's a file not found error
        if (errorText.includes('No such file or directory')) {
          console.warn('[UBAPanel] UBA data file not found. Checking if we have cached data that might still be valid');
          
          // Don't immediately clear the cache - check if we have valid data first
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            try {
              const cachedData = JSON.parse(cached);
              if (cachedData.formulation && cachedData.observationSections && cachedData.observationSections.length > 0) {
                console.log('[UBAPanel] Using cached UBA data instead of failing');
                
                // Use the cached data
                setFormulation(cachedData.formulation);
                setObservationSections(cachedData.observationSections);
                setSolutions(cachedData.solutions || []);
                
                // Notify parent of cached UBA analysis
                if (typeof onSummaryReady === 'function') {
                  onSummaryReady(cachedData.formulation);
                }
                
                setLoading(false);
                return; // Exit the function early to use cached data
              }
            } catch (cacheErr) {
              console.error('[UBAPanel] Failed to parse cached data:', cacheErr);
              // Continue with showing the error
            }
          }
          
          // If we get here, we don't have valid cached data to fall back on
          throw new Error('The UBA data file is no longer available. Please try re-uploading your UBA data.');
        }
        
        throw new Error(`UBA evaluation failed: ${evaluateResponse.status} - ${errorText}`);
      }
      
      const evaluateData = await evaluateResponse.json();
      console.log('[UBAPanel] UBA evaluation completed');

      // Notify parent of UBA evaluation
      if (typeof onSummaryReady === 'function') {
        console.log('[UBAPanel] Sending UBA summary to parent:', evaluateData.uba_report);
        onSummaryReady(evaluateData.uba_report);
      }

      // ── 2) Web Search (must be called after evaluation) ─────────────────────────────────────
      const searchUrl = buildApiUrl(API_ENDPOINTS.AI.WEB_SEARCH(pageId, timestamp));
      console.log('[UBAPanel] Fetching web search results:', searchUrl);
      
      const searchResponse = await fetch(searchUrl, { headers });
      console.log('[UBAPanel] Web search response status:', searchResponse.status);
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('[UBAPanel] Web search error response:', errorText);
        throw new Error(`Web search failed: ${searchResponse.status} - ${errorText}`);
      }
      
      const searchData = await searchResponse.json();
      console.log('[UBAPanel] Received web search data:', {
        hasResults: !!searchData.results,
        resultCount: searchData.results?.length
      });

      // Process solutions with their associated problem
      const problemSolutions = searchData.results || [];
      setSolutions(problemSolutions);

      // ── 3) UBA formulation (must be called last) ─────────────────────────────────────────────
      const formUrl = buildApiUrl(API_ENDPOINTS.AI.FORMULATE_UBA(pageId, timestamp));
      console.log('[UBAPanel] Fetching UBA formulation:', formUrl);
      
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

      // Notify parent of UBA analysis
      if (typeof onSummaryReady === 'function') {
        onSummaryReady(formText);
      }
      
      console.log('[UBAPanel] Successfully completed all requests and updated state:', {
        formulationLength: formText.length,
        sectionsCount: sectionData.length,
        solutionsCount: problemSolutions.length
      });
    } catch (err) {
      console.error('[UBAPanel] Error in data fetch:', err);
      setError(err.message);
      
      // Only clear cache if it's not a file not found error (which we handle above)
      // and it's a serious error that would make the cache invalid
      if (!err.message.includes('file is no longer available') && 
          (err.message.includes('formulation') || err.message.includes('format'))) {
        console.log('[UBAPanel] Clearing cache due to serious error');
        sessionStorage.removeItem(cacheKey);
      }
    } finally {
      console.log('[UBAPanel] Request chain completed');
      setLoading(false);
    }
  };

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
    fetchData(pageId);
    
    // Cleanup function
    return () => {
      console.log('[UBAPanel] Cleaning up component');
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
      <div className="panel-subtitle">We analyzed how users interact with your website and identified key behavior patterns.</div>

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
            
            {loading && <UBASkeleton />}
            {error && <p className="uba-error-text">Error: {error}</p>}
            {!loading && !error && !formulation && (
              <p className="uba-loading-placeholder">Analyzing user behavior patterns...</p>
            )}
            {!loading && !error && formulation && (
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
          {loading && <UBASkeleton />}
          {!loading && !error && renderSolutions()}
        </div>
      </div>
    </div>
  );
}
