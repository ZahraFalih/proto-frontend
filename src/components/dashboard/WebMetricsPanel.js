// pages/WebMetricsPanel.js
import React, { useEffect, useState, useMemo } from 'react';
import { MetricsCardSkeleton } from '../common/Skeleton';
import '../../styles/Dashboard.css';
import '../../styles/WebMetricsPanel.css';
import { getToken } from '../../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';
import { fetchWithRetry, parseJsonResponse } from '../../utils/api';

// Constants for retry mechanism
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 10000; // 10 seconds

export default function WebMetricsPanel({ pageId, onSummaryReady, onBusinessMetricsReady, onRoleMetricsReady }) {
  /* ─────────── state ─────────── */
  const [roleMetrics, setRoleMetrics] = useState(null);
  const [businessMetrics, setBusinessMetrics] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [activeMetric, setActiveMetric] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState(null);

  /* ─────────── cache helpers ─────────── */
  const cacheKey = pageId ? `wm_cache_${pageId}` : null;

  const isHealthyMetrics = (metrics) => {
    if (!metrics || typeof metrics !== 'object') return false;
    
    // Check if any metric has a zero value
    const hasZeroValues = Object.values(metrics).some(value => {
      const numValue = parseFloat(String(value).match(/[\d.]+/)?.[0] || '0');
      return numValue === 0;
    });
    
    return !hasZeroValues;
  };

  const hydrateFromCache = () => {
    if (!cacheKey) return false;
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return false;

    try {
      const { roleMetrics, businessMetrics, evaluation, timestamp } = JSON.parse(cached);
      
      // Check cache freshness (24 hours)
      const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - timestamp > CACHE_TTL) {
        console.log('[WebMetricsPanel] Cache expired, removing');
        sessionStorage.removeItem(cacheKey);
        return false;
      }
      
      // Only hydrate if we have valid and healthy business metrics
      if (!businessMetrics || !isHealthyMetrics(businessMetrics)) {
        console.log('[WebMetricsPanel] Unhealthy metrics in cache, removing');
        sessionStorage.removeItem(cacheKey);
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
      if (evaluation && typeof onSummaryReady === 'function') {
        onSummaryReady(evaluation.overall_summary);
      }
      return true;
    } catch (error) {
      console.error('[WebMetricsPanel] Cache hydration error:', error);
      sessionStorage.removeItem(cacheKey);
      return false;
    }
  };

  const persistToCache = (roleM, businessMetricsM, evalObj) => {
    if (!cacheKey || !isHealthyMetrics(businessMetricsM)) return;
    
    console.log('[WebMetricsPanel] Persisting healthy metrics to cache');
    
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        roleMetrics: roleM,
        businessMetrics: businessMetricsM,
        evaluation: evalObj,
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

  /* ─────────── fetch block ─────────── */
  useEffect(() => {
    console.log('[WebMetricsPanel] Component mounted or pageId changed:', pageId);
    if (!pageId) {
      console.log('[WebMetricsPanel] No pageId provided, skipping fetch');
      return;
    }
    
    if (hydrateFromCache()) {
      console.log('[WebMetricsPanel] Healthy data loaded from cache for pageId:', pageId);
      return;
    }
  
    const fetchData = async (attempt = 0) => {
      console.log(`[WebMetricsPanel] Attempt ${attempt + 1} of ${MAX_RETRIES}`);
      setLoading(true);
      setError('');
      
      try {
        const token = getToken();
        const headers = { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        };
  
        const ts = Date.now();
        const roleUrl = buildApiUrl(API_ENDPOINTS.TOOLKIT.WEB_METRICS.ROLE_MODEL(pageId, ts));
        const bizUrl = buildApiUrl(API_ENDPOINTS.TOOLKIT.WEB_METRICS.BUSINESS(pageId, ts));
        
        // Using Promise.allSettled to handle partial success
        const [roleResult, bizResult] = await Promise.allSettled([
          fetchWithRetry(roleUrl, { headers }),
          fetchWithRetry(bizUrl, { headers })
        ]);
        
        let shouldRetry = false;
        let businessMetricsData = null;
        
        // Handle business metrics
        if (bizResult.status === 'fulfilled') {
          const businessMetricsRes = bizResult.value;
          businessMetricsData = await parseJsonResponse(businessMetricsRes);
          
          // Process business metrics
          let processedBusinessMetrics = businessMetricsData;
          if (businessMetricsData.businessName && businessMetricsData.businessMetrics) {
            processedBusinessMetrics = {
              [businessMetricsData.businessName]: businessMetricsData.businessMetrics
            };
          }
          
          // Check if we got valid metrics or need to retry
          if (!isHealthyMetrics(processedBusinessMetrics)) {
            console.log('[WebMetricsPanel] Unhealthy metrics received, will retry');
            shouldRetry = true;
          } else {
            setBusinessMetrics(processedBusinessMetrics);
            if (typeof onBusinessMetricsReady === 'function') {
              onBusinessMetricsReady(processedBusinessMetrics);
            }
          }
        } else {
          shouldRetry = true;
        }

        // Handle role metrics
        let roleData = null;
        if (roleResult.status === 'fulfilled') {
          const roleRes = roleResult.value;
          roleData = await parseJsonResponse(roleRes);
          if (roleData && typeof roleData === 'object' && Object.keys(roleData).length) {
            setRoleMetrics(roleData);
            if (typeof onRoleMetricsReady === 'function') {
              onRoleMetricsReady(roleData);
            }
          }
        }
  
        // Only proceed with evaluation if we have healthy business metrics
        if (!shouldRetry && businessMetricsData) {
          try {
            const evalUrl = buildApiUrl(API_ENDPOINTS.AI.EVALUATE.WEB_METRICS(pageId));
            
            // Format metrics for evaluation
            let metricsPayload = businessMetricsData.businessName && businessMetricsData.businessMetrics
              ? { [businessMetricsData.businessName]: businessMetricsData.businessMetrics }
              : { [Object.keys(businessMetricsData)[0]]: businessMetricsData[Object.keys(businessMetricsData)[0]] };
            
            const evalRes = await fetchWithRetry(
              evalUrl,
              {
                method: 'POST',
                headers,
                body: JSON.stringify({ metrics: metricsPayload }),
              }
            );
  
            const evalJson = await parseJsonResponse(evalRes);
            
            if (evalJson.web_metrics_report?.overall_summary) {
              setEvaluation(evalJson.web_metrics_report);
              if (typeof onSummaryReady === 'function') {
                onSummaryReady(evalJson.web_metrics_report.overall_summary);
              }
              
              // Cache the successful results
              persistToCache(roleData, businessMetricsData, evalJson.web_metrics_report);
            } else {
              shouldRetry = true;
            }
          } catch (evalErr) {
            console.error('[WebMetricsPanel] Evaluation error:', evalErr);
            shouldRetry = true;
          }
        }
        
        if (shouldRetry && attempt < MAX_RETRIES - 1) {
          const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
          console.log(`[WebMetricsPanel] Scheduling retry in ${delay}ms`);
          const timeout = setTimeout(() => fetchData(attempt + 1), delay);
          setRetryTimeout(timeout);
        } else if (shouldRetry) {
          setError('Failed to load complete metrics data after multiple attempts.');
        }
        
      } catch (err) {
        console.error('[WebMetricsPanel] Fetch error:', err);
        if (attempt < MAX_RETRIES - 1) {
          const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
          const timeout = setTimeout(() => fetchData(attempt + 1), delay);
          setRetryTimeout(timeout);
        } else {
          setError('Failed to load metrics data after multiple attempts.');
        }
      } finally {
        if (attempt === MAX_RETRIES - 1) {
          setLoading(false);
        }
      }
    };
  
    fetchData(0);
    
    return () => {
      clearRetryTimeout();
    };
  }, [pageId, onSummaryReady, onBusinessMetricsReady, onRoleMetricsReady]);

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
      <div className="panel-header">Web Performance Metrics</div>
      <div className="panel-subtitle">
        {loading && retryCount > 0 ? 
          `Retrying to load metrics (Attempt ${retryCount + 1}/${MAX_RETRIES})...` :
          'When we accessed your website, these are the metrics we recorded..'}
      </div>
      
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
