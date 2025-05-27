import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

const OnboardingProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isFirstLogin = location.state?.fromAuth && location.state?.firstLogin;
  
  if (!isAuthenticated()) {
    // Not logged in, redirect to login
    return <Navigate to="/auth?mode=login" />;
  }
  
  if (!isFirstLogin) {
    // Logged in but not coming from auth flow, redirect to dashboard
    return <Navigate to="/dashboard" />;
  }
  
  // All checks passed, render the onboarding page
  return children;
};

export default OnboardingProtectedRoute; 