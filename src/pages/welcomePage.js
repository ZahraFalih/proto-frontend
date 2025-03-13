// src/components/WelcomePage.js

import React from 'react';
import { Link } from 'react-router-dom';

const WelcomePage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      fontFamily: 'Courier New, monospace',
      color: '#000',
      textAlign: 'center'
    }}>
      <h1 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        textDecoration: 'underline'
      }}>
        Welcome to Your Analytics Right Hand
      </h1>
      <div style={{ marginTop: '20px' }}>
        <Link to="/login">
          <button style={{
            background: 'none',
            color: '#000',
            padding: '5px 15px',
            border: '1px solid #000',
            cursor: 'pointer',
            margin: '5px',
            fontFamily: 'Courier New, monospace'
          }}>
            Log In
          </button>
        </Link>
        <Link to="/signup">
          <button style={{
            background: 'none',
            color: '#000',
            padding: '5px 15px',
            border: '1px solid #000',
            cursor: 'pointer',
            margin: '5px',
            fontFamily: 'Courier New, monospace'
          }}>
            Sign Up
          </button>
        </Link>
      </div>
    </div>
  );
};

export default WelcomePage;
