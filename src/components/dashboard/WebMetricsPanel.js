// pages/WebMetricsPanel.js
import React, { useEffect, useState, useMemo } from 'react';
import '../../styles/WebMetricsPanel.css';

export default function WebMetricsPanel({ pageId }) {
  /* ─────────── state ─────────── */
  const [roleMetrics,     setRoleMetrics]     = useState(null);
  const [businessMetrics, setBusinessMetrics] = useState(null);
  const [evaluation,      setEvaluation]      = useState(null);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

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
      sessionStorage.removeItem(cacheKey);   /* corrupted */
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
    if (hydrateFromCache()) return;          // served from cache

    const run = async () => {
      setLoading(true);
      setError('');
      setRoleMetrics(null);
      setBusinessMetrics(null);
      setEvaluation(null);

      try {
        /* 1️⃣ fetch role + business metrics */
        const token   = sessionStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

        const roleUrl = `http://127.0.0.1:8000/toolkit/web-metrics/role-model/?page_id=${pageId}`;
        const bizUrl  = `http://127.0.0.1:8000/toolkit/web-metrics/business/?page_id=${pageId}`;

        const [roleRes, bizRes] = await Promise.all([
          fetch(roleUrl, { headers }),
          fetch(bizUrl,  { headers }),
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
        setLoading(false);
      }
    };

    run();
  }, [pageId]);

  /* ─────────── ideal benchmarks ─────────── */
  const idealBenchmarks = {
    'First Contentful Paint':           { value: '1.0 s', desc: 'Time until the browser renders the first bit of content.' },
    'Speed Index':                      { value: '1.5 s', desc: 'How quickly content is visually displayed during page load.' },
    'Largest Contentful Paint (LCP)':   { value: '2.5 s', desc: 'Time when the largest content element becomes visible.' },
    'Time to Interactive':              { value: '5.0 s', desc: 'Time until the page is fully interactive.' },
    'Total Blocking Time (TBT)':        { value: '200 ms', desc: 'Sum of JS tasks that block input responsiveness.' },
    'Cumulative Layout Shift (CLS)':    { value: '0.1',   desc: 'Measures unexpected layout shifts; lower is better.' },
  };

  /* ─────────── table rows & sorting ─────────── */
  const [sortConfig, setSortConfig] = useState({ key: 'metric', direction: 'asc' });

  const rows = useMemo(() => {
    if (!roleMetrics || !businessMetrics) return [];
    const roleObj = roleMetrics[Object.keys(roleMetrics)[0]];
    const bizObj  = businessMetrics[Object.keys(businessMetrics)[0]];

    return Object.entries(idealBenchmarks).map(([metric, { value, desc }]) => ({
      metric,
      your:  bizObj?.[metric]  ?? '–',
      role:  roleObj?.[metric] ?? '–',
      ideal: value,
      desc,
    }));
  }, [roleMetrics, businessMetrics]);

  const sortedRows = useMemo(() => {
    const sorted = [...rows];
    sorted.sort((a, b) => {
      const num = v => parseFloat(String(v).match(/[\d.]+/)?.[0] ?? NaN);
      const aNum = num(a[sortConfig.key]);
      const bNum = num(b[sortConfig.key]);

      if (!isNaN(aNum) && !isNaN(bNum))
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;

      return sortConfig.direction === 'asc'
        ? String(a[sortConfig.key]).localeCompare(String(b[sortConfig.key]))
        : String(b[sortConfig.key]).localeCompare(String(a[sortConfig.key]));
    });
    return sorted;
  }, [rows, sortConfig]);

  const requestSort = key =>
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  /* ─────────── render ─────────── */
  return (
    <div className="panel-container">
      <div className="panel-header">Web Metrics Panel</div>
      <div className="panel-body">

        {loading && <div className="loading-indicator">Loading or evaluating…</div>}
        {error   && <div className="error">{error}</div>}

        {roleMetrics && businessMetrics && (
          <>
            {/* ── Metrics Table ── */}
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

            {/* ── Evaluation Summary ── */}
            <div className="metrics-info-container">
              {evaluation ? (
                <>
                  <h3 className="metrics-info-title">Summary</h3>
                  <p className="metrics-info-text">{evaluation.overall_summary}</p>
                  <h3 className="metrics-info-title">Recommendations</h3>
                  <ul className="metrics-info-text">
                    {evaluation.recommendations.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </>
              ) : (
                !loading && <div className="metrics-info-text">No evaluation available.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
