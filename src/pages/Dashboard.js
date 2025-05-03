// pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import DashboardHeaderPanel from '../components/dashboard/DashboardHeaderPanel';
import UBAPanel from '../components/dashboard/UBAPanel';
import UIPanel from '../components/dashboard/UIPanel';
import WebMetricsPanel from '../components/dashboard/WebMetricsPanel';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [pages, setPages] = useState([]);
  const [activeTabSlug, setActiveTabSlug] = useState('');

  const slugify = str =>
    str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      console.warn('[Dashboard] No token found – off you go to login.');
      return;
    }

    fetch('http://127.0.0.1:8000/toolkit/user-pages/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      mode: 'cors',
    })
      .then(res => {
        console.log('[Dashboard] /user-pages status:', res.status);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('[Dashboard] Pages payload:', data);
        setPages(data);
        if (data.length) {
          const defaultSlug = slugify(data[0].type);
          setActiveTabSlug(defaultSlug);
          window.history.replaceState({}, '', `?page_id=${data[0].id}`);
        }
      })
      .catch(err => console.error('[Dashboard] Fetch failed:', err));
  }, []);

  const handleTabClick = (slug, id) => {
    setActiveTabSlug(slug);
    const params = new URLSearchParams(window.location.search);
    params.set('page_id', id);
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
  };

  const handleAddTab = () => {
    console.log('Add new page tab clicked');
    alert('Add new page functionality will be implemented in future updates');
  };

  const activePage = pages.find(p => slugify(p.type) === activeTabSlug);
  const activePageId = activePage ? activePage.id : null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-section">
        <div className="dashboard-content-wrapper">
          <DashboardHeaderPanel />

          <div className="tabs-container" role="tablist">
            {pages.map(page => {
              const slug = slugify(page.type);
              return (
                <button
                  key={page.id}
                  className={`tab ${activeTabSlug === slug ? 'active' : ''}`}
                  onClick={() => handleTabClick(slug, page.id)}
                  aria-selected={activeTabSlug === slug}
                  role="tab"
                >
                  {page.type}
                </button>
              );
            })}
            <button
              className="add-tab-button"
              onClick={handleAddTab}
              aria-label="Add new page"
              title="Add new page"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <main className="dashboard-body">
        <div className="dashboard-content-wrapper" id="content-placeholder">
          <WebMetricsPanel pageId={activePageId} />
          <UBAPanel pageId={activePageId} />     {/* ← HERE */}
          <UIPanel pageId={activePageId} />
        </div>
      </main>
    </div>
  );
}
