// src/components/dashboard/DashboardHeaderPanel.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/icons/logo.png";
import "../../styles/Dashboard.css";
import UserPreferencesModal from "../UserPreferencesModal";
import { getToken, clearToken } from '../../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';

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

  // Fetch user name
  useEffect(() => {
    if (!token) {
      navigate("/auth?mode=login");
      return;
    }
    fetch(buildApiUrl(API_ENDPOINTS.TOOLKIT.USER_NAME), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ first_name, last_name }) =>
        setUserName(`${first_name} ${last_name}`)
      )
      .catch(() => setUserName("Error"));
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