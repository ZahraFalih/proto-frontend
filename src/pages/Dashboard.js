import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardHeaderPanel from '../components/dashboard/DashboardHeaderPanel';
import NavBar from '../components/dashboard/NavBar';
import AddPageModal from '../components/dashboard/AddPageModal';
import WebMetricsPanel from '../components/dashboard/WebMetricsPanel';
import UBAPanel from '../components/dashboard/UBAPanel';
import UIPanel from '../components/dashboard/UIPanel';
import AIChatPanel from '../components/dashboard/AIChatPanel';
import ProgressLoader from '../components/common/ProgressLoader';
import LoadingText from '../components/common/LoadingText';
import ScrollToTop from '../components/common/ScrollToTop';
import '../styles/Dashboard.css';
import { getToken } from '../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import { fetchWithRetry, parseJsonResponse } from '../utils/api';
import { setPageTitle, PAGE_TITLES } from '../utils/pageTitle';

export default function Dashboard() {
  const [pages, setPages] = useState([]);
  const [activeTabSlug, setActiveTabSlug] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProgressLoader, setShowProgressLoader] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Cache object to store tab content
  const [tabCache, setTabCache] = useState({});

  // ─── Chat context summaries ─────────────────────────────
  const [webMetricsSummary, setWebMetricsSummary] = useState(null);
  const [webRoleMetrics,     setWebRoleMetrics    ] = useState(null);
  const [webBusinessMetrics, setWebBusinessMetrics] = useState(null);

  const [ubaSummary,       setUbaSummary]       = useState('');
  const [uiEvalSummary,    setUiEvalSummary]    = useState('');
  
  // Add debugging for context data updates
  useEffect(() => {
    console.log('[Dashboard] AI Chat Context Updated:', {
      webMetricsSummary: webMetricsSummary ? 'Present' : 'Missing',
      webRoleMetrics: webRoleMetrics ? 'Present' : 'Missing',
      webBusinessMetrics: webBusinessMetrics ? 'Present' : 'Missing',
      ubaSummary: ubaSummary ? 'Present' : 'Missing',
      uiEvalSummary: uiEvalSummary ? Array.isArray(uiEvalSummary) ? `${uiEvalSummary.length} items` : 'Invalid format' : 'Missing'
    });
  }, [webMetricsSummary, webRoleMetrics, webBusinessMetrics, ubaSummary, uiEvalSummary]);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Update document title
  useEffect(() => {
    document.title = 'Dashboard';
  }, []);

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
    const currentPageId = new URLSearchParams(location.search).get('page_id');

    // Show progress loader in these cases:
    // 1. Coming from onboarding
    // 2. New tab creation (isNewPage true) AND no cache exists
    if (isFromOnboarding || (isNewPage && checkNeedsFreshData(currentPageId))) {
      setShowProgressLoader(true);
      // Mark as initialized
      sessionStorage.setItem('dashboard_initialized', 'true');
    }

    // Clean up the location state
    if (isFromOnboarding) {
      window.history.replaceState({}, document.title, location.pathname + location.search);
    }

    // Mark initial load as complete
    setIsInitialLoad(false);
  }, [location]);

  // Improved cache checking function
  const checkNeedsFreshData = (pageId) => {
    if (!pageId) return false;
    
    // Check if we have cached data for this page
    const wmCacheKey = `wm_cache_${pageId}`;
    const uiCacheKey = `ui_eval_page_${pageId}`;
    const ubaCacheKey = `uba_cache_${pageId}`;
    
    const hasWebMetricsCache = sessionStorage.getItem(wmCacheKey);
    const hasUiCache = sessionStorage.getItem(uiCacheKey);
    const hasUbaCache = localStorage.getItem(ubaCacheKey);
    
    // Also check our React state cache
    const hasStateCache = tabCache[pageId] && (
      tabCache[pageId].webMetricsSummary || 
      tabCache[pageId].ubaSummary || 
      tabCache[pageId].uiEvalSummary
    );
    
    // Show loader only if we have no cache at all
    return !(hasWebMetricsCache || hasUiCache || hasUbaCache || hasStateCache);
  };

  // Load pages on mount
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    
    const loadPages = async () => {
      try {
        const response = await fetchWithRetry(
          buildApiUrl(API_ENDPOINTS.TOOLKIT.USER_PAGES), 
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            credentials: 'include',
          }
        );
        
        const data = await parseJsonResponse(response);
        
        // Filter out duplicate page types, keeping only the most recent one
        const uniquePages = data.reduce((acc, page) => {
          const existingIndex = acc.findIndex(p => p.type === page.type);
          if (existingIndex === -1) {
            acc.push(page);
          } else {
            // Replace existing page with newer one
            acc[existingIndex] = page;
          }
          return acc;
        }, []);

        setPages(uniquePages || []);
        
        if (uniquePages && uniquePages.length) {
          const firstSlug = slugify(uniquePages[0].type);
          setActiveTabSlug(firstSlug);
          const params = new URLSearchParams();
          params.set('page_id', uniquePages[0].id);
          window.history.replaceState({}, '', `?${params}`);
        }
      } catch (error) {
        console.error('Failed to load pages after retries:', error);
        // Show error message to user here if needed
      } finally {
        setLoading(false);
      }
    };
    
    loadPages();
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

    // First check if we have cached content in our React state
    if (tabCache[slug]) {
      const cachedData = tabCache[slug];
      setWebMetricsSummary(cachedData.webMetricsSummary || '');
      setWebRoleMetrics(cachedData.webRoleMetrics || null);
      setWebBusinessMetrics(cachedData.webBusinessMetrics || null);
      setUbaSummary(cachedData.ubaSummary || '');
      setUiEvalSummary(cachedData.uiEvalSummary || '');
    }

    // Reset scroll positions
    const dashboardBody = document.querySelector('.dashboard-body');
    if (dashboardBody) {
      dashboardBody.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }

    // Reset any scrollable panels
    const scrollablePanels = document.querySelectorAll('.chat-messages, .wm-details-panel > div, .uba-formulation-text');
    scrollablePanels.forEach(panel => {
      if (panel) {
        panel.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
      }
    });

    // Check if we need fresh data
    const needsFreshData = checkNeedsFreshData(id);
    
    // Only show progress loader if we need fresh data AND have no cache
    if (needsFreshData) {
      setShowProgressLoader(true);
    }

    // Clear summaries only if we don't have cache
    if (!tabCache[slug]) {
      setWebMetricsSummary('');
      setWebRoleMetrics(null);
      setWebBusinessMetrics(null);
      setUbaSummary('');
      setUiEvalSummary('');
    }
  };

  // Cache tab content when it changes
  useEffect(() => {
    if (activeTabSlug && webMetricsSummary) {
      console.log('[Dashboard] Caching tab content for:', activeTabSlug, {
        webMetricsSummary: webMetricsSummary ? 'Present' : 'Missing',
        webRoleMetrics: webRoleMetrics ? 'Present' : 'Missing', 
        webBusinessMetrics: webBusinessMetrics ? 'Present' : 'Missing',
        ubaSummary: ubaSummary ? 'Present' : 'Missing',
        uiEvalSummary: uiEvalSummary ? 'Present' : 'Missing'
      });
      
      setTabCache(prev => ({
        ...prev,
        [activeTabSlug]: {
          webMetricsSummary,
          webRoleMetrics,
          webBusinessMetrics,
          ubaSummary,
          uiEvalSummary
        }
      }));
    }
  }, [activeTabSlug, webMetricsSummary, webRoleMetrics, webBusinessMetrics, ubaSummary, uiEvalSummary]);

  // Add modal open/close
  const handleAddClick = () => setShowAddModal(true);
  const handleCloseModal = () => setShowAddModal(false);

  // After adding a page
  const handlePageAdded = newPage => {
    // Check if page already exists to prevent duplication
    const pageExists = pages.some(p => p.id === newPage.id);
    if (pageExists) {
      // If page exists, just switch to it
      const newSlug = slugify(newPage.type);
      setActiveTabSlug(newSlug);
      window.history.pushState({}, '', `?page_id=${newPage.id}`);
      setShowAddModal(false);
      return;
    }

    // Add new page only if it doesn't exist
    setPages(prev => [...prev, newPage]);
    const newSlug = slugify(newPage.type);
    setActiveTabSlug(newSlug);
    window.history.pushState({}, '', `?page_id=${newPage.id}`);
    setShowAddModal(false);
    
    // Show progress loader for new page since it needs fresh data
    setShowProgressLoader(true);

    // Clear old context for new page
    setWebMetricsSummary('');
    setWebRoleMetrics(null);
    setWebBusinessMetrics(null);
    setUbaSummary('');
    setUiEvalSummary('');
  };

  // Delete a page
  const handlePageDeleted = id => {
    setPages(prev => {
      const filtered = prev.filter(p => p.id !== id);
      const deletedPage = prev.find(p => p.id === id);
      const deletedSlug = slugify(deletedPage?.type);
      
      // Remove deleted page from cache
      setTabCache(prev => {
        const newCache = { ...prev };
        delete newCache[deletedSlug];
        return newCache;
      });

      if (slugify(deletedPage?.type) === activeTabSlug) {
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

      // Clear old context for deleted page
      setWebMetricsSummary('');
      setWebRoleMetrics(null);
      setWebBusinessMetrics(null);
      setUbaSummary('');
      setUiEvalSummary('');

      return filtered;
    });
  };

  // Determine active page
  const activePage = pages.find(p => slugify(p.type) === activeTabSlug);
  const activePageId = activePage?.id || null;

  // Update title when active page changes
  useEffect(() => {
    if (activePage) {
      setPageTitle(`${activePage.type} - ${PAGE_TITLES.dashboard}`);
    } else {
      setPageTitle(PAGE_TITLES.dashboard);
    }
  }, [activeTabSlug, pages]);

  return (
    <>
      <ScrollToTop />
      {showProgressLoader && <ProgressLoader onComplete={handleProgressComplete} />}

      <div className="dashboard-container">
        <div className="dashboard-header-section">
          <div className="dashboard-content-wrapper">
            <DashboardHeaderPanel 
              pages={pages}
              onPageDeleted={handlePageDeleted}
            />            
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
              <div className="dashboard-panels">
                <div className="dashboard-main-panels">
                  <WebMetricsPanel
                    pageId={activePageId}
                    onRoleMetricsReady    ={setWebRoleMetrics}
                    onBusinessMetricsReady={setWebBusinessMetrics}
                    onSummaryReady        ={setWebMetricsSummary}
                  />
                  <UBAPanel
                    pageId={activePageId}
                    onSummaryReady={setUbaSummary}
                  />
                  <UIPanel
                    pageId={activePageId}
                    onSummaryReady={setUiEvalSummary}
                  />
                  <AIChatPanel
                    context={{
                      roleMetrics:     webRoleMetrics,
                      businessMetrics: webBusinessMetrics,
                      summary:         webMetricsSummary,
                      uba:            ubaSummary,
                      ui:             uiEvalSummary
                    }}
                    key={`chat-${activePageId}`}
                  />
                </div>
              </div>
            )}
          </div>
        </main>

        <AddPageModal
          visible={showAddModal}
          onClose={handleCloseModal}
          onPageAdded={handlePageAdded}
          existingPageTypes={pages.map(p => p.type)}
        />
      </div>
    </>
  );
}
