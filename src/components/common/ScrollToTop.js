import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0);
    
    // Reset scroll for the main dashboard content
    const dashboardBody = document.querySelector('.dashboard-body');
    if (dashboardBody) {
      dashboardBody.scrollTop = 0;
    }
    
    // For better reliability, also scroll again after a brief delay
    // This helps with content that loads dynamically
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
      
      if (dashboardBody) {
        dashboardBody.scrollTop = 0;
      }
      
      // Force document body to top as well
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 100);
    
    // And one more time after components have likely rendered
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      if (dashboardBody) {
        dashboardBody.scrollTop = 0;
      }
    }, 300);
  }, [pathname, search]);

  return null;
}

export default ScrollToTop; 