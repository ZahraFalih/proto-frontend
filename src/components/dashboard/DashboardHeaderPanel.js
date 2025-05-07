// src/components/dashboard/DashboardHeaderPanel.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/icons/logo.png";
import "../../styles/Dashboard.css";

export default function DashboardHeaderPanel() {
  const [userName, setUserName] = useState("Loading…");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState("data");

  const menuRef = useRef(null);
  const navigate = useNavigate();
  const token = sessionStorage.getItem("access_token");

  // Fetch user name
  useEffect(() => {
    if (!token) {
      navigate("/auth?mode=login");
      return;
    }
    fetch("http://localhost:8000/toolkit/user-name/", {
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
    setPanelTab(tab);
    setPanelOpen(true);
    setMenuOpen(false);
  };

  const doLogout = () => {
    fetch("http://127.0.0.1:8000/auth/logout/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).finally(() => {
      sessionStorage.removeItem("access_token");
      navigate("/auth?mode=login");
    });
  };

  return (
    <>
      {/* HEADER */}
      <header className="dashboard-header">
      <h3 className="header-title">SEPHORA</h3>
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
                <button className="menu-btn" onClick={() => openPanel("data")}>
                  My Data
                </button>
                <button className="menu-btn" onClick={() => openPanel("pref")}>
                  Preferences
                </button>
                <button className="menu-btn" onClick={() => openPanel("sett")}>
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
            <h3 className="modal-title">Log out</h3>
            <p className="modal-text">Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button className="modal-btn confirm" onClick={doLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA / PREF / SETT MODAL */}
      {panelOpen && (
        <div className="panel-overlay anim-fade" onClick={() => setPanelOpen(false)}>
          <div className="panel-box anim-scale" onClick={(e) => e.stopPropagation()}>
            <div className="panel-tabs">
              <button
                className={`panel-tab ${panelTab === "data" ? "active" : ""}`}
                onClick={() => setPanelTab("data")}
              >
                My Data
              </button>
              <button
                className={`panel-tab ${panelTab === "pref" ? "active" : ""}`}
                onClick={() => setPanelTab("pref")}
              >
                Preferences
              </button>
              <button
                className={`panel-tab ${panelTab === "sett" ? "active" : ""}`}
                onClick={() => setPanelTab("sett")}
              >
                Settings
              </button>
            </div>
            <div className="panel-content">
              {panelTab === "data" && <p className="placeholder">My Data panel (empty)</p>}
              {panelTab === "pref" && <p className="placeholder">Preferences panel (empty)</p>}
              {panelTab === "sett" && <p className="placeholder">Settings panel (empty)</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
