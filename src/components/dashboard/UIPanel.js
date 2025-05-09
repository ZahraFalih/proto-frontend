// components/dashboard/UIPanel.js
import React, { useEffect, useState } from 'react';
import { UISkeleton } from '../common/Skeleton';
import '../../styles/UIPanel.css';

export default function UIPanel({ pageId, onSummaryReady }) {
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
        setCategories(parsed || []);
        setError(null);
        setLoading(false);
        // Notify parent of cached UI evaluation
        if (typeof onSummaryReady === 'function') {
          onSummaryReady(parsed);
        }
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
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        let evaluation = data.evaluation;
        if (typeof evaluation === 'string') {
          try {
            evaluation = JSON.parse(evaluation);
          } catch (e) {
            console.error('[UIPanel] Failed to parse evaluation string:', e);
            throw new Error('Invalid evaluation data format');
          }
        }

        if (!evaluation?.categories) {
          throw new Error('No categories in response');
        }

        // Process categories, ensuring evidence is handled as a string
        const categoriesArray = Array.isArray(evaluation.categories) 
          ? evaluation.categories.map(cat => ({
              name: cat.name || '',
              score: cat.score || 0,
              evidence: cat.evidence || ''
            }))
          : [];

        setCategories(categoriesArray);
        sessionStorage.setItem(cacheKey, JSON.stringify(categoriesArray));
        // Notify parent of fresh UI evaluation
        if (typeof onSummaryReady === 'function') {
          onSummaryReady(categoriesArray);
        }
        console.log(`[UIPanel] Cached response for pageId=${pageId}, categories:`, categoriesArray);
      })
      .catch(err => {
        console.error('[UIPanel] Fetch failed:', err);
        setError(err.message || 'Unknown error');
        setCategories([]); // Ensure categories is an empty array on error
      })
      .finally(() => setLoading(false));
  }, [pageId, onSummaryReady]);

  const handleCategoryClick = (categoryName) => {
    setActiveCategory(activeCategory === categoryName ? null : categoryName);
  };

  const formatCategoryName = (name) => {
    return name.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getActiveCategory = () => {
    const category = categories.find(c => c.name === activeCategory);
    return category || { evidence: '' };
  };

  return (
    <div className="panel-container">
      <div className="panel-header">User Interface Evaluation</div>

      {loading && <UISkeleton />}
      {error && <div className="ui-error">⚠ {error}</div>}

      {!loading && !error && (
        <div className="ui-eval-body">
          {/* Left column: ratings */}
          <div className="ui-categories-container">
            {Array.isArray(categories) && categories.map(({ name, score }) => (
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
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                  <span className="rating-value">{score}/10</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right column: evidence */}
          <div className="ui-evidence-container">
            {activeCategory ? (
              <div className="ui-evidence">
                <h3>{formatCategoryName(activeCategory)}</h3>
                <div className="ui-evidence-content">
                  <div className="evidence-item">
                    <p>{getActiveCategory().evidence}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ui-evidence-placeholder">
                Select a category to see detailed analysis
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
