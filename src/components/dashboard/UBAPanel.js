// components/dashboard/UBAPanel.js
import React, { useState, useEffect } from 'react';
import '../../styles/UBAPanel.css';

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
      // Append a cache-busting query parameter 
      const timestamp = Date.now();
      
      // ── 1) UBA formulation ─────────────────────────────────────────────
      const formUrl = `http://127.0.0.1:8000/ask-ai/formulate-uba-answer/?page_id=${pageId}&_t=${timestamp}`;
      console.log('[UBAPanel] Fetching formulation from:', formUrl);
      
      const formResponse = await fetch(formUrl);
      console.log('[UBAPanel] Formulation response status:', formResponse.status);
      
      if (!formResponse.ok) {
        throw new Error(`UBA formulation fetch failed: ${formResponse.status}`);
      }
      
      const data = await formResponse.json();
      console.log('[UBAPanel] Received formulation data:', data);
      
      if (!data.uba_formulation) {
        throw new Error('No UBA formulation data received');
      }
      
      // Process observations
      const observations = data.uba_formulation;
      console.log('[UBAPanel] Processing observations:', Object.keys(observations).length);
      
      let combinedText = '';
      let sectionData = [];
      
      Object.entries(observations).forEach(([key, text], index) => {
        if (!text) return; // Skip empty observations
        console.log(`[UBAPanel] Processing observation ${index + 1}, length:`, text.length);
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
      console.log('[UBAPanel] Final formulation length:', formText.length);
      console.log('[UBAPanel] Number of sections:', sectionData.length);

        // ── 2) Solutions endpoint ─────────────────────────────────────
      const linksUrl = `http://127.0.0.1:8000/ask-ai/web-search/?page_id=${pageId}&_t=${timestamp}`;
      console.log('[UBAPanel] Fetching links from:', linksUrl);
      
      const linksResponse = await fetch(linksUrl);
      console.log('[UBAPanel] Links response status:', linksResponse.status);
      
      if (!linksResponse.ok) {
        throw new Error(`Solutions fetch failed: ${linksResponse.status}`);
      }
      
      const sol = await linksResponse.json();
      console.log('[UBAPanel] Received links data:', sol);
      
      // Process solutions with their associated problem
      const problemSolutions = sol.results || [];
      console.log('[UBAPanel] Number of problem categories:', problemSolutions.length);
      
      if (problemSolutions.length > 0) {
        console.log('[UBAPanel] First problem:', problemSolutions[0].problem);
        console.log('[UBAPanel] First problem solutions:', problemSolutions[0].solutions?.length);
      }

      // Update state
      setFormulation(formText);
      setObservationSections(sectionData);
      setSolutions(problemSolutions);
      
      // Cache the results
      persistToCache(formText, sectionData, problemSolutions);
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
    console.log('[UBAPanel] Number of sections:', observationSections?.length);
    
    if (!formulation) {
      console.log('[UBAPanel] No formulation text available');
      return null;
    }
    
    if (!observationSections || observationSections.length === 0) {
      console.log('[UBAPanel] No sections available, rendering plain text');
      return <p className="uba-formulation-text">{formulation}</p>;
    }
    
    const segments = observationSections.map((section, index) => {
      const text = formulation.substring(section.startPos, section.endPos + 1);
      console.log(`[UBAPanel] Processing segment ${index + 1}, length:`, text.length);
      
      // Determine if this segment is pinned
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
          {text}
        </span>
      );
    });
    
    console.log('[UBAPanel] Total segments created:', segments.length);
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
            {loading && <p className="uba-loading-text">Loading analysis…</p>}
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
          {loading && <p className="uba-loading-text">Loading resources…</p>}
          {!loading && !error && renderSolutions()}
        </div>
      </div>
    </div>
  );
}
