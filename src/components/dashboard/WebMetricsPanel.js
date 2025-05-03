// pages/WebMetricsPanel.js
import React, { useEffect, useState, useMemo } from 'react';
import '../../styles/WebMetricsPanel.css';

export default function WebMetricsPanel({ pageId }) {
  const [roleMetrics,     setRoleMetrics]     = useState(null);
  const [businessMetrics, setBusinessMetrics] = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');

  useEffect(() => {
    if (!pageId) return;    // nothing to fetch yet

    setLoading(true);
    setError('');
    setRoleMetrics(null);
    setBusinessMetrics(null);

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
          throw new Error(`Status ${status}`);
        }

        const [roleData, bizData] = await Promise.all([
          roleRes.json(),
          bizRes.json(),
        ]);

        setRoleMetrics(roleData);
        setBusinessMetrics(bizData);
      } catch (err) {
        console.error(err);
        setError('Failed to load web metrics.');
      } finally {
        setLoading(false);
      }
    })();
  }, [pageId]);

  // Define ideal benchmarks
  const idealBenchmarks = {
    'First Contentful Paint': {
      value: '1.0 s',
      desc: 'Time until the browser renders the first bit of content from the DOM, providing the first feedback to the user that the page is loading.'
    },
    'Speed Index': {
      value: '1.5 s',
      desc: 'How quickly content is visually displayed during page load. Lower scores mean content is painted faster.'
    },
    'Largest Contentful Paint (LCP)': {
      value: '2.5 s',
      desc: 'Time when the largest content element in the viewport becomes visible. Vital for perceived loading speed.'
    },
    'Time to Interactive': {
      value: '5.0 s',
      desc: 'Time until the page is fully interactive, with events handling input and animation running smoothly.'
    },
    'Total Blocking Time (TBT)': {
      value: '200 ms',
      desc: 'Sum of time between First Contentful Paint and Time to Interactive where the main thread was blocked for long enough to prevent input responsiveness.'
    },
    'Cumulative Layout Shift (CLS)': {
      value: '0.1',
      desc: 'Measures visual stability by quantifying how much page elements move unexpectedly. Lower is better.'
    },
  };

  // Build rows for the table
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
      const aVal = a[sortConfig.key], bVal = b[sortConfig.key];
      const num = v => { const m = String(v).match(/[\d.]+/); return m ? parseFloat(m[0]) : NaN; };
      const aNum = num(aVal), bNum = num(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
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
        {loading && <div className="loading-indicator">Loading web metrics...</div>}
        {error && <div className="error">{error}</div>}

        {roleMetrics && businessMetrics && (
          <>
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
            
            <div className="metrics-info-container">
              <div>
                <h3 className="metrics-info-title">Optimize Your Web Performance</h3>
                <p className="metrics-info-text">
                  Web performance metrics are crucial indicators of user experience. Fast-loading pages lead to higher engagement, better conversion rates, and improved SEO rankings.
                </p>
                <p className="metrics-info-text">
                  Focus on optimizing your Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS) as these are core web vitals that Google uses in their ranking algorithm.
                </p>
              </div>
              
              <div>
                <h3 className="metrics-info-title">Performance Best Practices</h3>
                <p className="metrics-info-text">
                  • Optimize and compress images<br />
                  • Minimize JavaScript and CSS<br />
                  • Leverage browser caching<br />
                  • Reduce server response time<br />
                  • Implement content delivery networks (CDNs)
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
