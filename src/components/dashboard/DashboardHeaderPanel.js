// src/components/dashboard/DashboardHeaderPanel.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/icons/logo.png";
import "../../styles/Dashboard.css";
import UserPreferencesModal from "../UserPreferencesModal";
import { getToken, clearToken } from '../../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';
import { fetchWithRetry } from '../../utils/api';

const slugify = (str = "") =>
  str.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

export default function DashboardHeaderPanel({ pages = [], onPageDeleted }) {
  const [userName, setUserName] = useState("Loading…");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [localPages, setLocalPages] = useState(pages);

  const menuRef = useRef(null);
  const navigate = useNavigate();
  const token = getToken();

  // Update local pages when props change
  useEffect(() => {
    setLocalPages(pages);
  }, [pages]);

  const refreshPages = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ONBOARD.PAGES), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch pages');
      
      const data = await response.json();
      setLocalPages(data);
    } catch (error) {
      console.error('Error refreshing pages:', error);
    }
  };

  // Fetch user name with retries
  useEffect(() => {
    if (!token) {
      navigate("/auth?mode=login");
      return;
    }

    const fetchUserName = async () => {
      try {
        console.log('[DashboardHeader] Fetching user name...');
        const url = buildApiUrl(API_ENDPOINTS.TOOLKIT.USER_NAME);
        
        // Use fetchWithRetry with 3 attempts
        const response = await fetchWithRetry(
          url, 
          { 
            headers: { Authorization: `Bearer ${token}` } 
          },
          3,  // max retries
          500 // delay between retries
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user name: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.first_name && data.last_name) {
          const fullName = `${data.first_name} ${data.last_name}`;
          console.log('[DashboardHeader] User name loaded:', fullName);
          setUserName(fullName);
          
          // Also cache the user name in session storage
          sessionStorage.setItem('user_name', fullName);
        } else {
          throw new Error('Invalid user data format');
        }
      } catch (error) {
        console.error('[DashboardHeader] Error fetching user name:', error);
        
        // Try to use cached name if available
        const cachedName = sessionStorage.getItem('user_name');
        if (cachedName) {
          console.log('[DashboardHeader] Using cached user name');
          setUserName(cachedName);
        } else {
          setUserName("User");
        }
      }
    };
    
    fetchUserName();
  }, [token, navigate]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openPanel = (tab) => {
    setPreferencesOpen(true);
    setMenuOpen(false);
  };

  const doLogout = () => {
    // First clear the token and navigate away
    clearToken();
    navigate("/auth?mode=login");
    
    // Then try to notify the backend (but don't wait for it)
    fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGOUT), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(error => {
      // Ignore any errors since we've already logged out locally
      console.log('Logout notification to backend failed:', error);
    });
  };

  const handleDelete = async (id, type) => {
    try {                                
      const url = buildApiUrl(API_ENDPOINTS.ONBOARD.DELETE_PAGE(id, type));
      
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      onPageDeleted?.(id); 
    } catch (err) {
      console.error("[Header] Failed to delete page:", err);
    }
  };

  return (
    <>
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-content">
          <img src={logo} alt="logo" className="header-logo" />

          <div className="header-user" ref={menuRef}>
            <button
              className={`user-button ${menuOpen ? "active" : ""}`}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {userName} <span className="arrow">▾</span>
            </button>

            {menuOpen && (
              <div className="user-menu anim-dropdown">
                <button className="menu-btn" onClick={() => {
                  setPreferencesOpen(true);
                  setMenuOpen(false);
                }}>
                  My Data
                </button>
                <button className="menu-btn" onClick={() => {
                  setPreferencesOpen(true);
                  setMenuOpen(false);
                }}>
                  Settings
                </button>

                <div className="menu-divider" />

                <button
                  className="logout-button"
                  onClick={() => {
                    setConfirmOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* LOGOUT MODAL */}
      {confirmOpen && (
        <div className="modal-overlay anim-fade" onClick={() => setConfirmOpen(false)}>
          <div className="modal-box logout-modal anim-scale" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">😞</div>
            <p className="modal-text">Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button className="modal-btn confirm" onClick={doLogout}>
                I have to..
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Preferences Modal */}
      <UserPreferencesModal 
        isOpen={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        pages={localPages}
        onPageDeleted={onPageDeleted}
        refreshPages={refreshPages}
      />
    </>
  );
}