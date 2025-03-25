
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/WelcomePage.css'; 
import logo from "../assets/icons/logo.png";
import '../styles/global.css'; 

const WelcomePage = () => {
  return (
    <div className='page-container'>
    <div className="header">
      <img src={logo} alt="logo" className="header-logo" />    
      <div className="header-links">  
      <a href="#">INFO</a>
      <a href="#">ABOUT</a>
      </div>
    </div>
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
        <Link to='/signup'>
        <button className='signup-button'>
          SIGN UP
        </button>
        </Link>
      </div>
    </div>
    </div>
  );
}
  
export default WelcomePage;
