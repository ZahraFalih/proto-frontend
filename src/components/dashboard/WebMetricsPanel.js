// pages/WebMetricsPanel.js
import React, { useEffect, useState, useMemo } from 'react';
import { MetricsCardSkeleton } from '../common/Skeleton';
import '../../styles/Dashboard.css';
import '../../styles/WebMetricsPanel.css';
import { getToken } from '../../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';
import { fetchWithRetry, parseJsonResponse } from '../../utils/api';

// Maximum retries for zero values
const MAX_ZERO_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MAX_ERROR_RETRIES = 10; // Maximum number of retries for errors
const ERROR_RETRY_DELAY = 2000; // 2 seconds between error retries

export default function WebMetricsPanel({ pageId, onSummaryReady, onBusinessMetricsReady, onRoleMetricsReady }) {
  /* ─────────── state ─────────── */
  const [roleMetrics, setRoleMetrics] = useState(null);
  const [businessMetrics, setBusinessMetrics] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [activeMetric, setActiveMetric] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  /* ─────────── cache helpers ─────────── */
  const cacheKey = pageId ? `wm_cache_${pageId}` : null;

  const hydrateFromCache = () => {
    if (!cacheKey) return false;
    const cached = localStorage.getItem(cacheKey); // Changed from sessionStorage to localStorage
    if (!cached) return false;

    try {
      const { roleMetrics, businessMetrics, evaluation, timestamp } = JSON.parse(cached);
      
      // Check if cache is still valid (24 hours)
      const now = Date.now();
      if (now - timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(cacheKey);
        return false;
      }

      // Only hydrate if we have valid business metrics
      if (!businessMetrics || typeof businessMetrics !== 'object' || !Object.keys(businessMetrics).length) {
        localStorage.removeItem(cacheKey);
        return false;
      }

      // Check for zero values in business metrics
      const hasAllZeros = Object.values(businessMetrics).every(metrics => 
        Object.values(metrics).every(value => value === '0' || value === 0)
      );
      
      if (hasAllZeros) {
        localStorage.removeItem(cacheKey);
        return false;
      }

      setRoleMetrics(roleMetrics);
      setBusinessMetrics(businessMetrics);
      setEvaluation(evaluation);
      setLoading(false);

      // Notify parent components of cached data
      if (typeof onBusinessMetricsReady === 'function') {
        onBusinessMetricsReady(businessMetrics);
      }
      if (typeof onRoleMetricsReady === 'function' && roleMetrics) {
        onRoleMetricsReady(roleMetrics);
      }
      if (evaluation?.overall_summary && typeof onSummaryReady === 'function') {
        onSummaryReady(evaluation.overall_summary);
      }
      return true;
    } catch (error) {
      console.error('[WebMetricsPanel] Cache hydration error:', error);
      localStorage.removeItem(cacheKey);
      return false;
    }
  };

  const persistToCache = (roleM, businessMetricsM, evalObj) => {
    if (!cacheKey) return;
    
    console.log('[WebMetricsPanel] Persisting to cache:', {
      hasRoleMetrics: !!roleM,
      hasBusinessMetrics: !!businessMetricsM,
      hasEvaluation: !!evalObj
    });

    // Don't cache if business metrics are all zeros
    if (businessMetricsM) {
      const hasAllZeros = Object.values(businessMetricsM).every(metrics => 
        Object.values(metrics).every(value => value === '0' || value === 0)
      );
      
      if (hasAllZeros) {
        console.warn('[WebMetricsPanel] Not caching zero values');
        return;
      }
    }
    
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ 
        roleMetrics: roleM, 
        businessMetrics: businessMetricsM, 
        evaluation: evalObj,
        timestamp: Date.now()
      })
    );
  };

  // Helper function to check if metrics are valid (non-zero)
  const hasValidMetrics = (metrics) => {
    if (!metrics || typeof metrics !== 'object') return false;
    
    const values = Object.values(metrics).flatMap(obj => 
      typeof obj === 'object' ? Object.values(obj) : [obj]
    );
    
    return values.some(value => value !== '0' && value !== 0);
  };

  // Helper function to fetch metrics with retry for zero values
  const fetchMetricsWithRetry = async (url, headers, retryCount = 0) => {
    const response = await fetchWithRetry(url, { headers });
    const data = await parseJsonResponse(response);
    
    if (!hasValidMetrics(data) && retryCount < MAX_ZERO_RETRIES) {
      console.log(`[WebMetricsPanel] Received zero values, retrying... (${retryCount + 1}/${MAX_ZERO_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchMetricsWithRetry(url, headers, retryCount + 1);
    }
    
    return data;
  };

  /* ─────────── retry helper ─────────── */
  const retryOperation = async (operation, maxRetries = MAX_ERROR_RETRIES) => {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await operation();
        setRetryCount(0); // Reset retry count on success
        return result;
      } catch (err) {
        lastError = err;
        console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries}):`, err);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, ERROR_RETRY_DELAY));
        }
      }
    }
    
    throw lastError;
  };

  /* ─────────── fetch block ─────────── */
  useEffect(() => {
    console.log('[WebMetricsPanel] Component mounted or pageId changed:', pageId);
    if (!pageId) {
      console.log('[WebMetricsPanel] No pageId provided, skipping fetch');
      return;
    }
    
    if (hydrateFromCache()) {
      console.log('[WebMetricsPanel] Data loaded from cache for pageId:', pageId);
      return;
    }
  
    const run = async () => {
      console.log('[WebMetricsPanel] Starting data fetch for pageId:', pageId);
      setLoading(true);
      setError('');
      setRoleMetrics(null);
      setBusinessMetrics(null);
      setEvaluation(null);
  
      try {
        const token = getToken();
        const headers = { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        };
  
        const ts = Date.now();
        const roleUrl = buildApiUrl(API_ENDPOINTS.TOOLKIT.WEB_METRICS.ROLE_MODEL(pageId, ts));
        const bizUrl = buildApiUrl(API_ENDPOINTS.TOOLKIT.WEB_METRICS.BUSINESS(pageId, ts));
        
        console.log('[WebMetricsPanel] Fetching:', roleUrl, bizUrl);
        
        // Using Promise.allSettled with retry for zero values and errors
        const [roleResult, bizResult] = await retryOperation(async () => {
          const results = await Promise.allSettled([
            fetchMetricsWithRetry(roleUrl, headers),
            fetchMetricsWithRetry(bizUrl, headers)
          ]);
          
          // If both promises are rejected, throw an error
          if (results[0].status === 'rejected' && results[1].status === 'rejected') {
            throw new Error('Both role and business metrics fetches failed');
          }
          
          return results;
        });
        
        // Handle business metrics
        if (bizResult.status === 'fulfilled' && hasValidMetrics(bizResult.value)) {
          const businessMetricsData = bizResult.value;
          
          let processedBusinessMetrics = businessMetricsData;
          if (businessMetricsData.businessName && businessMetricsData.businessMetrics) {
            processedBusinessMetrics = {
              [businessMetricsData.businessName]: businessMetricsData.businessMetrics
            };
          }
          
          setBusinessMetrics(processedBusinessMetrics);
          if (typeof onBusinessMetricsReady === 'function') {
            onBusinessMetricsReady(processedBusinessMetrics);
          }
        } else {
          throw new Error('Failed to fetch valid business metrics');
        }

        // Handle role metrics
        if (roleResult.status === 'fulfilled' && hasValidMetrics(roleResult.value)) {
          const roleData = roleResult.value;
          setRoleMetrics(roleData);
          if (typeof onRoleMetricsReady === 'function') {
            onRoleMetricsReady(roleData);
          }
        }
  
        /* Evaluate business metrics with AI */
        await retryOperation(async () => {
          let metricsPayload = null;
          if (bizResult.status === 'fulfilled' && bizResult.value) {
            const businessMetricsData = bizResult.value;
            
            if (businessMetricsData.businessName && businessMetricsData.businessMetrics) {
              metricsPayload = {
                [businessMetricsData.businessName]: businessMetricsData.businessMetrics
              };
            } else {
              const bizKey = Object.keys(businessMetricsData)[0];
              metricsPayload = {
                [bizKey]: businessMetricsData[bizKey]
              };
            }
          }
          
          if (!metricsPayload) {
            throw new Error('No valid metrics data for evaluation');
          }
          
          const evalRes = await fetchWithRetry(
            'https://proto-api-kg9r.onrender.com/ask-ai/evaluate-web-metrics/',
            {
              method: 'POST',
              headers: {
                ...headers,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(metricsPayload),
            }
          );
  
          const evalJson = await parseJsonResponse(evalRes);
          
          if (!evalJson.web_metrics_report?.overall_summary) {
            throw new Error('Invalid evaluation response format');
          }
  
          setEvaluation(evalJson.web_metrics_report);
          
          // Cache the successful results
          persistToCache(
            roleResult.status === 'fulfilled' ? roleResult.value : null,
            bizResult.status === 'fulfilled' ? bizResult.value : null,
            evalJson.web_metrics_report
          );
  
          if (typeof onSummaryReady === 'function') {
            onSummaryReady(evalJson.web_metrics_report.overall_summary);
          }
        });
  
      } catch (err) {
        console.error('[WebMetricsPanel] metrics fetch error →', err);
        setError('Failed to load metrics data. Please try again.');
        setRetryCount(prev => prev + 1);
        
        // If we haven't exceeded max retries, try again
        if (retryCount < MAX_ERROR_RETRIES) {
          console.log(`[WebMetricsPanel] Retrying... (${retryCount + 1}/${MAX_ERROR_RETRIES})`);
          setTimeout(run, ERROR_RETRY_DELAY);
          return;
        }
      } finally {
        setLoading(false);
      }
    };
  
    run();
  }, [pageId, onSummaryReady, onBusinessMetricsReady, onRoleMetricsReady, retryCount]);

  useEffect(() => {
    if (evaluation?.overall_summary && typeof onSummaryReady === 'function') {
      console.log('[WebMetricsPanel] Bubbling summary from evaluation state:', evaluation.overall_summary);
      onSummaryReady(evaluation.overall_summary);
    }
  }, [evaluation, onSummaryReady]);

  useEffect(() => {
    if (roleMetrics) {
      console.log('[WebMetricsPanel] roleMetrics:', roleMetrics);
    }
    if (businessMetrics) {
      console.log('[WebMetricsPanel] businessMetrics:', businessMetrics);
    }
  }, [roleMetrics, businessMetrics]);

  /* ─────────── ideal benchmarks ─────────── */
  const idealBenchmarks = {
    'First Contentful Paint': { 
      value: '1.0 s', 
      desc: 'First Contentful Paint (FCP) measures the time from when the page starts loading to when any part of the page\'s content is rendered on the screen. A fast FCP helps reassure the user that something is happening and the page is loading properly. This is a key moment in the page load timeline and a crucial first impression for users.' 
    },
    'Speed Index': { 
      value: '1.5 s', 
      desc: 'Speed Index measures how quickly content is visually displayed during page load. It captures the average time at which visible parts of the page are displayed. A lower Speed Index score means content is painted faster, creating a more engaging user experience. This metric is particularly important for content-heavy pages.' 
    },
    'Largest Contentful Paint (LCP)': { 
      value: '2.5 s', 
      desc: 'Largest Contentful Paint (LCP) measures when the largest content element in the viewport becomes visible. This is an important user-centric metric as it tells you when the main content of the page has likely loaded. A good LCP score helps ensure users can engage with your content quickly. This often involves images, video, or large text blocks.' 
    },
    'Time to Interactive': { 
      value: '5.0 s', 
      desc: 'Time to Interactive (TTI) measures how long it takes for the page to become fully interactive and reliably respond to user input. This includes event handlers being registered and the page responding to user interactions within 50ms. A good TTI ensures users can not just see but also interact with your content, crucial for any interactive web application.' 
    },
    'Total Blocking Time (TBT)': { 
      value: '200 ms', 
      desc: 'Total Blocking Time (TBT) measures the total amount of time between First Contentful Paint and Time to Interactive where the main thread was blocked long enough to prevent input responsiveness. A high TBT means users may experience lag or unresponsiveness when trying to interact with the page. This metric helps identify heavy JavaScript execution that might be blocking the main thread.' 
    },
    'Cumulative Layout Shift (CLS)': { 
      value: '0.1', 
      desc: 'Cumulative Layout Shift (CLS) measures the sum of all unexpected layout shifts that occur during the entire lifespan of the page. A layout shift occurs when visible elements change position from one frame to the next. A low CLS score ensures a good user experience by maintaining visual stability. This is particularly important for pages with dynamic content, ads, or late-loading resources.' 
    },
  };

  /* ─────────── metric processing ─────────── */
  const processedMetrics = useMemo(() => {
    if (!businessMetrics) return [];
    
    try {
      // Check if businessMetrics is an object with at least one key
      if (typeof businessMetrics !== 'object' || !Object.keys(businessMetrics).length) {
        console.error('[WebMetricsPanel] Invalid business metrics format:', businessMetrics);
        setError('Invalid metrics data format. Please refresh the page.');
        return [];
      }
      
      // Add debug logging for processed metrics
      console.log('[WebMetricsPanel] Processing metrics from:', businessMetrics);
      
      // Handle the nested structure
      let bizObj;
      if (businessMetrics.businessName && businessMetrics.businessMetrics) {
        // Use the nested businessMetrics object directly
        bizObj = businessMetrics.businessMetrics;
        console.log('[WebMetricsPanel] Using nested businessMetrics:', bizObj);
      } else {
        // Use the traditional structure where metrics are under the business name key
        const bizKey = Object.keys(businessMetrics)[0];
        bizObj = businessMetrics[bizKey];
        console.log('[WebMetricsPanel] Using metrics from key:', bizKey);
      }
      
      // Extended logging for debugging
      console.log('[WebMetricsPanel] Business metrics found:', {
        bizObjType: typeof bizObj,
        bizObjKeys: bizObj ? Object.keys(bizObj) : 'null',
        sampleData: bizObj ? JSON.stringify(bizObj).substring(0, 100) + '...' : 'null'
      });
      
      // Verify bizObj is not null or undefined
      if (!bizObj) {
        console.error('[WebMetricsPanel] Business metrics object is null or empty');
        setError('Invalid metrics data structure. Please refresh the page.');
        return [];
      }
      
      // Check for missing metric keys that we expect
      const missingMetrics = Object.keys(idealBenchmarks).filter(metric => !bizObj[metric]);
      if (missingMetrics.length > 0) {
        console.warn('[WebMetricsPanel] Missing metrics in bizObj:', missingMetrics);
      }
      
      // Get role name and truncate before specific words, then add possessive form
      const roleName = roleMetrics ? (() => {
        try {
          // For role metrics, use the traditional structure
          const fullName = Object.keys(roleMetrics)[0];
          const truncatedName = fullName.split(/\s+(Landing|Search|Product)/)[0];
          return `${truncatedName}'s`;
        } catch (e) {
          console.warn('[WebMetricsPanel] Error processing role name:', e);
          return 'Role Model';
        }
      })() : 'Role Model';
      
      return Object.entries(idealBenchmarks).map(([metric, { value, desc }]) => {
        // Convert metric values to numbers for comparison
        // Add debug logging for metric values
        console.log(`[WebMetricsPanel] Processing metric "${metric}":`);
        
        // For bizObj, look for the metric by case insensitive matching if exact match fails
        let yourValue = bizObj[metric];
        if (yourValue === undefined) {
          // Try case-insensitive search or different casing
          const metricLower = metric.toLowerCase();
          const matchingKey = Object.keys(bizObj).find(
            k => k.toLowerCase() === metricLower || 
                k.toLowerCase().replace(/\s+/g, '') === metricLower.replace(/\s+/g, '')
          );
          
          if (matchingKey) {
            console.log(`[WebMetricsPanel] Found case-insensitive metric match: "${matchingKey}" for "${metric}"`);
            yourValue = bizObj[matchingKey];
          }
        }
        
        // If still no value, use default
        yourValue = yourValue || '0';
        console.log(`[WebMetricsPanel] Your value for "${metric}": ${yourValue}`);
        
        // Similar case-insensitive handling for role metrics
        let roleValue = '0';
        if (roleMetrics && Object.keys(roleMetrics).length) {
          const roleKey = Object.keys(roleMetrics)[0];
          roleValue = roleMetrics[roleKey][metric];
          
          // Try case-insensitive search if exact match fails
          if (roleValue === undefined && roleMetrics[roleKey]) {
            const metricLower = metric.toLowerCase();
            const matchingKey = Object.keys(roleMetrics[roleKey]).find(
              k => k.toLowerCase() === metricLower || 
                  k.toLowerCase().replace(/\s+/g, '') === metricLower.replace(/\s+/g, '')
            );
            
            if (matchingKey) {
              console.log(`[WebMetricsPanel] Found case-insensitive role metric match: "${matchingKey}" for "${metric}"`);
              roleValue = roleMetrics[roleKey][matchingKey];
            } else {
              roleValue = '0';
            }
          }
        }
        
        console.log(`[WebMetricsPanel] Role value for "${metric}": ${roleValue}`);
        
        const idealValue = value;
        
        // Extract numerical value for comparison
        const extractNumber = (val) => {
          if (!val) return 0;
          // Handle various formats of metric values
          const match = String(val).match(/[\d.]+/);
          const num = match ? parseFloat(match[0]) : 0;
          console.log(`[WebMetricsPanel] Extracted number from "${val}": ${num}`);
          return num;
        };
        
        const yourNum = extractNumber(yourValue);
        const roleNum = extractNumber(roleValue);
        const idealNum = extractNumber(idealValue);
        
        // Determine status (good, warn, bad)
        let status = 'good';
        const isCLS = metric.includes('CLS'); // Special handling for CLS (lower is better)
        
        if (isCLS) {
          if (yourNum > idealNum * 2) status = 'bad';
          else if (yourNum > idealNum) status = 'warn';
        } else {
          if (yourNum > idealNum * 2) status = 'bad';
          else if (yourNum > idealNum) status = 'warn';
        }
        
        // Calculate percentages for gauge visualization
        let percent = isCLS 
          ? Math.min(100, (yourNum / (idealNum * 3)) * 100)
          : Math.min(100, (yourNum / (idealNum * 2)) * 100);
        
        return {
          metric,
          description: desc,
          your: yourValue,
          role: roleValue,
          ideal: idealValue,
          roleName,
          status,
          percent,
          isCLS
        };
      });
    } catch (error) {
      console.error('[WebMetricsPanel] Error processing metrics:', error);
      setError('Error processing metrics data. Please refresh the page.');
      return [];
    }
  }, [roleMetrics, businessMetrics, idealBenchmarks, setError]);

  /* ─────────── event handlers ─────────── */
  const handleMetricClick = (metric) => {
    setActiveMetric(activeMetric === metric ? null : metric);
  };

  /* ─────────── render helpers ─────────── */
  const getMetricAnalysis = (metricName, evaluation) => {
    if (!evaluation || !evaluation.metric_analysis) return "No specific analysis available for this metric.";
    
    // Look for analysis that mentions this metric
    const lowerMetricName = metricName.toLowerCase();
    const relevantAnalysis = evaluation.metric_analysis?.find(analysis => 
      analysis.toLowerCase().includes(lowerMetricName)
    );
    
    return relevantAnalysis || "No specific analysis available for this metric.";
  };

  /* ─────────── render ─────────── */
  return (
    <div className="panel-container">
      <div className="warning-strip">
        This demo is hosted on the cheapest cloud option that the web has to provide. Some errors may occur that will require you to refresh the page to be resolved.
      </div>
      <div className="panel-header">Web Performance Metrics</div>
      <div className="panel-subtitle">When we accessed your website, these are the metrics we recorded..</div>
      
      {loading && (
        <div className="wm-container">
          <div className="wm-metrics-grid">
            {[1, 2, 3, 4].map(i => (
              <MetricsCardSkeleton key={i} />
            ))}
          </div>
          <div className="wm-details-panel">
            <div className="skeleton skeleton-metrics-header" style={{ margin: '1.25rem' }} />
            <div className="skeleton" style={{ height: '200px', margin: '1.25rem' }} />
          </div>
        </div>
      )}
      
      {error && <div className="wm-error">{error}</div>}
      
      {!loading && processedMetrics.length > 0 && (
        <div className="wm-container">
          <div className="wm-metrics-grid">
            {processedMetrics.map((item) => (
              <div 
                key={item.metric} 
                className={`wm-metric-card ${item.status} ${activeMetric === item.metric ? 'active' : ''}`}
                onClick={() => handleMetricClick(item.metric)}
              >
                <div className="wm-metric-header">
                  <h3 className="wm-metric-name">{item.metric}</h3>
                  <div className={`wm-status-indicator ${item.status}`}></div>
                </div>
                
                <div className="wm-metric-gauge">
                  <div className="wm-gauge-track">
                    <div 
                      className="wm-gauge-fill" 
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                  <div className="wm-gauge-marker" style={{ left: '50%' }}></div>
                </div>
                
                <div className="wm-metric-values">
                  <div className="wm-value-item">
                    <span className="wm-value-label">Your</span>
                    <span className="wm-value-data">{item.your}</span>
                  </div>
                  <div className="wm-value-item">
                    <span className="wm-value-label">Ideal</span>
                    <span className="wm-value-data ideal">{item.ideal}</span>
                  </div>
                  <div className="wm-value-item">
                    <span className="wm-value-label">{item.roleName}</span>
                    <span className="wm-value-data role">{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="wm-details-panel">
            <div className={`wm-metric-details ${activeMetric ? 'active' : ''}`}>
              {activeMetric && (
                <>
                  <h3>{activeMetric}</h3>
                  <p className="wm-metric-description">
                    {processedMetrics.find(m => m.metric === activeMetric)?.description}
                  </p>
                </>
              )}
            </div>
            
            <div className={`wm-summary ${!activeMetric ? 'active' : ''}`}>
              <h3>Performance Summary</h3>
              {evaluation ? (
                <>
                  <p className="wm-summary-text">{evaluation.overall_summary}</p>
                  <h4>Recommendations</h4>
                  <ul className="wm-recommendations">
                    {evaluation.recommendations.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className="wm-summary-text">
                    {error ? 
                      "AI evaluation is currently unavailable. Here are the basic metrics for your website." : 
                      "Click on a metric card to see detailed information."}
                  </p>
                  {error && (
                    <>
                      <h4>General Recommendations</h4>
                      <ul className="wm-recommendations">
                        <li>Optimize image sizes and use modern formats like WebP</li>
                        <li>Minimize render-blocking resources (JS and CSS)</li>
                        <li>Implement proper caching strategies</li>
                        <li>Consider using a Content Delivery Network (CDN)</li>
                        <li>Reduce server response times</li>
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
