import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css'; 
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
        toast.success("Login successful!");
        if (data.first_login) {
          navigate("/onboarding");  
        } else {
          navigate("/manage-data");  
        }
        console.log("Access Token:", data.access);
        console.log("Refresh Token:", data.refresh);
      } else {
        toast.error("Invalid credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Login</h1>
  
      {error && <p className="error-message">{error}</p>}
  
      <form onSubmit={handleLogin} className="login-form">
        <div className="input-container">
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            className="login-input" 
            placeholder="Username" 
          />
        </div>
  
        <div className="input-container">
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="login-input" 
            placeholder="Password" 
          />
        </div>
  
        <button type="submit" disabled={loading} className="login-button">
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;