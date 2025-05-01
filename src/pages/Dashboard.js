import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/icons/logo.png";
import "../styles/DashboardPage.css";

export default function Dashboard() {
  /* ───────────────────────── state ───────────────────────── */
  const [userName,   setUserName]   = useState("Loading…");
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [confirmOpen,setConfirmOpen]= useState(false);  // logout modal
  const [panelOpen,  setPanelOpen]  = useState(false);  // data/pref/sett modal
  const [panelTab,   setPanelTab]   = useState("data"); // active tab

  const menuRef = useRef(null);
  const nav     = useNavigate();
  const token   = sessionStorage.getItem("access_token");

  /* ───────── fetch user name ───────── */
  useEffect(() => {
    if (!token) { nav("/auth?mode=login"); return; }
    fetch("http://localhost:8000/toolkit/user-name/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(({ first_name, last_name }) =>
        setUserName(`${first_name} ${last_name}`)
      )
      .catch(() => setUserName("Error"));
  }, [token, nav]);

  /* ───────── close menu on outside click ───────── */
  useEffect(() => {
    const handleClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ───────── helpers ───────── */
  const openPanel = tab => {
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
      nav("/auth?mode=login");
    });
  };

  /* ───────────────────────── JSX ───────────────────────── */
  return (
    <>
      {/* ───────────── HEADER ───────────── */}
      <header className="header">
        <div className="header-content">
          <img src={logo} alt="logo" className="header-logo" />

          <div className="header-user" ref={menuRef}>
            <button
              className={`user-button ${menuOpen ? "active" : ""}`}
              onClick={() => setMenuOpen(o => !o)}
            >
              {userName}
              <span className="arrow">▾</span>
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

      {/* empty body for now */}
      <main className="dashboard-body" />

      {/* ───────────── LOGOUT MODAL ───────────── */}
      {confirmOpen && (
        <div
          className="modal-overlay anim-fade"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="modal-box anim-scale"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-icon">😞</div>
            <p className="modal-text">Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button className="modal-btn confirm" onClick={doLogout}>
                I have to..
              </button>
              <button
                className="modal-btn cancel"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── DATA / PREF / SETT MODAL ───────────── */}
      {panelOpen && (
        <div
          className="panel-overlay anim-fade"
          onClick={() => setPanelOpen(false)}
        >
          <div
            className="panel-box anim-scale"
            onClick={e => e.stopPropagation()}
          >
            {/* tabs */}
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

            {/* placeholder bodies */}
            <div className="panel-content">
              {panelTab === "data" && (
                <p className="placeholder">My Data panel (empty)</p>
              )}
              {panelTab === "pref" && (
                <p className="placeholder">Preferences panel (empty)</p>
              )}
              {panelTab === "sett" && (
                <p className="placeholder">Settings panel (empty)</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
