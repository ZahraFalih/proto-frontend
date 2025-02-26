import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './components/welcomePage';
import LoginPage from './components/LoginPage'; 
import SignUpPage from './components/SignUpPage'; 
import OnboardingPage from './components/OnboardingPage'; 
import DataCollectionPage from './components/DataCollectionPage';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/datacollection" element={<DataCollectionPage />} />
      </Routes>
    </Router>
  );
}

export default App;
