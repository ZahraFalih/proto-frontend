// WelcomePage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/WelcomePage.css';
import logo from '../assets/icons/logo.png';
import '../styles/global.css';
import { setPageTitle, PAGE_TITLES } from '../utils/pageTitle';

const WelcomePage = () => {
  useEffect(() => {
    setPageTitle(PAGE_TITLES.welcome);
  }, []);

  const phrases = [
    'Make sense of your Analytics',
    'Enhance Your UI',
    'Understand & Take Action',
    'Consult the AI',
    'Level Up Your Game!',
  ];

  const [displayText, setDisplayText] = useState('');
  const [phraseIdx,   setPhraseIdx]   = useState(0);
  const [isDeleting,  setIsDeleting]  = useState(false);

  /* typewriter hook (unchanged) */
  useEffect(() => {
    const current = phrases[phraseIdx];
    const TYPING_SPEED   = 90;
    const DELETING_SPEED = 40;
    const HOLD_TIME      = 1800;

    const timeoutId = setTimeout(() => {
      if (isDeleting) {
        setDisplayText(prev => {
          const next = prev.slice(0, -1);
          if (!next.length) {
            setIsDeleting(false);
            setPhraseIdx(i => (i + 1) % phrases.length);
          }
          return next;
        });
      } else if (displayText.length < current.length) {
        setDisplayText(current.slice(0, displayText.length + 1));
      } else {
        setIsDeleting(true);
      }
    }, isDeleting ? DELETING_SPEED : displayText.length === current.length ? HOLD_TIME : TYPING_SPEED);

    return () => clearTimeout(timeoutId);
  }, [displayText, isDeleting, phraseIdx, phrases]);

  return (
    <div className="page-container">
      {/* ⬇️ NEW WRAPPER */}
      <div className="sections-wrapper">
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

            <h2 className="welcome-title">Enahnce Your User Experience!</h2>
            <p className="welcome-subtitle">
              Discover trends in your analytics, get evaluation of the UI, and compare performance to competitors
            </p>

            <div className="button-container">
              <Link to="/auth?mode=signup"><button className="btn-primary">Join Us!</button></Link>
              <Link to="/auth?mode=login"><button className="btn-secondary">Sign In</button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
