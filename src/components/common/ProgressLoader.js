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
    "Getting things ready for you...",
    "Brewing some analytics magic ✨",
    "Crunching those numbers 🔢",
    "Almost there, hang tight!",
    "Adding the finishing touches 🎨",
    "Just a moment of patience...",
    "Making everything perfect ✨",
    "Final preparations...",
    "Sabır Acıdır Ama Meyvesi Tatlıdır 🍎",
    "الصبر مفتاح الفرج.. ⌛"
  ];

  useEffect(() => {
    const duration = 90000; // 90 seconds
    let lastTimestamp = performance.now();

    const updateProgress = (timestamp) => {
      // Calculate the time elapsed since last update, considering tab visibility
      const deltaTime = document.hidden ? 0 : timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // Update progress based on actual time elapsed
      const elapsedTime = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsedTime / duration) * 100, 100);
      
      setProgress(newProgress);

      if (newProgress >= 100) {
        setTimeout(onComplete, 500);
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    // Start the animation
    animationFrameRef.current = requestAnimationFrame(updateProgress);

    // Change message every 4 seconds
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
      setKey(prev => prev + 1);
    }, 4000);

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // When tab becomes visible again, update the start time to account for hidden duration
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
      clearInterval(stepTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
