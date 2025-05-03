import React, { useEffect, useState } from 'react';
import './UIPanel.css';

export default function UIPanel({ pageId }) {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!pageId) {
      console.warn('[UIPanel] No pageId – skipping fetch.');
      return;
    }

    const url = `http://127.0.0.1:8000/ask-ai/evaluate-ui/?page_id=${pageId}`;
    console.log(`[UIPanel] Hitting: ${url}`);

    setLoading(true);
    setError(null);

    fetch(url, { headers: { Accept: 'application/json' } })
      .then(res => {
        console.log('[UIPanel] Status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('[UIPanel] Raw payload:', data);

        // ───── unwrap the silly string ─────
        let evaluation = data.evaluation;
        if (typeof evaluation === 'string') {
          try {
            evaluation = JSON.parse(evaluation);
            console.log('[UIPanel] Parsed inner JSON:', evaluation);
          } catch (e) {
            throw new Error('Failed to parse evaluation string');
          }
        }

        if (evaluation?.categories) {
          setCategories(evaluation.categories);
        } else {
          throw new Error('No categories in payload');
        }
      })
      .catch(err => {
        console.error('[UIPanel] Fetch exploded:', err);
        setError(err.message || 'Unknown error');
      })
      .finally(() => setLoading(false));
  }, [pageId]);

  /* ---------- render ---------- */
  return (
    <div className="panel-container">
      <div className="panel-header">User Interface Evaluation</div>

      {loading && <div className="ui-loader">Loading…</div>}
      {error   && <div className="ui-error">⚠ {error}</div>}

      {!loading && !error && (
        <div className="panel-body ui-eval-body">
          {categories.map(({ name, score, evidence }) => (
            <div key={name} className="ui-category" title={evidence}>
              <span className="category-name">
                {name.replace(/_/g, ' ')}
              </span>

              <span className="stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={i < score ? 'star filled' : 'star'}
                  >
                    ★
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
