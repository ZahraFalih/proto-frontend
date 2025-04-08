import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/OnboardingPage.css'; 
import logo from "../assets/icons/logo.png";
import UserOnboardingForm from "../components/onboarding/UserOnboardingForm";
import BusinessOnboardingForm from "../components/onboarding/BusinessOnboardingForm";
import PageOnboardingForm from "../components/onboarding/PageOnboardingForm";
import '../styles/global.css'; 

const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  return (
    <div className='page-container'>
      <div className="header">
        <img src={logo} alt="logo" className="header-logo" />    
        <div className="header-links">  
          <a href="#">INFO</a>
          <a href="#">ABOUT</a>
        </div>
      </div>

      <div className="onboarding-container">
        <h1 className="onboarding-title">
          {step === 1
            ? "Step 1: Tell Us About Yourself"
            : step === 2
            ? "Step 2: Business Info"
            : "Step 3: Page Info"}
        </h1>

        {step === 1 ? (
          <UserOnboardingForm onSuccess={() => setStep(2)} />
        ) : step === 2 ? (
          <BusinessOnboardingForm onSuccess={() => setStep(3)} />
        ) : (
          <PageOnboardingForm />
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
