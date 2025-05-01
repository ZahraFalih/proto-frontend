import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import logo from '../assets/icons/logo.png';
import '../styles/AuthPage.css';
import '../styles/global.css';

function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // signup only
  const [confirmPassword, setConfirmPassword] = useState(''); // signup only
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState(initialMode);

  const navigate = useNavigate();

  const toggleMode = () => {
    setMode(prev => (prev === 'login' ? 'signup' : 'login'));
    setError(null);
    setEmail('');
    setPassword('');
    setUsername('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const resp = await fetch(`http://127.0.0.1:8000/auth/${mode}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(
          mode === 'login'
            ? { email, password }
            : { username, email, password }
        ),
      });
      const data = await resp.json();

      if (resp.ok) {
        sessionStorage.setItem('access_token', data.access);
        if (mode === 'login') {
          toast.success('Login successful! Redirecting…');
          setTimeout(() => {
            navigate(data.first_login ? '/onboarding' : '/dashboard');
          }, 800);
        } else {
          toast.success('Account created! Redirecting to login…');
          setTimeout(() => {
            setMode('login');
          }, 1200);
        }
      } else {
        setError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <header className="auth-header">
          <img src={logo} alt="Proto logo" className="auth-logo" />
        </header>

        {/* Title */}
        <h2 className="auth-title">
          {mode === 'login' ? 'Welcome back!' : 'Create your account'}
        </h2>

        {/* Error */}
        {error && <div className="auth-error">{error}</div>}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder=" "
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
              <label htmlFor="username" className="floating-label">
                Username
              </label>
            </div>
          )}

          <div className="form-group">
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder=" "
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <label htmlFor="email" className="floating-label">
              Email address
            </label>
          </div>

          <div className="form-group">
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder=" "
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <label htmlFor="password" className="floating-label">
              Password
            </label>
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder=" "
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <label htmlFor="confirmPassword" className="floating-label">
                Confirm Password
              </label>
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? (mode === 'login' ? 'Logging in…' : 'Signing up…') : (mode === 'login' ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        {/* Toggle link */}
        <p className="auth-footer">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
          <span className="auth-toggle" onClick={toggleMode}>
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </span>
        </p>
      </div>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        pauseOnHover={false}
      />
    </div>
  );
}

export default AuthPage;
