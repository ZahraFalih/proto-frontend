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
      } catch (e) {
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
          <div className="ui-categories-container">
            {categories.map(({ name, score, evidence }) => (
              <div key={name} className="ui-category" title={evidence}>
                <span className="category-name">{name.replace(/_/g, ' ')}</span>
                <div className="rating-container">
                  <div className="rating-bar">
                    <div 
                      className="rating-fill" 
                      style={{ width: `${(score / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="rating-value">{score}/5</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="ui-info-container">
            <h3 className="ui-info-title">Why UI Matters for Sales</h3>
            <p className="ui-info-text">
              A well-designed user interface creates a strong foundation for your business by making interactions intuitive and seamless. Studies show that 88% of online shoppers won't return to a website after a poor user experience.
            </p>
            <p className="ui-info-text">
              Effective UI design directly impacts:
            </p>
            <ul className="ui-info-text">
              <li>Conversion rates - intuitive interfaces guide users toward purchase</li>
              <li>Customer retention - pleasant experiences encourage repeat visits</li>
              <li>Brand perception - professional design builds credibility and trust</li>
              <li>Customer support costs - intuitive interfaces reduce help requests</li>
            </ul>
            <p className="ui-info-text">
              Focus on improving your lowest-scoring categories first to see the biggest impact on user satisfaction and sales performance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
