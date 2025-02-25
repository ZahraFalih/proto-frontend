// src/components/LoginPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // For error messages
  const [loading, setLoading] = useState(false); // Loading state

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login/", { // Adjust API URL if needed
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token); // Store the authentication token
        alert("Login successful!");
        navigate("/"); // Redirect to home or another protected route
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
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

      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message */}

      <form onSubmit={handleLogin} style={{ width: '300px', textAlign: 'left' }}>
        <label>Username</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <button type="submit" disabled={loading} style={{
          background: 'none',
          color: '#000',
          padding: '5px 15px',
          border: '1px solid #000',
          cursor: 'pointer',
          marginTop: '10px',
          fontFamily: 'Courier New, monospace'
        }}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
