// src/components/SignUpPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
  // State variables for each input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');

  const navigate = useNavigate();

  const handleSignUp = (e) => {
    e.preventDefault();
    // Redirect to the onboarding page when the form is submitted
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
        <form onSubmit={handleSignUp}>
          {/* Email Entry */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Entry */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Name Entry */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Dropdown for Gender */}
          <div className="mb-4">
            <label htmlFor="gender" className="block text-gray-700 text-sm font-semibold mb-2">
              Gender
            </label>
            <select
              id="gender"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Dropdown for Place of Birth */}
          <div className="mb-6">
            <label htmlFor="placeOfBirth" className="block text-gray-700 text-sm font-semibold mb-2">
              Place of Birth
            </label>
            <select
              id="placeOfBirth"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={placeOfBirth}
              onChange={(e) => setPlaceOfBirth(e.target.value)}
            >
              <option value="">Select Place of Birth</option>
              <option value="earth">Earth</option>
              <option value="mars">Mars</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
