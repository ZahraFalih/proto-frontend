// src/components/LoginPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    console.log({ username, password });

    // Redirect to the welcome page
    navigate('/');
  };

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
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'underline' }}>
        Login
      </h1>
      <form onSubmit={handleLogin} style={{ width: '300px', textAlign: 'left' }}>
        <label>Username</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{
          width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace'
        }} />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{
          width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace'
        }} />

        <button type="submit" style={{
          background: 'none',
          color: '#000',
          padding: '5px 15px',
          border: '1px solid #000',
          cursor: 'pointer',
          marginTop: '10px',
          fontFamily: 'Courier New, monospace'
        }}>
          Log In
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
