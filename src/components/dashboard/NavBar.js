import React from 'react';
import { NavBarSkeleton } from '../common/Skeleton';
import "../../styles/Dashboard.css";

export default function NavBar({ pages, activeTabSlug, onTabClick, onAddClick, loading }) {
  const slugify = str => {
    if (!str) return ''; // Handle undefined/null cases
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  };

  if (loading) {
    return <NavBarSkeleton />;
  }

  return (
    <div className="tabs-container tabs-wrapper" role="tablist">
      {pages?.map(page => {
        if (!page || !page.type) return null; // Skip invalid pages
        const slug = slugify(page.type);
        const isActive = activeTabSlug === slug;
        return (
          <button
            key={page.id}
            className={`tab ${isActive ? 'active' : ''}`}
            onClick={() => onTabClick(slug, page.id)}
            aria-selected={isActive}
            role="tab"
          >
            <span className="tab-text">{page.type || 'Untitled Page'}</span>
            {loading && isActive && (
              <div className="tab-loader">
                <div className="loader-dot"></div>
                <div className="loader-dot"></div>
                <div className="loader-dot"></div>
              </div>
            )}
          </button>
        );
      })}
      <button
        className="add-tab-button"
        onClick={onAddClick}
        aria-label="Add new page"
        title="Add new page"
        disabled={loading}
      >
        +
      </button>
    </div>
  );
}
