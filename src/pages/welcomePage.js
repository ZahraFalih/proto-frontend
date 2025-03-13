// src/components/WelcomePage.js

import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/WelcomePage.css'; 

const WelcomePage = () => {
  return (
    <div className='welcome-container'>
      <h1 className='welcome-title'>
        WELCOME
      </h1> 
      <p className='welcome-subtitle'>
       Optimize Your E-commerce with AI-Driven Insights
      </p>
      <div className='button-container'>
        <Link to='/login'>
        <button className='login-button'>
          LOGIN
        </button>
        </Link>
        <Link to='/signup-button'>
        <button className='signup-button'>
          SIGN UP
        </button>
        </Link>
      </div>
    </div>
  );
}
  
export default WelcomePage;
