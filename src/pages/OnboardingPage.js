import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/OnboardingPage.css'; 
import { toast } from "react-toastify";
import logo from "../assets/icons/logo.png";
import '../styles/global.css'; 

const OnboardingPage = () => {
  const [businessType, setBusinessType] = useState("");
  const [industrySharks, setIndustrySharks] = useState("");
  const [businessURL, setBusinessURL] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const getAccessToken = () => sessionStorage.getItem("access_token");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication required. Redirecting to login...");
      navigate("/login")
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    if (industrySharks.length > 35 || businessName.length > 35 || businessURL.length > 70) {
      setError("One of the input fields exceeds the character limit.");
      setLoading(false);
      return;
    }
  
    const token = getAccessToken();
    if (!token) {
      setError("Authentication required. Please log in first.");
      setLoading(false);
      return;
    }
  
    try {
      const response = await fetch("http://127.0.0.1:8000/onboard/onboard/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", 
        },
        credentials: "include",
        body: JSON.stringify({
          category: businessType,
          url: businessURL,
          name: businessName,
          role_model: industrySharks,
          token: token, 
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        toast.success("Business onboarded successfully!");
        navigate("/datacollection");
      } else {
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          sessionStorage.removeItem("access_token");
          navigate("/datacollection");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };
  
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
      <h1 className="onboarding-title">Business Onboarding</h1>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="onboarding-form">
        <label className="onboarding-label">Type of Business</label>
        <select
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          required
          className="onboarding-select"
        >
          <option value="" disabled>Select a business type</option>
          {[
            "Online Retail (General E-commerce)",
            "Fashion & Apparel",
            "Cosmetics & Beauty",
            "Electronics & Gadgets",
            "Home & Furniture",
            "Food & Grocery",
            "Health & Wellness",
            "Luxury Goods",
            "Automotive & Auto Parts",
            "Books & Stationery",
            "Sports & Outdoor Gear",
            "Toys & Baby Products",
            "Pet Supplies",
            "Subscription Services",
            "Digital Products & Services",
            "Event Ticketing",
            "Furniture & Home Decor",
            "Jewelry & Accessories",
            "Pharmaceutical & Medical Supplies",
            "Fast Fashion & Budget Shopping",
          ].map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>

        <label className="onboarding-label">Sharks of Your Industry</label>
        <input
          type="text"
          value={industrySharks}
          onChange={(e) => setIndustrySharks(e.target.value)}
          maxLength={35}
          required
          className="onboarding-input"
        />

        <label className="onboarding-label">Your Business URL</label>
        <input
          type="url"
          value={businessURL}
          onChange={(e) => setBusinessURL(e.target.value)}
          maxLength={70}
          required
          className="onboarding-input"
        />

        <label className="onboarding-label">Name of the Business</label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          maxLength={35}
          required
          className="onboarding-input"
        />

        <button type="submit" disabled={loading} className="onboarding-button">
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  </div>
  );
};

export default OnboardingPage;