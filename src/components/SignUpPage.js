// src/components/SignUpPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
  // State variables for each input
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();

  const handleSignUp = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Proceed with sign-up logic (API call, etc.)
    console.log({ name, username, email, password });
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
        Sign Up
      </h1>
      <form onSubmit={handleSignUp} style={{ width: '300px', textAlign: 'left' }}>
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Username</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Confirm Password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <button type="submit" style={{
          background: 'none',
          color: '#000',
          padding: '5px 15px',
          border: '1px solid #000',
          cursor: 'pointer',
          marginTop: '10px',
          fontFamily: 'Courier New, monospace'
        }}>
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;