// components/dashboard/UIPanel.js
import React, { useEffect, useState } from 'react';
import '../../styles/UIPanel.css';

export default function UIPanel({ pageId }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const url = `http://127.0.0.1:8000/ask-ai/evaluate-ui/?page_id=${pageId}&_t=${timestamp}`;
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

  const handleCategoryClick = (categoryName) => {
    setActiveCategory(activeCategory === categoryName ? null : categoryName);
  };

  const formatCategoryName = (name) => {
    return name.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="panel-container">
      <div className="panel-header">User Interface Evaluation</div>

      {loading && <div className="ui-loader">Loading UI evaluation...</div>}
      {error && <div className="ui-error">⚠ {error}</div>}

      {!loading && !error && (
        <div className="ui-eval-body">
          {/* Left column: ratings */}
          <div className="ui-categories-container">
            {categories.map(({ name, score }) => (
              <div 
                key={name} 
                className={`ui-category ${activeCategory === name ? 'active' : ''}`}
                onClick={() => handleCategoryClick(name)}
              >
                <span className="category-name">{formatCategoryName(name)}</span>
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

          {/* Right column: explanations */}
          <div className="ui-explanation-container">
            {categories.map(({ name, evidence }) => (
              <div 
                key={name} 
                className={`explanation-item ${activeCategory === name ? 'active' : ''}`}
              >
                <h4 className="explanation-title">{formatCategoryName(name)}</h4>
                <p className="explanation-text">{evidence}</p>
              </div>
            ))}
            {!activeCategory && categories.length > 0 && (
              <div className="explanation-placeholder">
                <p>Select a category to see detailed information</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
