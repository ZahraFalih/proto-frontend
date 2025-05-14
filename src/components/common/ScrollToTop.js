import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Helper function to reset all scrolling
    const resetAllScrollPositions = () => {
      // Use both scrollTo methods for maximum compatibility
      window.scrollTo(0, 0);
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Use instant instead of auto
      });
      
      // Reset scroll for the main dashboard content
      const dashboardBody = document.querySelector('.dashboard-body');
      if (dashboardBody) {
        dashboardBody.scrollTop = 0;
      }
      
      // Force document body to top as well
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      // Also reset any potential overflow containers
      const scrollableElements = document.querySelectorAll('.scrollable, [data-scrollable]');
      scrollableElements.forEach(el => {
        if (el && typeof el.scrollTo === 'function') {
          el.scrollTo(0, 0);
        } else if (el) {
          el.scrollTop = 0;
        }
      });
    };

    // Immediate aggressive reset
    resetAllScrollPositions();
    
    // Schedule multiple resets to catch any delayed rendering
    const timers = [
      setTimeout(resetAllScrollPositions, 0),
      setTimeout(resetAllScrollPositions, 50),
      setTimeout(resetAllScrollPositions, 100),
      setTimeout(resetAllScrollPositions, 300)
    ];
    
    // Also add a temporary event listener for scroll events to force top position
    let scrollTimeout;
    const forceTopOnScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(resetAllScrollPositions, 10);
    };
    
    // Add listener with a 500ms limit after navigation
    window.addEventListener('scroll', forceTopOnScroll);
    const removeScrollListener = setTimeout(() => {
      window.removeEventListener('scroll', forceTopOnScroll);
    }, 500); // Only prevent scrolling for the first 500ms
    
    // Cleanup
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(removeScrollListener);
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', forceTopOnScroll);
    };
  }, [pathname, search]);

  return null;
}

export default ScrollToTop; 