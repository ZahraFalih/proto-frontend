// pages/WebMetricsPanel.js
import React, { useEffect, useState, useMemo } from 'react';
import '../../styles/WebMetricsPanel.css';

export default function WebMetricsPanel({ pageId }) {
  const [roleMetrics,     setRoleMetrics]     = useState(null);
  const [businessMetrics, setBusinessMetrics] = useState(null);
  const [loadingMetrics,  setLoadingMetrics]  = useState(false);
  const [errorMetrics,    setErrorMetrics]    = useState('');

  const [evaluation,      setEvaluation]      = useState(null);
  const [loadingEval,     setLoadingEval]     = useState(false);
  const [errorEval,       setErrorEval]       = useState('');

  // 1) Fetch role & biz metrics
  useEffect(() => {
    if (!pageId) return;

    setLoadingMetrics(true);
    setErrorMetrics('');
    setRoleMetrics(null);
    setBusinessMetrics(null);
    console.log('▶️ Starting metrics fetch for page', pageId);

    const token = sessionStorage.getItem('access_token');
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const roleUrl     = `http://127.0.0.1:8000/toolkit/web-metrics/role-model/?page_id=${pageId}`;
    const businessUrl = `http://127.0.0.1:8000/toolkit/web-metrics/business/?page_id=${pageId}`;

    (async () => {
      try {
        const [roleRes, bizRes] = await Promise.all([
          fetch(roleUrl,     { method: 'GET', headers }),
          fetch(businessUrl, { method: 'GET', headers }),
        ]);
        if (!roleRes.ok || !bizRes.ok) {
          const status = !roleRes.ok ? roleRes.status : bizRes.status;
          throw new Error(`Metrics fetch failed with status ${status}`);
        }
        const [roleData, bizData] = await Promise.all([
          roleRes.json(),
          bizRes.json(),
        ]);
        console.log('✅ Metrics fetched:', { roleData, bizData });
        setRoleMetrics(roleData);
        setBusinessMetrics(bizData);
      } catch (err) {
        console.error('❌ Error fetching metrics:', err);
        setErrorMetrics('Failed to load web metrics.');
      } finally {
        setLoadingMetrics(false);
      }
    })();
  }, [pageId]);

  // 2) Send business metrics to evaluation endpoint
  useEffect(() => {
    if (!businessMetrics) return;

    const bizKey = Object.keys(businessMetrics)[0];
    const bizObj = businessMetrics[bizKey];

    setLoadingEval(true);
    setErrorEval('');
    setEvaluation(null);
    console.log('▶️ Sending business metrics to evaluator:', bizObj);

    (async () => {
      try {
        const resp = await fetch(
          'http://127.0.0.1:8000/ask-ai/evaluate-web-metrics/',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [bizKey]: bizObj }),
          }
        );
        if (!resp.ok) throw new Error(`Eval status ${resp.status}`);
        const data = await resp.json();
        console.log('✅ Evaluation response:', data);
        setEvaluation(data.web_metrics_report);
      } catch (err) {
        console.error('❌ Evaluation error:', err);
        setErrorEval('Failed to evaluate metrics.');
      } finally {
        setLoadingEval(false);
      }
    })();
  }, [businessMetrics]);

  // Ideal benchmarks
  const idealBenchmarks = {
    'First Contentful Paint': {
      value: '1.0 s',
      desc: 'Time until the browser renders the first bit of content from the DOM.'
    },
    'Speed Index': {
      value: '1.5 s',
      desc: 'How quickly content is visually displayed during page load.'
    },
    'Largest Contentful Paint (LCP)': {
      value: '2.5 s',
      desc: 'Time when the largest content element in the viewport becomes visible.'
    },
    'Time to Interactive': {
      value: '5.0 s',
      desc: 'Time until the page is fully interactive.'
    },
    'Total Blocking Time (TBT)': {
      value: '200 ms',
      desc: 'Sum of long tasks between FCP and TTI that block input responsiveness.'
    },
    'Cumulative Layout Shift (CLS)': {
      value: '0.1',
      desc: 'Measures unexpected layout shifts; lower is better.'
    },
  };

  // Build rows
  const [sortConfig, setSortConfig] = useState({ key: 'metric', direction: 'asc' });
  const rows = useMemo(() => {
    if (!roleMetrics || !businessMetrics) return [];
    const roleKey = Object.keys(roleMetrics)[0];
    const bizKey  = Object.keys(businessMetrics)[0];
    const roleObj = roleMetrics[roleKey];
    const bizObj  = businessMetrics[bizKey];

    return Object.entries(idealBenchmarks).map(([metric, { value: ideal, desc }]) => ({
      metric,
      your: bizObj[metric] ?? '–',
      role: roleObj[metric] ?? '–',
      ideal,
      desc
    }));
  }, [roleMetrics, businessMetrics]);

  // Sort rows
  const sortedRows = useMemo(() => {
    const sorted = [...rows];
    sorted.sort((a, b) => {
      const extractNum = v => {
        const m = String(v).match(/[\d.]+/);
        return m ? parseFloat(m[0]) : NaN;
      };
      const aNum = extractNum(a[sortConfig.key]);
      const bNum = extractNum(b[sortConfig.key]);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return sortConfig.direction === 'asc'
        ? String(a[sortConfig.key]).localeCompare(String(b[sortConfig.key]))
        : String(b[sortConfig.key]).localeCompare(String(a[sortConfig.key]));
    });
    return sorted;
  }, [rows, sortConfig]);

  const requestSort = key =>
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));

  return (
    <div className="panel-container">
      <div className="panel-header">Web Metrics Panel</div>
      <div className="panel-body">

        { (loadingMetrics || loadingEval) && (
          <div className="loading-indicator">
            {loadingMetrics ? 'Loading web metrics…' : 'Evaluating metrics…'}
          </div>
        )}
        { errorMetrics && <div className="error">{errorMetrics}</div> }
        { errorEval    && <div className="error">{errorEval}</div> }

        {roleMetrics && businessMetrics && (
          <>
            {/* 🗂 Metrics Table */}
            <div className="metrics-table-container">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th onClick={() => requestSort('metric')}>Metric</th>
                    <th onClick={() => requestSort('your')}>Your Metrics</th>
                    <th onClick={() => requestSort('role')}>
                      {Object.keys(roleMetrics)[0]}
                    </th>
                    <th onClick={() => requestSort('ideal')}>Ideal</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map(row => (
                    <tr key={row.metric}>
                      <td>
                        <div className="metric-name">
                          {row.metric}
                          <div className="tooltip">
                            <span className="info-icon">ⓘ</span>
                            <span className="tooltip-text">{row.desc}</span>
                          </div>
                        </div>
                      </td>
                      <td>{row.your}</td>
                      <td>{row.role}</td>
                      <td>{row.ideal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🔍 Evaluation Results */}
            <div className="metrics-info-container">
              {evaluation ? (
                <>
                  <h3 className="metrics-info-title">Summary</h3>
                  <p className="metrics-info-text">
                    {evaluation.overall_summary}
                  </p>
                  <h3 className="metrics-info-title">Recommendations</h3>
                  <ul className="metrics-info-text">
                    {evaluation.recommendations.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </>
              ) : !loadingEval && (
                <div className="metrics-info-text">No evaluation available.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
