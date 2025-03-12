// src/components/WelcomePage.js

import React from 'react';
import { Link } from 'react-router-dom';
//import './WelcomePage.css';  // <-- Import the CSS here

const WelcomePage = () => {
  return (
    <div className="welcome-page">
      <h1 className="welcome-title">
        Welcome to Your Analytics Right Hand
      </h1>
      <div className="welcome-buttons">
        <Link to="/login">
          <button className="welcome-button">Log In</button>
        </Link>
        <Link to="/signup">
          <button className="welcome-button">Sign Up</button>
        </Link>
      </div>
    </div>
  );
};

export default WelcomePage;
