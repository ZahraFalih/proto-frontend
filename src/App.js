import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/welcomePage';
import LoginPage from './pages/LoginPage'; 
import SignUpPage from './pages/SignUpPage'; 
import OnboardingPage from './pages/OnboardingPage'; 
import DataCollectionPage from './pages/DataCollectionPage';
import DashboardPage from './pages/DashboardPage';
import ManageMyData from './pages/ManageMyData';  
import ShowFile from './pages/ShowFile';


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
        <Route path="/manage-data" element={<ManageMyData />} /> 
        <Route path="/show/:fileId" element={<ShowFile />} />
      </Routes>
    </Router>
  );
}

export default App;
