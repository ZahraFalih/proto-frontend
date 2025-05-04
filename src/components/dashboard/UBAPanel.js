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

    const cacheKey = `uba_cache_${pageId}`;
    const cached   = sessionStorage.getItem(cacheKey);

    if (cached) {
      // hydrate from cache and skip fetching
      const { observations, rawReport, links } = JSON.parse(cached);
      setObservations(observations);
      setRawReport(rawReport);
      setLinks(links);
      return;
    }

    setLoading(true);
    setError(null);

    // Local holders so we can write them to cache later
    let parsedObs      = [];
    let reportStr      = '';
    let gatheredLinks  = [];

    // ── 1) UBA report ────────────────────────────────────────────────
    fetch(`http://127.0.0.1:8000/ask-ai/evaluate-uba/?page_id=${pageId}`)
      .then(r => {
        if (!r.ok) throw new Error(`UBA fetch failed: ${r.status}`);
        return r.json();
      })
      .then(uba => {
        reportStr = uba.uba_report || '';
        setRawReport(reportStr);

        const parts = reportStr.split(/\r?\n\r?\n(?=Observation)/g);
        parsedObs = parts.map(txt => {
          const p = txt.match(/1\s*-\s*Problem:\s*([\s\S]*?)\s*2\s*-\s*Analysis:/);
          const a = txt.match(/2\s*-\s*Analysis:\s*([\s\S]*?)\s*3\s*-\s*Solution:/);
          const s = txt.match(/3\s*-\s*Solution:\s*([\s\S]*)/);
          return {
            problem:  p?.[1].trim() || '',
            analysis: a?.[1].trim() || '',
            solution: s?.[1].trim() || '',
          };
        });
        setObservations(parsedObs);

        // ── 2) Solutions endpoint ─────────────────────────────────────
        return fetch(
          `http://127.0.0.1:8000/ask-ai/web-search/?page_id=${pageId}`
        );
      })
      .then(r2 => {
        if (!r2.ok) throw new Error(`Solutions fetch failed: ${r2.status}`);
        return r2.json();
      })
      .then(sol => {
        gatheredLinks = (sol.results || [])
          .flatMap(r => (r.solutions || []).map(s => s.source))
          .filter(Boolean);
        setLinks(gatheredLinks);

        // ── 3) Cache final payload ───────────────────────────────────
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            observations: parsedObs,
            rawReport:    reportStr,
            links:        gatheredLinks,
          })
        );
      })
      .catch(err => {
        console.error('[UBAPanel] error', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [pageId]);

  /* ————————————  render  ———————————— */
  return (
    <div className="panel-container">
      <div className="panel-header">User Behaviour Analytics</div>

      <div className="uba-debug">
        <p><strong>Page ID:</strong> {pageId || '—'}</p>
        {rawReport && (
          <details>
            <summary>Raw UBA report ({rawReport.length} chars)</summary>
            <pre style={{ maxHeight: 150, overflowY: 'auto' }}>{rawReport}</pre>
          </details>
        )}
      </div>

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
                <a href={url} target="_blank" rel="noopener noreferrer">
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
