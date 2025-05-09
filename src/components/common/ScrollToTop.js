import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Force scroll to top on mount and any route change
    window.scrollTo(0, 0);
    
    // Also reset scroll for the main dashboard content
    const dashboardBody = document.querySelector('.dashboard-body');
    if (dashboardBody) {
      dashboardBody.scrollTop = 0;
    }
    
    // Ensure the body is at the top with a slight delay for reliability
    setTimeout(() => {
      window.scrollTo(0, 0);
      if (dashboardBody) {
        dashboardBody.scrollTop = 0;
      }
    }, 100);
  }, [pathname, search]);

  return null;
}

export default ScrollToTop; 