import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/WelcomePage.css';
import logo from '../assets/icons/logo.png';
import '../styles/global.css';

const WelcomePage = () => {
  const phrases = [
    'Design with confidence',
    'Prototype with precision',
    'Iterate with insights',
    'Launch with impact'
  ];

  const [displayText, setDisplayText]   = useState('');
  const [phraseIdx,   setPhraseIdx]     = useState(0);
  const [isDeleting,  setIsDeleting]    = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];

    let timeoutId;
    const TYPING_SPEED   = 90;   // ms between keystrokes
    const DELETING_SPEED = 40;   // ms between backspaces
    const HOLD_TIME      = 1800; // pause when phrase is complete

    if (isDeleting) {
      // delete one char
      timeoutId = setTimeout(() => {
        setDisplayText(prev => prev.slice(0, -1));

        // if nothing left, move to next phrase
        if (displayText.length === 0) {
          setIsDeleting(false);
          setPhraseIdx(prev => (prev + 1) % phrases.length);
        }
      }, DELETING_SPEED);
    } else {
      // type one char
      if (displayText.length < current.length) {
        timeoutId = setTimeout(() => {
          setDisplayText(current.slice(0, displayText.length + 1));
        }, TYPING_SPEED);
      } else {
        // finished typing; pause then start deleting
        timeoutId = setTimeout(() => setIsDeleting(true), HOLD_TIME);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [displayText, isDeleting, phraseIdx, phrases]);

  return (
    <div className="page-container">
      <div className="left-section">
        <h1 className="app-name-left">proto</h1>

        <div className="typing-container">
          <h2 className="typing-text">
            {displayText}
            <span className="cursor" />
          </h2>
        </div>
      </div>

      <div className="right-section">
        <div className="welcome-card">
          <header className="welcome-header">
            <img src={logo} alt="Proto logo" className="welcome-logo" />
          </header>

          <h2 className="welcome-title">Transform Your Design Process</h2>
          <p className="welcome-subtitle">
            Create, test, and iterate on your designs with powerful AI-driven insights
          </p>

          <div className="button-container">
            <Link to="/signup">
              <button className="btn-primary signup-btn">Get Started</button>
            </Link>
            <Link to="/login">
              <button className="btn-secondary login-btn">Sign In</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
