// components/dashboard/UIPanel.js
import React, { useEffect, useState } from 'react';
import '../../styles/UIPanel.css';

export default function UIPanel({ pageId }) {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!pageId) return;

    const cacheKey = `ui_eval_page_${pageId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCategories(parsed);
        setError(null);
        setLoading(false);
        console.log(`[UIPanel] Loaded from cache for pageId=${pageId}`);
        return;
      } catch {
        console.warn('[UIPanel] Corrupted cache, ignoring.');
      }
    }

    const url = `http://127.0.0.1:8000/ask-ai/evaluate-ui/?page_id=${pageId}`;
    console.log(`[UIPanel] Fetching: ${url}`);

    setLoading(true);
    setError(null);
    setCategories([]);

    fetch(url, { headers: { Accept: 'application/json' } })
      .then(res => res.json())
      .then(data => {
        let evaluation = data.evaluation;
        if (typeof evaluation === 'string') {
          evaluation = JSON.parse(evaluation);
        }

        if (!evaluation?.categories) {
          throw new Error('No categories in response');
        }

        setCategories(evaluation.categories);
        sessionStorage.setItem(cacheKey, JSON.stringify(evaluation.categories));
        console.log(`[UIPanel] Cached response for pageId=${pageId}`);
      })
      .catch(err => {
        console.error('[UIPanel] Fetch failed:', err);
        setError(err.message || 'Unknown error');
      })
      .finally(() => setLoading(false));
  }, [pageId]);

  return (
    <div className="panel-container">
      <div className="panel-header">User Interface Evaluation</div>

      {loading && <div className="ui-loader">Loading UI evaluation...</div>}
      {error   && <div className="ui-error">⚠ {error}</div>}

      {!loading && !error && (
        <div className="ui-eval-body">
          {/* Left column: ratings */}
          <div className="ui-categories-container">
            {categories.map(({ name, score }) => (
              <div key={name} className="ui-category">
                <span className="category-name">{name.replace(/_/g, ' ')}</span>
                <div className="rating-container">
                  <div className="rating-bar">
                    <div 
                      className="rating-fill" 
                      style={{ width: `${(score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="rating-value">{score}/5</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right column: evidence */}
          <div className="ui-evidence-container">
            <h3 className="ui-info-title">Evidence</h3>
            {categories.map(({ name, evidence }) => (
              <div key={name} className="evidence-item">
                <strong className="evidence-name">{name.replace(/_/g, ' ')}:</strong>
                <p className="evidence-text">{evidence}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
