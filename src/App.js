import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './components/pages/welcomePage';
import LoginPage from './components/pages/LoginPage'; 
import SignUpPage from './components/pages/SignUpPage'; 
import OnboardingPage from './components/pages/OnboardingPage'; 
import DataCollectionPage from './components/pages/DataCollectionPage';
import DashboardPage from './components/pages/DashboardPage';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/datacollection" element={<DataCollectionPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
