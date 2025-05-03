import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "../styles/OnboardingPage.css";
import "../styles/global.css";

const companiesData = [
  { id: 1, name: "Amazon", category: "Online Retail & Marketplace" },
  { id: 2, name: "eBey", category: "Online Retail & Marketplace" },
  { id: 3, name: "Walmart", category: "Online Retail & Marketplace" },
  { id: 4, name: "Trendyol", category: "Online Retail & Marketplace" },
  { id: 5, name: "Hepsiburada", category: "Online Retail & Marketplace" },
  { id: 6, name: "Zara", category: "Fashion & Apparel" },
  { id: 7, name: "ASOS", category: "Fashion & Apparel" },
  { id: 8, name: "Uniqlo", category: "Fashion & Apparel" },
  { id: 9, name: "Ipekyol", category: "Fashion & Apparel" },
  { id: 10, name: "Mavi", category: "Fashion & Apparel" },
  { id: 11, name: "Sephora", category: "Cosmetics & Beauty" },
  { id: 12, name: "Ulta beauty", category: "Cosmetics & Beauty" },
  { id: 13, name: "Glossier", category: "Cosmetics & Beauty" },
  { id: 14, name: "Watsons", category: "Cosmetics & Beauty" },
  { id: 15, name: "Gratis", category: "Cosmetics & Beauty" },
  { id: 16, name: "Best Buy", category: "Electronics & Gadgets" },
  { id: 17, name: "Newegg", category: "Electronics & Gadgets" },
  { id: 18, name: "Media Market", category: "Electronics & Gadgets" },
  { id: 19, name: "Teknosa", category: "Electronics & Gadgets" },
  { id: 20, name: "Vatan Bilgisayar", category: "Electronics & Gadgets" },
  { id: 21, name: "Instacart", category: "Food & Grocery" },
  { id: 22, name: "carrefoursa", category: "Food & Grocery" },
  { id: 23, name: "Migros", category: "Food & Grocery" },
  { id: 24, name: "Getir", category: "Food & Grocery" },
  { id: 25, name: "Doordash", category: "Food & Grocery" },
  { id: 26, name: "Toys R Us", category: "Toys & Baby Products" },
  { id: 27, name: "Hamleys", category: "Toys & Baby Products" },
  { id: 28, name: "chicco", category: "Toys & Baby Products" },
  { id: 29, name: "Joker", category: "Toys & Baby Products" },
  { id: 30, name: "Ebebek", category: "Toys & Baby Products" },
  { id: 31, name: "IKEA", category: "Furniture & Home Decor" },
  { id: 32, name: "wayfair", category: "Furniture & Home Decor" },
  { id: 33, name: "westelm", category: "Furniture & Home Decor" },
  { id: 34, name: "Vivense", category: "Furniture & Home Decor" },
  { id: 35, name: "Madam Coco", category: "Furniture & Home Decor" },
  { id: 36, name: "Tiffany & Co", category: "Jewelry & Accessories" },
  { id: 37, name: "Pandora", category: "Jewelry & Accessories" },
  { id: 38, name: "Swarovski", category: "Jewelry & Accessories" },
  { id: 39, name: "Atasay", category: "Jewelry & Accessories" },
  { id: 40, name: "Altinbaş", category: "Jewelry & Accessories" },
  { id: 41, name: "Farfetch", category: "Luxury Goods" },
  { id: 42, name: "Net-a-Porter", category: "Luxury Goods" },
  { id: 43, name: "Ounass", category: "Luxury Goods" },
  { id: 44, name: "Beymen", category: "Luxury Goods" },
  { id: 45, name: "Vakko", category: "Luxury Goods" },
];

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Retrieve access token from sessionStorage
  const getAccessToken = () => sessionStorage.getItem("access_token");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // ----- STEP 1: User-Onboard Data -----
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  const handleUserOnboard = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/onboard/user-onboard/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          username: username,
          role: role,
          token: getAccessToken(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentStep(2);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // ----- STEP 2: Business-Onboard Data -----
  const [businessType, setBusinessType] = useState("");
  const [businessURL, setBusinessURL] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  
  useEffect(() => {
    if (businessType) {
      const filtered = companiesData.filter(
        (company) => company.category === businessType
      );
      setFilteredCompanies(filtered);
      // Reset selected company when business type changes
      setSelectedCompanyId("");
    } else {
      setFilteredCompanies([]);
    }
  }, [businessType]);
  
  const handleBusinessOnboard = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      const response = await fetch("http://127.0.0.1:8000/onboard/business-onboard/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: businessType,
          url: businessURL,
          name: businessName,
          role_model: selectedCompanyId,
          token: getAccessToken(),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentStep(3);
      } else {
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          navigate("/login");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };
  

  // ----- STEP 3: Page-Onboard Data -----
  const [pageType, setPageType] = useState("");
  const [pageURL, setPageURL] = useState("");
  
  const handlePageOnboard = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      const response = await fetch("http://127.0.0.1:8000/onboard/page-onboard/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          page_type: pageType,
          url: pageURL,
          token: getAccessToken(),
        }),
      });
      const data = await response.json();
  
      if (response.ok) {
        navigate("dashboard");
      } else {
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          navigate("/login");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage for the progress bar
  const progressPercentage = ((currentStep - 1) / 2) * 100;

  // Helper function to determine step status
  const getStepStatus = (step) => {
    if (currentStep > step) return "completed";
    if (currentStep === step) return "active";
    return "";
  };

  // Render the form for the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleUserOnboard} className="onboarding-form">
            <div className="form-header">
              <h2 className="onboarding-title">Let's Get to Know You!</h2>
              <p className="onboarding-subtitle">Tell us who you are - we're excited to meet you!</p>
              {error && <p className="error-message">{error}</p>}
            </div>

            <div className="form-content">
              <div className="form-group">
                <input
                  id="firstName"
                  type="text"
                  className="form-input"
                  placeholder=" "
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                />
                <label htmlFor="firstName" className="floating-label">First Name</label>
              </div>

              <div className="form-group">
                <input
                  id="lastName"
                  type="text"
                  className="form-input"
                  placeholder=" "
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                />
                <label htmlFor="lastName" className="floating-label">Last Name</label>
              </div>

              <div className="form-group">
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  placeholder=" "
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
                <label htmlFor="username" className="floating-label">Username</label>
              </div>


              <div className="form-group">
                <select
                  id="role"
                  className="form-select"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                >
                  <option value="" disabled>Choose your role</option>
                  <option value="product_manager">Product Manager</option>
                  <option value="product_owner">Product Owner</option>
                  <option value="ux_designer">UX Designer</option>
                  <option value="ui_designer">UI Designer</option>
                </select>
                <label htmlFor="role" className="floating-label">Your Role</label>
              </div>
            </div>

            <div className="form-footer">
              <button type="submit" disabled={loading} className="onboarding-button">
                <span className="button-text">
                  {loading ? "Just a moment..." : "Continue"}
                </span>
                <span className="button-icon">→</span>
              </button>
            </div>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleBusinessOnboard} className="onboarding-form">
            <div className="form-header">
              <h2 className="onboarding-title">Your Business Journey</h2>
              <p className="onboarding-subtitle">Help us understand your business better</p>
              {error && <p className="error-message">{error}</p>}
            </div>

            <div className="form-content">
              <div className="form-group">
                <select
                  id="businesstype"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  required
                  className="form-select"
                >
                  <option value="" disabled>Select your business type</option>
                  {[
                    "Online Retail & Marketplace",
                    "Fashion & Apparel",
                    "Cosmetics & Beauty",
                    "Electronics & Gadgets",
                    "Food & Grocery",
                    "Toys & Baby Products",
                    "Furniture & Home Decor",
                    "Jewelry & Accessories",
                    "Luxury Goods",
                  ].map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
                <label htmlFor="businesstype" className="floating-label">Business Type</label>
              </div>

              <div className="form-group">
                <select
                  id="roleModel"
                  className="form-select"
                  value={selectedCompanyId}
                  onChange={e => setSelectedCompanyId(e.target.value)}
                  disabled={!filteredCompanies.length}
                  required
                >
                  <option value="" disabled>{filteredCompanies.length ? "Choose inspiration" : "Select type first"}</option>
                  {filteredCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <label htmlFor="roleModel" className="floating-label">Industry Role Model</label>
              </div>


              <div className="form-group">
                <input
                  id="businessName"
                  type="text"
                  className="form-input"
                  placeholder=" "
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  required
                />
                <label htmlFor="businessName" className="floating-label">Business Name</label>
              </div>
            </div>

            <div className="form-footer">
              <button type="submit" disabled={loading} className="onboarding-button">
                <span className="button-text">
                  {loading ? "Just a moment..." : "Continue"}
                </span>
                <span className="button-icon">→</span>
              </button>
            </div>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handlePageOnboard} className="onboarding-form">
            <div className="form-header">
              <h2 className="onboarding-title">Final Touch!</h2>
              <p className="onboarding-subtitle">Let's set up your first page for analysis</p>
              {error && <p className="error-message">{error}</p>}
            </div>

            <div className="form-content">
            <div className="form-group">
                <select
                  id="pageType"
                  className="form-select"
                  value={pageType}
                  onChange={e => setPageType(e.target.value)}
                  required
                >
                  <option value="" disabled>Choose page type</option>
                  <option value="Product Page">Product Page</option>
                  <option value="Search Results Page">Search Results Page</option>
                  <option value="Landing Page">Landing Page</option>
                </select>
                <label htmlFor="pageType" className="floating-label">Page Type</label>
              </div>

              <div className="form-group">
                <input
                  id="pageURL"
                  type="url"
                  className="form-input"
                  placeholder=" "
                  value={pageURL}
                  onChange={e => setPageURL(e.target.value)}
                  required
                />
                <label htmlFor="pageURL" className="floating-label">Page URL</label>
              </div>
            </div>

            <div className="form-footer">
              <button type="submit" disabled={loading} className="onboarding-button">
                <span className="button-text">
                  {loading ? "Just a moment..." : "Let's Begin!"}
                </span>
                <span className="button-icon">→</span>
              </button>
            </div>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="progress-container">
          <div className="progress-wrapper">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className={`progress-step ${getStepStatus(1)}`}>1</div>
            <div className={`progress-step ${getStepStatus(2)}`}>2</div>
            <div className={`progress-step ${getStepStatus(3)}`}>3</div>
          </div>
        </div>
        <div className="onboarding-content">
          <TransitionGroup>
            <CSSTransition key={currentStep} timeout={300} classNames="fade">
              {renderStep()}
            </CSSTransition>
          </TransitionGroup>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
