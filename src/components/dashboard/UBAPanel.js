// components/dashboard/UBAPanel.js
import React, { useState, useEffect } from 'react';
import '../../styles/UBAPanel.css';

export default function UBAPanel({ pageId }) {
  const [observations, setObservations] = useState([]);
  const [rawReport,    setRawReport]    = useState('');
  const [links,        setLinks]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    if (!pageId) return;
    setLoading(true);
    setError(null);
    setObservations([]);
    setRawReport('');
    setLinks([]);

    // 1) fetch the UBA report
    fetch(`http://127.0.0.1:8000/ask-ai/evaluate-uba/?page_id=${pageId}`)
      .then(res => {
        if (!res.ok) throw new Error(`UBA fetch failed: ${res.status}`);
        return res.json();
      })
      .then(ubaData => {
        const report = ubaData.uba_report || '';
        setRawReport(report);

        // parse observations out of the report
        const parts = report.split(/\r?\n\r?\n(?=Observation)/g);
        const parsed = parts.map(text => {
          const p = text.match(/1\s*-\s*Problem:\s*([\s\S]*?)\s*2\s*-\s*Analysis:/);
          const a = text.match(/2\s*-\s*Analysis:\s*([\s\S]*?)\s*3\s*-\s*Solution:/);
          const s = text.match(/3\s*-\s*Solution:\s*([\s\S]*)/);
          return {
            problem:  p?.[1].trim() || '',
            analysis: a?.[1].trim() || '',
            solution: s?.[1].trim() || '',
          };
        });
        setObservations(parsed);

        // 2) then fetch your problem→solutions endpoint
        return fetch(
          `http://127.0.0.1:8000/ask-ai/web-search/?page_id=${pageId}`
        );
      })
      .then(res2 => {
        if (!res2.ok) throw new Error(`Solutions fetch failed: ${res2.status}`);
        return res2.json();
      })
      .then(solData => {
        // flatten every solution.source into one array
        const allLinks = (solData.results || [])
          .flatMap(r => (r.solutions || []).map(s => s.source))
          .filter(Boolean);
        setLinks(allLinks);
      })
      .catch(err => {
        console.error('[UBAPanel] error', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [pageId]);

  return (
    <div className="panel-container">
      <div className="panel-header">User Behaviour Analytics</div>

      {/* Debug / Raw Report */}
      <div className="uba-debug">
        <p><strong>Page ID:</strong> {pageId || '—'}</p>
        {rawReport && (
          <details>
            <summary>Raw UBA report ({rawReport.length} chars)</summary>
            <pre style={{ maxHeight: 150, overflowY: 'auto' }}>{rawReport}</pre>
          </details>
        )}
      </div>

      {/* Observations */}
      <div className="uba-info-container">
        {loading && <p>Loading observations…</p>}
        {error   && <p className="uba-error-text">Error: {error}</p>}
        {!loading && !error && observations.length === 0 && (
          <p>No observations found.</p>
        )}
        {!loading && !error && observations.map((obs, i) => (
          <div key={i} className="uba-observation">
            <h4>Observation {i + 1}</h4>
            <p><strong>Problem:</strong> {obs.problem}</p>
            <p><strong>Analysis:</strong> {obs.analysis}</p>
            <p><strong>Solution:</strong> {obs.solution}</p>
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="uba-links-container">
        <h4>Related Resources</h4>
        {loading && <p>Loading links…</p>}
        {!loading && !error && links.length === 0 && (
          <p>No resources available.</p>
        )}
        {!loading && !error && links.length > 0 && (
          <ul className="uba-link-list">
            {links.map((url, idx) => (
              <li key={idx}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
