// components/dashboard/UBAPanel.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { UBASkeleton } from '../common/Skeleton';
import '../../styles/UBAPanel.css';
import '../../styles/Dashboard.css';

export default function UBAPanel({ pageId }) {
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
      const token = sessionStorage.getItem('access_token');
      console.log('[UBAPanel] Auth token retrieved:', token ? 'Token found' : 'Token missing');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Append a cache-busting query parameter 
      const timestamp = Date.now();
      
      // ── 1) Evaluate UBA (must be called first) ─────────────────────────────────────
      const evaluateUrl = `http://127.0.0.1:8000/ask-ai/evaluate-uba/?page_id=${pageId}&_t=${timestamp}`;
      console.log('[UBAPanel] Starting UBA evaluation:', evaluateUrl);
      
      const evaluateResponse = await fetch(evaluateUrl, { headers });
      console.log('[UBAPanel] UBA evaluation response status:', evaluateResponse.status);
      
      if (!evaluateResponse.ok) {
        const errorText = await evaluateResponse.text();
        console.error('[UBAPanel] UBA evaluation error response:', errorText);
        throw new Error(`UBA evaluation failed: ${evaluateResponse.status} - ${errorText}`);
      }
      
      const evaluateData = await evaluateResponse.json();
      console.log('[UBAPanel] UBA evaluation completed');

      // ── 2) Web Search (must be called after evaluation) ─────────────────────────────────────
      const searchUrl = `http://127.0.0.1:8000/ask-ai/web-search/?page_id=${pageId}&_t=${timestamp}`;
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
      const formUrl = `http://127.0.0.1:8000/ask-ai/formulate-uba-answer/?page_id=${pageId}&_t=${timestamp}`;
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
      
      console.log('[UBAPanel] Successfully completed all requests and updated state:', {
        formulationLength: formText.length,
        sectionsCount: sectionData.length,
        solutionsCount: problemSolutions.length
      });
    } catch (err) {
      console.error('[UBAPanel] Error in data fetch:', err);
      setError(err.message);
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
