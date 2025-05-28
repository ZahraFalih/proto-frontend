import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/welcomePage';
import AuthPage from './pages/AuthPage'; // <-- new import
import OnboardingPage from './pages/OnboardingPage'; 
import DataCollectionPage from './pages/DataCollectionPage';  
import ShowFile from './pages/ShowFile';
import Dashboard from './pages/Dashboard';
import OnboardingProtectedRoute from './components/OnboardingProtectedRoute';
import { ToastContainer } from 'react-toastify';             
import 'react-toastify/dist/ReactToastify.css'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/auth" element={<AuthPage />} /> {/* merged route */}
        <Route 
          path="/onboarding" 
          element={
            <OnboardingProtectedRoute>
              <OnboardingPage />
            </OnboardingProtectedRoute>
          } 
        />
        <Route path="/datacollection" element={<DataCollectionPage />} />
        <Route path="/dashboard/:pageId?" element={<Dashboard />} /> 
        <Route path="/show/:fileId" element={<ShowFile />} />
      </Routes>

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </Router>
  );
}

export default App;
