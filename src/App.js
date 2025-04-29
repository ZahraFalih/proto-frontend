import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/welcomePage';
import AuthPage from './pages/AuthPage'; // <-- new import
import OnboardingPage from './pages/OnboardingPage'; 
import DataCollectionPage from './pages/DataCollectionPage';
import ManageMyData from './pages/ManageMyData';  
import ShowFile from './pages/ShowFile';
import Dashboard from './pages/Dashboard';
import { ToastContainer } from 'react-toastify';             
import 'react-toastify/dist/ReactToastify.css'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/auth" element={<AuthPage />} /> {/* merged route */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/datacollection" element={<DataCollectionPage />} />
        <Route path="/manage-data" element={<ManageMyData />} /> 
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
