import React, { useState, useEffect, useRef } from 'react';
import '../../styles/ProgressLoader.css';

export default function ProgressLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [key, setKey] = useState(0);
  const startTimeRef = useRef(Date.now());
  const lastUpdateTimeRef = useRef(Date.now());
  const animationFrameRef = useRef(null);

  const steps = [
    "Digesting your UBA 🐾",
    "Peaking at your UI 👀",
    "Taking a walk in your website 🚶🏻‍♂️‍➡️",
    "Looking good ✨😎",
    "Getting the AI Chat ready for you ⚙️",
    "Half way there.. 🤺",
    "Measure your page perforemence ⏱️",
    "One last round 🏁",
    "Almost there 🤌🏻",
    "Damlaya Damlaya Göl Olur 💧",
    "الصبر مفتاح الفرج 🗝️",
    "Final touches.. ✨"
  ];

  useEffect(() => {
    const duration = 60000; // 60 seconds
    const stepDuration = duration / steps.length; // 5 seconds per step
    let lastTimestamp = performance.now();

    const updateProgress = (timestamp) => {
      const deltaTime = document.hidden ? 0 : timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      const elapsedTime = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsedTime / duration) * 100, 100);
      
      setProgress(newProgress);
      
      // Update step based on progress
      const currentStepIndex = Math.min(
        Math.floor((elapsedTime / stepDuration)),
        steps.length - 1
      );
      
      if (currentStepIndex !== currentStep) {
        setCurrentStep(currentStepIndex);
        setKey(prev => prev + 1);
      }

      if (newProgress >= 100) {
        setTimeout(onComplete, 500);
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const hiddenDuration = Date.now() - lastUpdateTimeRef.current;
        startTimeRef.current += hiddenDuration;
        lastTimestamp = performance.now();
      }
      lastUpdateTimeRef.current = Date.now();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onComplete, steps.length, currentStep]);

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
            style={{ 
              transform: `scaleX(${progress / 100})`,
              transition: 'transform 0.1s linear'
            }}
          />
        </div>
      </div>
    </div>
  );
}
