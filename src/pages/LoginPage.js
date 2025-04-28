import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import logo from '../assets/icons/logo.png';
import '../styles/LoginPage.css';

function LoginPage() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch('http://127.0.0.1:8000/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json();

      if (resp.ok) {
        sessionStorage.setItem('access_token', data.access);
        sessionStorage.setItem('refresh_token', data.refresh);
        toast.success('Login successful! Redirecting…');
        setTimeout(() => {
          if (data.first_login) navigate('/onboarding');
          else navigate('/manage-data');
        }, 800);
      } else {
        setError(data.detail || 'Invalid credentials.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page login-page">
      <div className="signup-card login-card">
        <header className="signup-header login-header">
          <img src={logo} alt="proto logo" className="signup-logo login-logo" />
          <h1 className="signup-brand login-brand">proto</h1>
        </header>

        <h2 className="signup-welcome login-welcome visible">
          Welcome back! Log in to your account.
        </h2>

        {error && <div className="error-message login-error">{error}</div>}

        <form className="signup-form login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <input
              id="email"
              type="email"
              className="form-input login-input"
              placeholder=" "
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <label htmlFor="email" className="floating-label">
              Email address
            </label>
          </div>

          <div className="form-group">
            <input
              id="password"
              type="password"
              className="form-input login-input"
              placeholder=" "
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <label htmlFor="password" className="floating-label">
              Password
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary login-button"
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="signup-footer login-footer">
          Don’t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        pauseOnHover={false}
      />
    </div>
  );
}

export default LoginPage;