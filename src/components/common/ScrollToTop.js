import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Helper function to reset all scrolling
    const resetAllScrollPositions = () => {
      // Reset window scroll position
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Use instant instead of smooth for immediate effect
      });
      
      // Reset dashboard body scroll position
      const dashboardBody = document.querySelector('.dashboard-body');
      if (dashboardBody) {
        dashboardBody.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
      }
      
      // Reset any scrollable panels
      const scrollablePanels = document.querySelectorAll('.chat-messages, .wm-details-panel > div, .uba-formulation-text');
      scrollablePanels.forEach(panel => {
        if (panel) {
          panel.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
          });
        }
      });
    };

    // Execute scroll reset
    resetAllScrollPositions();

    // Add a small delay to handle dynamic content loading
    const immediateTimer = setTimeout(resetAllScrollPositions, 0);
    const shortTimer = setTimeout(resetAllScrollPositions, 100);
    
    // Cleanup timers
    return () => {
      clearTimeout(immediateTimer);
      clearTimeout(shortTimer);
    };
  }, [pathname, search]); // Re-run when route or search params change

  return null;
}

export default ScrollToTop; 