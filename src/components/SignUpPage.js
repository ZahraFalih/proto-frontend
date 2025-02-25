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
  const [error, setError] = useState(null); // Error handling
  const [loading, setLoading] = useState(false); // Loading state

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Password match validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true); // Set loading state

    try {
      const response = await fetch("http://127.0.0.1:8000/api/signup/", { // Adjust URL if needed
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          username: username,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("User created successfully!");
        navigate("/onboarding"); // Redirect user after successful sign-up
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
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
        Sign Up
      </h1>

      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message */}

      <form onSubmit={handleSignUp} style={{ width: '300px', textAlign: 'left' }}>
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Username</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Confirm Password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
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
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;
