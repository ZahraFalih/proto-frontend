// pages/WebMetricsPanel.js
import React, { useEffect, useState, useMemo } from 'react';
import '../../styles/WebMetricsPanel.css';

export default function WebMetricsPanel({ pageId }) {
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
      setRoleMetrics(roleMetrics);
      setBusinessMetrics(businessMetrics);
      setEvaluation(evaluation);
      return true;
    } catch {
      sessionStorage.removeItem(cacheKey); /* corrupted */
      return false;
    }
  };

  const persistToCache = (roleM, bizM, evalObj) => {
    if (!cacheKey) return;
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ roleMetrics: roleM, businessMetrics: bizM, evaluation: evalObj })
    );
  };

  /* ─────────── fetch block ─────────── */
  useEffect(() => {
    if (!pageId) return;
    if (hydrateFromCache()) return; // served from cache

    const run = async () => {
      setLoading(true);
      setError('');
      setRoleMetrics(null);
      setBusinessMetrics(null);
      setEvaluation(null);

      try {
        /* 1️⃣ fetch role + business metrics */
        const token = sessionStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

        // Add cache busting timestamp
        const timestamp = Date.now();
        const roleUrl = `http://127.0.0.1:8000/toolkit/web-metrics/role-model/?page_id=${pageId}&_t=${timestamp}`;
        const bizUrl = `http://127.0.0.1:8000/toolkit/web-metrics/business/?page_id=${pageId}&_t=${timestamp}`;

        const [roleRes, bizRes] = await Promise.all([
          fetch(roleUrl, { headers }),
          fetch(bizUrl, { headers }),
        ]);
        if (!roleRes.ok || !bizRes.ok)
          throw new Error('Could not fetch web metrics');

        const [roleData, bizData] = await Promise.all([roleRes.json(), bizRes.json()]);
        setRoleMetrics(roleData);
        setBusinessMetrics(bizData);

        /* 2️⃣ evaluate business metrics */
        const bizKey = Object.keys(bizData)[0];
        const evalRes = await fetch(
          'http://127.0.0.1:8000/ask-ai/evaluate-web-metrics/',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [bizKey]: bizData[bizKey] }),
          }
        );
        if (!evalRes.ok) throw new Error('Evaluation API failed');
        const evalJson = await evalRes.json();
        setEvaluation(evalJson.web_metrics_report);

        /* 3️⃣ save everything to cache */
        persistToCache(roleData, bizData, evalJson.web_metrics_report);
      } catch (err) {
        console.error('[WebMetricsPanel] error →', err);
        setError('Failed to load or evaluate metrics.');
      } finally {
        console.log('[WebMetricsPanel] Request completed');
        setLoading(false);
      }
    };

    run();
  }, [pageId]);

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
    if (!roleMetrics || !businessMetrics) return [];
    const roleObj = roleMetrics[Object.keys(roleMetrics)[0]];
    const bizObj = businessMetrics[Object.keys(businessMetrics)[0]];
    
    // Get role name and truncate before specific words, then add possessive form
    const fullName = Object.keys(roleMetrics)[0];
    const truncatedName = fullName.split(/\s+(Landing|Search|Product)/)[0];
    const roleName = `${truncatedName}'s`;
    
    return Object.entries(idealBenchmarks).map(([metric, { value, desc }]) => {
      // Convert metric values to numbers for comparison
      const yourValue = bizObj?.[metric] || '0';
      const roleValue = roleObj?.[metric] || '0';
      const idealValue = value;
      
      // Extract numerical value for comparison
      const extractNumber = (val) => parseFloat(String(val).match(/[\d.]+/)?.[0] || 0);
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
  }, [roleMetrics, businessMetrics]);

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
      
      {loading && <div className="wm-loading">Analyzing performance metrics...</div>}
      {error && <div className="wm-error">{error}</div>}
      
      {!loading && !error && processedMetrics.length > 0 && (
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
                <p className="wm-summary-text">Click on a metric card to see detailed information.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
