import React, { useState, useEffect } from 'react';

const messages = [
  "Analyzing your website's performance...",
  "Gathering insights from user behavior...",
  "Evaluating interface design patterns...",
  "Processing analytics data...",
  "Checking accessibility standards...",
  "Optimizing performance metrics...",
  "Reviewing user experience flows...",
  "Examining conversion pathways...",
  "Inspecting responsive layouts...",
  "Validating best practices..."
];

export default function LoadingText({ className = '', color = 'white' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % messages.length);
      setKey(prev => prev + 1); // Force animation restart
    }, 4000); // Change message every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`loading-text-container ${className}`}>
      <span 
        className="current-loading-text" 
        key={key}
        style={{ color }}
      >
        {messages[currentIndex]}
      </span>
    </div>
  );
} 