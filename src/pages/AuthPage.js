import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setToken } from '../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import { setPageTitle, PAGE_TITLES } from '../utils/pageTitle';

import logo from '../assets/icons/logo.png';
import '../styles/AuthPage.css';
import '../styles/global.css';

function AuthPage() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // signup only
  const [error, setError]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const location                    = useLocation();
  const params                      = new URLSearchParams(location.search);
  const initialMode                 = params.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode]             = useState(initialMode);
  const navigate                    = useNavigate();

  useEffect(() => {
    setPageTitle(PAGE_TITLES.auth[mode]);
  }, [mode]);

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // tiny helper: try signup, if "username exists" comes back, append rand and retry once
  const attemptSignup = async (username, body, tries = 0) => {
    const resp = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.SIGNUP), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, ...body }),
    });
    const data = await resp.json();

    // detect duplicate-username error and retry once
    if (!resp.ok &&
        data.username &&
        data.username.some(msg => msg.toLowerCase().includes('already')) &&
        tries < 1) {
      const fallback = `${username}${Math.floor(Math.random() * 1000)}`;
      return attemptSignup(fallback, body, tries + 1);
    }

    return { resp, data };
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    // signup validations
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
      let resp, data;

      if (mode === 'login') {
        resp = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        data = await resp.json();
      } else {
        // derive username from email
        const baseUsername = email.split('@')[0].replace(/[^\w.-]/g, '');
        const body = { email, password };
        ({ resp, data } = await attemptSignup(baseUsername, body));
      }

      if (resp.ok) {
        if (mode === 'login') {
          setToken(data.access);
          toast.success('Login successful! Redirecting…');
          setTimeout(() => {
            if (data.first_login) {
              navigate('/onboarding', { 
                state: { fromAuth: true, firstLogin: true }
              });
            } else {
              navigate('/dashboard');
            }
          }, 800);
        } else {
          toast.success('Account created! Redirecting to login…');
          setTimeout(() => setMode('login'), 1200);
        }
      } else {
        setError(
          data.error ||
          (data.username && data.username.join(' ')) ||
          'Authentication failed.'
        );
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <img src={logo} alt="Proto logo" className="auth-logo" />
        </header>
        <h2 className="auth-title">
          {mode === 'login' ? 'Welcome back!' : 'Create your account'}
        </h2>
        {error && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
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
            {loading
              ? mode === 'login'
                ? 'Logging in…'
                : 'Signing up…'
              : mode === 'login'
              ? 'Log In'
              : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <span className="auth-toggle" onClick={toggleMode}>
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </span>
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

export default AuthPage;
