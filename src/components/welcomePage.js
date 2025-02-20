// src/components/WelcomePage.js

import React from 'react';
import { Link } from 'react-router-dom';

const WelcomePage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Welcome to your analytics right hand
      </h1>
      <div className="space-x-4">
        <Link to="/login">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Log In
          </button>
        </Link>
        <Link to="/signup">
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Sign Up
          </button>
        </Link>
      </div>
    </div>
  );
};

export default WelcomePage;
