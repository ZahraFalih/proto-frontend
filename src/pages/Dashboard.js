// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardHeaderPanel from '../components/dashboard/DashboardHeaderPanel';
import NavBar from '../components/dashboard/NavBar';
import AddPageModal from '../components/dashboard/AddPageModal';
import WebMetricsPanel from '../components/dashboard/WebMetricsPanel';
import UBAPanel from '../components/dashboard/UBAPanel';
import UIPanel from '../components/dashboard/UIPanel';
import ProgressLoader from '../components/common/ProgressLoader';
import LoadingText from '../components/common/LoadingText';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [pages, setPages] = useState([]);
  const [activeTabSlug, setActiveTabSlug] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProgressLoader, setShowProgressLoader] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Safe slugify
  const slugify = str =>
    (str || '')
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

  // Check if this is a new page load or coming from onboarding
  useEffect(() => {
    const isNewPage = sessionStorage.getItem('dashboard_initialized') !== 'true';
    const isFromOnboarding = location.state?.fromOnboarding;
    
    if (isNewPage || isFromOnboarding) {
      setShowProgressLoader(true);
      sessionStorage.setItem('dashboard_initialized', 'true');
    }
    
    // Clean up the location state
    if (isFromOnboarding) {
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  // Load pages on mount
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) return;

    setLoading(true);
    fetch('http://127.0.0.1:8000/toolkit/user-pages/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => {
        setPages(data || []);
        if (data && data.length) {
          const firstSlug = slugify(data[0].type);
          setActiveTabSlug(firstSlug);
          const params = new URLSearchParams();
          params.set('page_id', data[0].id);
          window.history.replaceState({}, '', `?${params}`);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  // Handle progress loader completion
  const handleProgressComplete = () => {
    setShowProgressLoader(false);
  };

  // Tab clicks
  const handleTabClick = (slug, id) => {
    setActiveTabSlug(slug);
    const params = new URLSearchParams(window.location.search);
    params.set('page_id', id);
    window.history.pushState({}, '', `?${params}`);
  };

  // Add modal open/close
  const handleAddClick = () => setShowAddModal(true);
  const handleCloseModal = () => setShowAddModal(false);

  // After adding a page
  const handlePageAdded = newPage => {
    setPages(prev => [...prev, newPage]);
    const newSlug = slugify(newPage.type);
    setActiveTabSlug(newSlug);
    window.history.pushState({}, '', `?page_id=${newPage.id}`);
    setShowAddModal(false);
    // Show progress loader after adding a new page
    setShowProgressLoader(true);
  };

  // Delete a page
  const handlePageDeleted = id => {
    setPages(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (slugify(prev.find(p => p.id === id)?.type) === activeTabSlug) {
        if (filtered.length) {
          const next = filtered[0];
          const nextSlug = slugify(next.type);
          setActiveTabSlug(nextSlug);
          window.history.pushState({}, '', `?page_id=${next.id}`);
        } else {
          setActiveTabSlug('');
          window.history.pushState({}, '', window.location.pathname);
        }
      }
      return filtered;
    });
  };

  // Which page is active?
  const activePage = pages.find(p => slugify(p.type) === activeTabSlug);
  const activePageId = activePage?.id || null;

  return (
    <>
      {showProgressLoader && <ProgressLoader onComplete={handleProgressComplete} />}
      
      <div className="dashboard-container">
        <div className="dashboard-header-section">
          <div className="dashboard-content-wrapper">
            <DashboardHeaderPanel />
            <NavBar
              pages={pages}
              activeTabSlug={activeTabSlug}
              onTabClick={handleTabClick}
              onDeletePage={handlePageDeleted}
              onAddClick={handleAddClick}
              loading={loading}
            />
          </div>
        </div>

        <main className="dashboard-body">
          <div className="dashboard-content-wrapper">
            {loading ? (
              <div className="dashboard-loading">
                <LoadingText color="#0055FF" />
              </div>
            ) : (
              <>
                <WebMetricsPanel pageId={activePageId} />
                <UBAPanel pageId={activePageId} />
                <UIPanel pageId={activePageId} />
              </>
            )}
          </div>
        </main>

        <AddPageModal
          visible={showAddModal}
          onClose={handleCloseModal}
          onPageAdded={handlePageAdded}
          onPageDeleted={handlePageDeleted}
          existingPageTypes={pages.map(p => p.type)}
        />
      </div>
    </>
  );
}
