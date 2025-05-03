// pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import DashboardHeaderPanel from '../components/dashboard/DashboardHeaderPanel';
import UBAPanel            from '../components/dashboard/UBAPanel';
import UIPanel             from '../components/dashboard/UIPanel';
import WebMetricsPanel     from '../components/dashboard/WebMetricsPanel';

export default function Dashboard() {
  const [pages,        setPages]        = useState([]);
  const [activeTabSlug,setActiveTabSlug]= useState('');

  /* turn “Landing Page” → “landing-page” */
  const slugify = str =>
    str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  /* grab user pages */
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
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ token }),
      mode   : 'cors',
    })
      .then(res => {
        console.log('[Dashboard] /user-pages status:', res.status);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('[Dashboard] Pages payload:', data);
        setPages(data);
        if (data.length) setActiveTabSlug(slugify(data[0].type));
      })
      .catch(err => console.error('[Dashboard] Fetch failed:', err));
  }, []);

  const handleTabClick = slug => setActiveTabSlug(slug);

  /* Current page object + id for UIPanel */
  const activePage    = pages.find(p => slugify(p.type) === activeTabSlug);
  const activePageId  = activePage ? activePage.id : null;

  return (
    <>
      <DashboardHeaderPanel />

      <main className="dashboard-body">
        {/* ───────── Tabs ───────── */}
        <div className="tabs-container">
          {pages.map(page => {
            const slug = slugify(page.type);
            return (
              <button
                key={page.id}
                className={`tab ${activeTabSlug === slug ? 'active' : ''}`}
                onClick={() => setActiveTabSlug(slug)}
              >
                {page.type}
              </button>
            );
          })}
        </div>

        {/* ───────── Panels ───────── */}
        <div id="content-placeholder">
          <WebMetricsPanel />
          <UBAPanel />
          {/* finally gives UIPanel what it wants */}
          <UIPanel pageId={activePageId} />
        </div>
      </main>
    </>
  );
}
