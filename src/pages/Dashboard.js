// pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import DashboardHeaderPanel from '../components/dashboard/DashboardHeaderPanel';
import UBAPanel from '../components/dashboard/UBAPanel';
import UIPanel from '../components/dashboard/UIPanel';
import WebMetricsPanel from '../components/dashboard/WebMetricsPanel';
import AddPageModal from '../components/dashboard/AddPageModal';
import NavBar from '../components/dashboard/NavBar';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [pages, setPages] = useState([]);
  const [activeTabSlug, setActiveTabSlug] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);


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
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  const handlePageAdded = newPage => {
    setPages(prev => [...prev, newPage]);
    const newSlug = slugify(newPage.type);
    setActiveTabSlug(newSlug);
    window.history.pushState({}, '', `?page_id=${newPage.id}`);
  };

  const handlePageDeleted = deletedId => {
    setPages(prev => prev.filter(p => p.id !== deletedId));
    // if active page deleted, switch to first available
    if (slugify(pages.find(p => p.id === deletedId)?.type) === activeTabSlug) {
      const remaining = pages.filter(p => p.id !== deletedId);
      if (remaining.length) {
        const first = remaining[0];
        const firstSlug = slugify(first.type);
        setActiveTabSlug(firstSlug);
        window.history.pushState({}, '', `?page_id=${first.id}`);
      } else {
        setActiveTabSlug('');
        window.history.pushState({}, '', window.location.pathname);
      }
    }
  };

  const activePage = pages.find(p => slugify(p.type) === activeTabSlug);
  const activePageId = activePage ? activePage.id : null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-section">
        <div className="dashboard-content-wrapper">
          <DashboardHeaderPanel />
          <NavBar
            pages={pages}
            activeTabSlug={activeTabSlug}
            onTabClick={handleTabClick}
            onAddClick={handleAddTab}
          />
        </div>
      </div>
      <main className="dashboard-body">
        <div className="dashboard-content-wrapper" id="content-placeholder">
          <WebMetricsPanel pageId={activePageId} />
          <UBAPanel pageId={activePageId} />    s
          <UIPanel pageId={activePageId} />
        </div>
      </main>
      <AddPageModal
        visible={showAddModal}
        onClose={handleCloseModal}
        onPageAdded={handlePageAdded}
        pages={pages}
        onPageDeleted={handlePageDeleted}
        existingPageTypes={pages.map(p => p.type)}
      />
    </div>
  );
}