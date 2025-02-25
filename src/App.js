import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './components/welcomePage';
import LoginPage from './components/LoginPage'; 
import SignUpPage from './components/SignUpPage'; 


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
        {/* Future routes:
        <Route path="/signup" element={<SignUpPage />} />
        */}
      </Routes>
    </Router>
  );
}

export default App;
