import React, { useEffect, useState } from 'react';

export default function WebMetricsPanel({ pageId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!pageId) return;           // nothing to do yet
    setLoading(true);              // reset state on page switch
    setMetrics(null);
    setError('');

    const token = sessionStorage.getItem('access_token');
    fetch(
      `http://127.0.0.1:8000/toolkit/web-metrics/business/?page_id=${pageId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMetrics(data['as metrics']);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load web metrics.');
        setLoading(false);
      });
  }, [pageId]); // ← refetch when page changes

  return (
    <div className="panel-container">
      <div className="panel-header">Web Metrics Panel</div>
      <div className="panel-body">
        {loading && <p>Loading web metrics…</p>}
        {error && <p className="error">{error}</p>}
        {metrics && (
          <ul className="metrics-list">
            {Object.entries(metrics).map(([k, v]) => (
              <li key={k} className="metric-item">
                <strong>{k}:</strong> {v}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
