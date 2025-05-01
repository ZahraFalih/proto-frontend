import React, { useEffect, useState } from 'react';
import DashboardHeaderPanel from '../components/dashboard/DashboardHeaderPanel';
import UBAPanel from '../components/dashboard/UBAPanel';
import UIPanel from '../components/dashboard/UIPanel';
import WebMetricsPanel from '../components/dashboard/WebMetricsPanel';

export default function Dashboard() {
  const [pages, setPages] = useState([]);
  const [activeTabSlug, setActiveTabSlug] = useState('');

  const slugify = (str) =>
    str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    fetch('http://127.0.0.1:8000/toolkit/user-pages/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
      mode: 'cors',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPages(data);
        if (data.length) {
          setActiveTabSlug(slugify(data[0].type));
        }
      })
      .catch((err) => console.error('Failed fetching pages:', err));
  }, []);

  const handleTabClick = (slug) => setActiveTabSlug(slug);

  return (
    <>
      <DashboardHeaderPanel />
      <main className="dashboard-body">
        {/* Tabs */}
        <div className="tabs-container">
          {pages.map((page) => {
            const slug = slugify(page.type);
            return (
              <button
                key={page.id}
                className={`tab ${activeTabSlug === slug ? 'active' : ''}`}
                onClick={() => handleTabClick(slug)}
              >
                {page.type}
              </button>
            );
          })}
        </div>

        {/* Always-visible panels */}
        <div id="content-placeholder">
          <UBAPanel />
          <UIPanel />
          <WebMetricsPanel />
        </div>
      </main>
    </>
  );
}
