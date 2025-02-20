import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './components/welcomePage';
import LoginPage from './components/LoginPage'; // Adjust the path as needed
import MyData from './components/MyData';
import SignUpPage from './components/SignUpPage'; // Import the SignUpPage
import OnboardingPage from './components/OnboardingPage';
import DataCollectionPage from './components/DataCollectionPage';

// Placeholder components for future routes
// import LoginPage from './components/LoginPage';
// import SignUpPage from './components/SignUpPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/datacollection" element={<DataCollectionPage />} />
        <Route path="/myData" element={<MyData />} />
        {/* Future routes:
        <Route path="/signup" element={<SignUpPage />} />
        */}
      </Routes>
    </Router>
  );
}

export default App;
