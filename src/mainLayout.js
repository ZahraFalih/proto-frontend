import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/index.css'; // make sure your CSS is imported

const MainLayout = ({ children }) => {
  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <img src="/logo.png" alt="Logo" className="header-logo" />
        <div className="header-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </header>

      {/* Page content */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        © 2025 Your Company Name. All rights reserved.
      </footer>
    </div>
  );
};

export default MainLayout;
