import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({username, email, password, first_name, last_name}),
      });

      const data = await response.json();
      const errorMessage = data.error || Object.values(data).join(" ") || "Something went wrong.";

      if (response.ok) {
        sessionStorage.setItem("access_token", data.access);
        alert("User created successfully!");
        navigate("/login");
      } else {
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <h1 className="signup-title">Sign Up</h1>

      {error && <p className="signup-error">{error}</p>}

      <form onSubmit={handleSignUp} className="signup-form">
        <label className="signup-label">First Name</label>
        <input
          type="text"
          value={first_name}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="signup-input"
        />

        <label className="signup-label">Last Name</label>
        <input
          type="text"
          value={last_name}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="signup-input"
        />

        <label className="signup-label">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="signup-input"
        />

        <label className="signup-label">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="signup-input"
        />

        <label className="signup-label">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="signup-input"
        />

        <label className="signup-label">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="signup-input"
        />

        <button
          type="submit"
          disabled={loading}
          className="signup-button"
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;