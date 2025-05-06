import React from 'react';
import "../../styles/Dashboard.css";


export default function NavBar({ pages, activeTabSlug, onTabClick, onAddClick }) {
  const slugify = str =>
    str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <div className="tabs-container tabs-wrapper" role="tablist">
      {pages.map(page => {
        const slug = slugify(page.type);
        return (
          <button
            key={page.id}
            className={`tab ${activeTabSlug === slug ? 'active' : ''}`}
            onClick={() => onTabClick(slug, page.id)}
            aria-selected={activeTabSlug === slug}
            role="tab"
          >
            {page.type}
          </button>
        );
      })}
      <button
        className="add-tab-button"
        onClick={onAddClick}
        aria-label="Add new page"
        title="Add new page"
      >
        +
      </button>
    </div>
  );
}
