// pages/WebMetricsPanel.js
import React, { useEffect, useState, useMemo } from 'react';
import { MetricsCardSkeleton } from '../common/Skeleton';
import '../../styles/Dashboard.css';
import '../../styles/WebMetricsPanel.css';
import { getToken } from '../../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';
import { fetchWithRetry, parseJsonResponse } from '../../utils/api';

export default function WebMetricsPanel({ pageId, onSummaryReady, onBusinessMetricsReady, onRoleMetricsReady }) {
  /* ─────────── state ─────────── */
  const [roleMetrics, setRoleMetrics] = useState(null);
  const [businessMetrics, setBusinessMetrics] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [activeMetric, setActiveMetric] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ─────────── cache helpers ─────────── */
  const cacheKey = pageId ? `wm_cache_${pageId}` : null;

  const hydrateFromCache = () => {
    if (!cacheKey) return false;
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return false;

    try {
      const { roleMetrics, businessMetrics, evaluation } = JSON.parse(cached);
      
      // Only hydrate if we have valid business metrics
      if (!businessMetrics || typeof businessMetrics !== 'object' || !Object.keys(businessMetrics).length) {
        sessionStorage.removeItem(cacheKey);
        return false;
      }

      setRoleMetrics(roleMetrics);
      setBusinessMetrics(businessMetrics);
      setEvaluation(evaluation);
      setLoading(false); // Important: Set loading to false when hydrating from cache

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
      sessionStorage.removeItem(cacheKey); /* corrupted */
      return false;
    }
  };

  const persistToCache = (roleM, businessMetricsM, evalObj) => {
    if (!cacheKey) return;
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ roleMetrics: roleM, businessMetrics: businessMetricsM, evaluation: evalObj })
    );
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
      return; // served from cache
    }
  
    const run = async () => {
      console.log('[WebMetricsPanel] Starting data fetch for pageId:', pageId);
      setLoading(true);
      setError('');
      setRoleMetrics(null);
      setBusinessMetrics(null);
      setEvaluation(null);
  
      try {
        /* 1️⃣ fetch role + business metrics */
        const token = getToken();
        console.log('[WebMetricsPanel] Auth token:', token ? 'found' : 'missing');
        const headers = { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        };
  
        const ts = Date.now();
        const roleUrl = buildApiUrl(API_ENDPOINTS.TOOLKIT.WEB_METRICS.ROLE_MODEL(pageId, ts));
        const bizUrl = buildApiUrl(API_ENDPOINTS.TOOLKIT.WEB_METRICS.BUSINESS(pageId, ts));
        
        console.log('[WebMetricsPanel] Fetching:', roleUrl, bizUrl);
        
        // Using Promise.allSettled to handle partial success
        const [roleResult, bizResult] = await Promise.allSettled([
          fetchWithRetry(roleUrl, { headers }),
          fetchWithRetry(bizUrl, { headers })
        ]);
        
        // Handle business metrics first - required
        if (bizResult.status === 'fulfilled') {
          const businessMetricsRes = bizResult.value;
          try {
            const businessMetricsData = await parseJsonResponse(businessMetricsRes);
            console.log('[WebMetricsPanel] Business metrics data:', businessMetricsData);
            // Add detailed debug logging
            console.log('[WebMetricsPanel] Business metrics structure:', {
              type: typeof businessMetricsData,
              isObject: typeof businessMetricsData === 'object',
              hasKeys: Object.keys(businessMetricsData).length,
              keys: Object.keys(businessMetricsData)
            });
            
            if (typeof businessMetricsData === 'object' && Object.keys(businessMetricsData).length) {
              const firstKey = Object.keys(businessMetricsData)[0];
              console.log(`[WebMetricsPanel] First key: "${firstKey}", value type:`, typeof businessMetricsData[firstKey]);
              
              if (businessMetricsData[firstKey] && typeof businessMetricsData[firstKey] === 'object') {
                console.log('[WebMetricsPanel] Sample metrics:', Object.keys(businessMetricsData[firstKey]).slice(0, 5));
              }
            }
            
            // Validate the data structure
            if (typeof businessMetricsData !== 'object' || !Object.keys(businessMetricsData).length) {
              console.error('[WebMetricsPanel] Invalid business metrics format:', businessMetricsData);
              setError('Invalid metrics data received from server. Please try again later.');
              setLoading(false);
              return;
            }
            
            setBusinessMetrics(businessMetricsData);
            if (typeof onBusinessMetricsReady === 'function') {
              onBusinessMetricsReady(businessMetricsData);
            }
          } catch (parseError) {
            console.error('[WebMetricsPanel] Failed to parse business metrics response:', parseError);
            setError('Failed to process metrics data. Please try again later.');
            setLoading(false);
            return;
          }
        } else {
          console.error('[WebMetricsPanel] Business metrics fetch failed after retries:', bizResult.reason);
          setError('Failed to load business metrics. Please try refreshing the page.');
          setLoading(false);
          return; // Exit early to prevent further processing
        }

        // Handle role metrics separately - optional
        let roleData = null;
        if (roleResult.status === 'fulfilled') {
          const roleRes = roleResult.value;
          try {
            roleData = await parseJsonResponse(roleRes);
            console.log('[WebMetricsPanel] Role metrics data:', roleData);
            
            // Validate structure but continue even if invalid
            if (typeof roleData === 'object' && Object.keys(roleData).length) {
              setRoleMetrics(roleData);
              if (typeof onRoleMetricsReady === 'function') {
                onRoleMetricsReady(roleData);
              }
            } else {
              console.warn('[WebMetricsPanel] Invalid role metrics format, continuing without role data');
            }
          } catch (parseError) {
            console.warn('[WebMetricsPanel] Failed to parse role metrics response:', parseError);
            // Continue without role metrics
          }
        } else {
          console.warn('[WebMetricsPanel] Role metrics not available after retries:', roleResult.reason);
          // Continue without role metrics
        }
  
        /* 2️⃣ evaluate business metrics with AI */
        try {
          const evalUrl = buildApiUrl(API_ENDPOINTS.AI.EVALUATE.WEB_METRICS(pageId));
          console.log('[WebMetricsPanel] Evaluating metrics:', evalUrl);
          
          // Format metrics exactly as the API expects: one top-level key with a metrics dict
          let metricsPayload = null;
          
          // Check if we have valid business metrics first
          if (!businessMetrics || typeof businessMetrics !== 'object' || !Object.keys(businessMetrics).length) {
            console.error('[WebMetricsPanel] No valid business metrics available for evaluation');
            throw new Error('No valid metrics data available');
          }
          
          // Get the business name (first key) from the metrics
          const bizKey = Object.keys(businessMetrics)[0];
          
          // Create the payload in the exact format the API expects
          metricsPayload = {};
          metricsPayload[bizKey] = businessMetrics[bizKey];
          
          console.log('[WebMetricsPanel] Sending metrics in expected format:', {
            hasMetrics: !!metricsPayload,
            bizKey,
            sample: JSON.stringify(metricsPayload).substring(0, 50) + '...'
          });
          
          const evalRes = await fetchWithRetry(
            evalUrl,
            {
              method: 'POST',
              headers: { 
                Authorization: `Bearer ${token}`, 
                'Content-Type': 'application/json' 
              },
              body: JSON.stringify({ metrics: metricsPayload }),
            }
          );
  
          console.log('[WebMetricsPanel] Evaluation response status:', evalRes.status);
          const evalText = await evalRes.text();
          
          let evalJson;
          try {
            evalJson = JSON.parse(evalText);
            console.log('[WebMetricsPanel] Evaluation response parsed successfully');
          } catch (parseErr) {
            console.error('[WebMetricsPanel] Failed to parse evaluation response:', parseErr, evalText);
            throw new Error('Invalid response format from evaluation endpoint');
          }
          
          console.log('[WebMetricsPanel] Evaluation response data:', {
            hasReport: !!evalJson.web_metrics_report,
            hasSummary: !!evalJson.web_metrics_report?.overall_summary
          });
  
          const report = evalJson.web_metrics_report;
          if (!report || !report.overall_summary) {
            console.error('[WebMetricsPanel] Invalid eval response:', evalJson);
            throw new Error('Invalid evaluation response format');
          }
  
          setEvaluation(report);
          persistToCache(roleData, businessMetrics, report);
  
          // ✔️ Bubble up the summary
          if (typeof onSummaryReady === 'function') {
            onSummaryReady(report.overall_summary);
          }
  
        } catch (evalErr) {
          console.error('[WebMetricsPanel] Evaluation error after retries:', evalErr);
          setError('Metrics loaded, but AI evaluation failed.');
          
          // Log the error details
          console.error('[WebMetricsPanel] Error details:', {
            message: evalErr.message,
            stack: evalErr.stack,
            businessMetrics: businessMetrics ? JSON.stringify(businessMetrics).substring(0, 200) + '...' : 'null' // Log a snippet
          });
          
          // Fallback summary & recommendations
          const fallbackReport = {
            overall_summary: "Performance metrics have been loaded, but detailed analysis is currently unavailable.",
            recommendations: [
              "Optimize image sizes and use modern formats like WebP",
              "Minimize render-blocking resources",
              "Implement proper caching strategies",
              "Consider using a CDN",
              "Reduce server response times"
            ],
            metric_analysis: []
          };
  
          setEvaluation(fallbackReport);
          persistToCache(roleData, businessMetrics, null);
  
          // Bubble up the fallback summary
          if (typeof onSummaryReady === 'function') {
            onSummaryReady(fallbackReport.overall_summary);
          }
        }
  
      } catch (err) {
        console.error('[WebMetricsPanel] metrics fetch error →', err);
        setError('Failed to load metrics data.');
      } finally {
        console.log('[WebMetricsPanel] Request completed');
        setLoading(false);
      }
    };
  
    run();
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
      console.log('[WebMetricsPanel] Processing metrics from:', {
        businessMetricsKeys: Object.keys(businessMetrics),
      });
      
      const bizKey = Object.keys(businessMetrics)[0];
      const bizObj = businessMetrics[bizKey];
      
      // Extended logging for debugging
      console.log('[WebMetricsPanel] Business metrics found:', {
        bizKey,
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
