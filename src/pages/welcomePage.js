import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/WelcomePage.css'; 
import logo from "../assets/icons/logo.png";
import '../styles/global.css'; 

const WelcomePage = () => {
  const [currentPhrase, setCurrentPhrase] = useState('');
  
  const phrases = [
    "Design with confidence",
    "Prototype with precision",
    "Iterate with insights",
    "Launch with impact"
  ];

  useEffect(() => {
    let currentPhraseIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeoutId;

    const type = () => {
      const currentFullPhrase = phrases[currentPhraseIndex];
      
      if (isDeleting) {
        setCurrentPhrase(prev => prev.slice(0, -1));
        if (currentPhrase.length === 0) {
          isDeleting = false;
          currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
          timeoutId = setTimeout(type, 1500);
          return;
        }
        timeoutId = setTimeout(type, 75);
      } else {
        setCurrentPhrase(currentFullPhrase.slice(0, currentCharIndex + 1));
        currentCharIndex++;
        if (currentCharIndex > currentFullPhrase.length) {
          isDeleting = true;
          currentCharIndex = 0;
          timeoutId = setTimeout(type, 2000);
          return;
        }
        timeoutId = setTimeout(type, 150);
      }
    };

    type();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className='page-container'>
      <div className="left-section">
        <h1 className="app-name-left">proto</h1>
        <div className="typing-container">
          <div className="cursor"></div>
          <h2 className="typing-text">{currentPhrase}</h2>
        </div>
      </div>
      
      <div className="right-section">
        <div className='content-wrapper'>
          <p className="welcome-message">
            Welcome to the future of UX design
          </p>
          <div className='button-container'>
            <Link to='/signup' className='button-link'>
              <button className='signup-button'>
                Get Started
              </button>
            </Link>
            <Link to='/login' className='button-link'>
              <button className='login-button'>
                Sign In
              </button>
            </Link>
          </div>
          <img src={logo} alt="Proto logo" className="welcome-logo-bottom" />
        </div>
      </div>
    </div>
  );
}
  
export default WelcomePage;
