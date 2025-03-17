import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/SignUpPage.css'; 

const SignUpPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("access_token", data.access);
        alert("User created successfully!");
        navigate("/login");
      } else {
        const errorMessage =
          data.error ||
          Object.values(data).join(" ") ||
          "Something went wrong.";
        setError(errorMessage);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

    return (
      <div className="signup-container">
        <h1 className="signup-title">Sign Up</h1>
  
        {error && <p className="error-message">{error}</p>}
  
        <form onSubmit={handleSignUp} className="signup-form">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="signup-input"
            placeholder="First Name"
          />
  
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="signup-input"
            placeholder="Last Name"
          />
  
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="signup-input"
            placeholder="Username"
          />
  
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="signup-input"
            placeholder="Email"
          />
  
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="signup-input"
            placeholder="Password"
          />
  
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="signup-input"
            placeholder="Confirm Password"
          />
  
          <button type="submit" disabled={loading} className="signup-button">
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
      </div>
    );
  };
  
  export default SignUpPage;
  