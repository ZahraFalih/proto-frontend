import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("access_token", data.access);
        sessionStorage.setItem("refresh_token", data.refresh);
        alert("Login successful!");
        navigate("/onboarding");
        console.log("Access Token:", data.access);
        console.log("Refresh Token:", data.refresh);
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
    <div className="login-page">
      <h1 className="login-title">Login</h1>

      {error && <p className="login-error">{error}</p>}

      <form onSubmit={handleLogin} className="login-form">
        <label className="login-label">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="login-input"
        />

        <label className="login-label">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />

        <button
          type="submit"
          disabled={loading}
          className="login-button"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;