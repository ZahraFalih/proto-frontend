import React, { useState, useEffect } from 'react';
import '../../styles/ProgressLoader.css';

export default function ProgressLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [key, setKey] = useState(0);

  const steps = [
    "Getting things ready for you...",
    "Brewing some analytics magic ✨",
    "Crunching those numbers 🔢",
    "Almost there, hang tight!",
    "Adding the finishing touches 🎨",
    "Just a moment of patience...",
    "Making everything perfect ✨",
    "Final preparations..."
  ];

  useEffect(() => {
    const duration = 30000;    // total 30s
    const interval = 50;       // tick every 50ms
    const totalTicks = duration / interval;
    const increment = 100 / totalTicks;

    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        clearInterval(timer);
        setProgress(100);
        setTimeout(onComplete, 500);
      } else {
        setProgress(currentProgress);
      }
    }, interval);

    // Change message every 3 seconds, cycling through `steps.length`
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
      setKey(prev => prev + 1);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, [onComplete, steps.length]);

  return (
    <div className="progress-loader-overlay">
      <div className="progress-loader-content">
        <div className="progress-step-container">
          <div className="progress-step-text" key={key}>
            {steps[currentStep]}
          </div>
        </div>
        <div className="progress-line-container">
          <div 
            className="progress-line" 
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
      </div>
    </div>
  );
}
