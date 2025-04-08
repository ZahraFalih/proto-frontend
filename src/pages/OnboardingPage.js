import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { toast } from "react-toastify";
import logo from "../assets/icons/logo.png";
import "../styles/OnboardingPage.css";
import "../styles/global.css";
import "../styles/OnboardingPage.css";

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
      toast.error("Authentication required. Redirecting to login...");
      navigate("/login");
    }
  }, [navigate]);

  // ----- STEP 1: User-Onboard Data -----
// State for user onboarding
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [username, setUsername] = useState("");

const handleUserOnboard = async (e) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  if (firstName.trim() === "" || lastName.trim() === "" || username.trim() === "") {
    setError("Please fill in all required fields.");
    setLoading(false);
    return;
  }

  const token = getAccessToken();
  if (!token) {
    setError("Authentication required. Please log in again.");
    setLoading(false);
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/onboard/user-onboard/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        username: username,
        token: token,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      toast.success("User onboarding completed!");
      setCurrentStep(2);
    } else {
      setError(data.error || "Something went wrong. Please try again.");
    }
  } catch (err) {
    console.error("User onboarding error:", err);
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
  
    if (
      businessName.length > 35 ||
      businessURL.length > 70 ||
      !businessType ||
      !selectedCompanyId
    ) {
      setError("Please complete all fields correctly.");
      setLoading(false);
      return;
    }
  
    const token = getAccessToken();
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }
  
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
          token: token,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Business onboarding completed!");
        setCurrentStep(3);
      } else {
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          sessionStorage.removeItem("access_token");
          navigate("/login");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
      }
    } catch (err) {
      console.error("Business onboarding error:", err);
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
  
    // Validate required fields
    if (!pageType || pageURL.trim() === "") {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }
  
    const token = getAccessToken();
    if (!token) {
      setError("Authentication required. Please log in again.");
      setLoading(false);
      return;
    }
  
    try {
      const response = await fetch("http://127.0.0.1:8000/onboard/page-onboard/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          page_type: pageType,
          url: pageURL,
          token: token,
        }),
      });
      const data = await response.json();
  
      if (response.ok) {
        toast.success("Page onboarding completed!");
        navigate("/manage-data");
      } else {
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          sessionStorage.removeItem("access_token");
          navigate("/login");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
      }
    } catch (err) {
      console.error("Page onboarding error:", err);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Render the form for the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleUserOnboard} className="onboarding-form">
            <h2>User Onboarding</h2>
            {error && <p className="error-message">{error}</p>}

            <label className="onboarding-label">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="onboarding-input"
            />

            <label className="onboarding-label">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="onboarding-input"
            />

            <label className="onboarding-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="onboarding-input"
            />

            <button type="submit" disabled={loading} className="onboarding-button">
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleBusinessOnboard} className="onboarding-form">
          <h2>Business Onboarding</h2>
          {error && <p className="error-message">{error}</p>}
      
          <label className="onboarding-label">Type of Business</label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            required
            className="onboarding-select"
          >
            <option value="" disabled>
              Select a business type
            </option>
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
              <option key={index} value={type}>
                {type}
              </option>
            ))}
          </select>
      
          <label className="onboarding-label">Select Your Industry Shark</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            required
            className="onboarding-select"
            disabled={!filteredCompanies.length}
          >
            <option value="" disabled>
              {filteredCompanies.length ? "Select a company" : "Choose type first"}
            </option>
            {filteredCompanies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
      
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
        );
      case 3:
        return (
          <form onSubmit={handlePageOnboard} className="onboarding-form">
          <h2>Page Onboarding</h2>
          {error && <p className="error-message">{error}</p>}
      
          <label className="onboarding-label">Page Type</label>
          <select
            value={pageType}
            onChange={(e) => setPageType(e.target.value)}
            required
            className="onboarding-select"
          >
            <option value="" disabled>Select a page type</option>
            <option value="Product Page">Product Page</option>
            <option value="Search Results Page">Search Results Page</option>
            <option value="Landing Page">Landing Page</option>
          </select>
      
          <label className="onboarding-label">Page URL</label>
          <input
            type="url"
            value={pageURL}
            onChange={(e) => setPageURL(e.target.value)}
            required
            className="onboarding-input"
          />
      
          <button type="submit" disabled={loading} className="onboarding-button">
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <div className="header">
        <img src={logo} alt="logo" className="header-logo" />
        <div className="header-links">
          <a href="#">INFO</a>
          <a href="#">ABOUT</a>
        </div>
      </div>
      <div className="onboarding-container">
        <TransitionGroup>
          <CSSTransition key={currentStep} timeout={300} classNames="fade">
            {renderStep()}
          </CSSTransition>
        </TransitionGroup>
      </div>
    </div>
  );
};

export default OnboardingPage;
