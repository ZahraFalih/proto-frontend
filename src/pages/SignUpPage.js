import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import logo from '../assets/icons/logo.png';
import '../styles/SignUpPage.css';

function SignUpPage() {
  const [username, setUsername]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]               = useState(null);
  const [fieldErrors, setFieldErrors]   = useState({});
  const [loading, setLoading]           = useState(false);

  const [welcomeText, setWelcomeText]   = useState('Welcome! Create your account.');
  const [focused, setFocused]           = useState(false);
  const navigate = useNavigate();

  // update welcome text
  useEffect(() => {
    if (username.trim().length > 0) {
      setWelcomeText(`Hey ${username.trim()}! ✨`);
    } else {
      setWelcomeText('Welcome! Create your account.');
    }
  }, [username]);

  // track typed username
  const hasUsername = username.trim().length > 0;

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // client‐side confirm check
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch('http://127.0.0.1:8000/auth/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password }),
      });
      const data = await resp.json();

      if (resp.ok) {
        sessionStorage.setItem('access_token', data.access);
        toast.success('Account created! Redirecting to login…');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        // map server errors to each field
        const errs = {};
        if (data.error) {
          setError(data.error);
        } else {
          Object.entries(data).forEach(([key, val]) => {
            errs[key] = Array.isArray(val) ? val.join(' ') : val;
          });
        }
        setFieldErrors(errs);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // clear a single field error on change
  const onFieldChange = (field, setter) => e => {
    setter(e.target.value);
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
    setError(null);
  };

  const handleFocus  = () => setFocused(true);
  const handleBlur   = () => setFocused(false);

  return (
    <div className="signup-page">
      <div className="signup-card">
        <header className="signup-header">
          <img src={logo} alt="proto logo" className="signup-logo" />
          <h1 className="signup-brand">proto</h1>
        </header>

        <h2
          className={
            `signup-welcome` +
            (hasUsername   ? ' visible' : '') +
            (focused       ? ' active'  : '')
          }
        >
          {welcomeText}
        </h2>

        {error && <div className="error-message">{error}</div>}

        <form className="signup-form" onSubmit={handleSignUp}>
          {/** Username **/}
          <div className={`form-group ${fieldErrors.username ? 'has-error' : ''}`}>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder=" "
              value={username}
              onChange={onFieldChange('username', setUsername)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
            />
            <label htmlFor="username" className="floating-label">Username</label>
            {fieldErrors.username && (
              <span className="field-error">{fieldErrors.username}</span>
            )}
          </div>

          {/** Email **/}
          <div className={`form-group ${fieldErrors.email ? 'has-error' : ''}`}>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder=" "
              value={email}
              onChange={onFieldChange('email', setEmail)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
            />
            <label htmlFor="email" className="floating-label">Email address</label>
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          {/** Password **/}
          <div className={`form-group ${fieldErrors.password ? 'has-error' : ''}`}>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder=" "
              value={password}
              onChange={onFieldChange('password', setPassword)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
            />
            <label htmlFor="password" className="floating-label">Password</label>
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          {/** Confirm Password **/}
          <div className={`form-group ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder=" "
              value={confirmPassword}
              onChange={onFieldChange('confirmPassword', setConfirmPassword)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
            />
            <label htmlFor="confirmPassword" className="floating-label">
              Confirm Password
            </label>
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing up…' : 'Sign Up'}
          </button>
        </form>

        <p className="signup-footer">
          Already have an account? <Link to="/login">Log in</Link>
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

export default SignUpPage;