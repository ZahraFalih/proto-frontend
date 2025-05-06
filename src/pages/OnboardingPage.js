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
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [pageId, setPageId] = useState(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [selectedUbaFile, setSelectedUbaFile] = useState(null);
  const [pageType, setPageType] = useState("");
  const navigate = useNavigate();

  // Static loading text
  const loadingText = "This might take a minute..";

  // Retrieve access token from sessionStorage
  const getAccessToken = () => {
    const token = sessionStorage.getItem("access_token");
    console.log("Retrieved token:", token ? "Token exists" : "Token is missing");
    return token;
  };

  useEffect(() => {
    const token = getAccessToken();
    console.log("Checking token on component mount");
    if (!token) {
      console.log("No token found, redirecting to login");
      navigate("/login");
    } else {
      console.log("Token found, user is authenticated");
    }
  }, [navigate]);

  // Add effect to log when pageId or showScreenshotModal changes
  useEffect(() => {
    console.log("Modal visibility changed:", showScreenshotModal);
    if (showScreenshotModal) {
      console.log("Modal is now visible with pageId:", pageId);
    }
  }, [showScreenshotModal, pageId]);

  // ----- STEP 1: User-Onboard Data -----
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [user_role, setRole] = useState("");

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
          user_role: user_role,
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
  const [pageURL, setPageURL] = useState("");
  
  const handleUbaFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("UBA file selected:", file.name, "Type:", file.type, "Size:", file.size, "bytes");
      setSelectedUbaFile(file);
    }
  };
  
  const handlePageOnboard = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    console.log("Starting page onboarding process...");
    const token = getAccessToken();
    const requestData = { page_type: pageType, url: pageURL, token };
    console.log("Request data:", requestData);
  
    try {
      console.log("Sending request to /onboard/page-onboard/");
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestData),
      };
      console.log("Request options:", JSON.stringify(requestOptions, (key, value) => 
        key === 'body' ? JSON.parse(value) : value));
      
      const response = await fetch("http://127.0.0.1:8000/onboard/page-onboard/", requestOptions);
      
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries([...response.headers]));
      
      let data;
      try {
        const textResponse = await response.text();
        console.log("Raw response text:", textResponse);
        
        try {
          data = JSON.parse(textResponse);
          console.log("Parsed response data:", data);
          console.log("ID in response:", data.id);
          
          // Defend against missing fields
          if (!data.id && data.id !== 0) {
            console.error("Response is missing required id field");
          }
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          console.log("Invalid JSON received");
          data = { error: "Server returned invalid data" };
        }
      } catch (textError) {
        console.error("Error reading response text:", textError);
        data = { error: "Couldn't read server response" };
      }
  
      if (response.ok) {
        console.log("Response OK, checking URL validity");
        if (data.url === null) {
          console.log("URL is null, showing error");
          setError("Invalid URL provided. Please check your URL and try again.");
        } else if (data.screenshot_path === null) {
          console.log("Screenshot path is null, opening upload modal");
          if (data.id) {
            console.log("Setting page_id to:", data.id);
            setPageId(data.id);
            setShowScreenshotModal(true);
          } else {
            console.error("Error: id is missing in the response");
            setError("Server error: Missing page information. Please try again.");
          }
        } else {
          console.log("All valid, navigating to dashboard");
          
          // If UBA file was provided, upload it
          if (selectedUbaFile) {
            await uploadUbaFile(data.id, pageType);
          } else {
            navigate("/dashboard");
          }
        }
      } else {
        if (response.status === 401) {
          console.log("Unauthorized, redirecting to login");
          setError("Session expired. Please log in again.");
          navigate("/login");
        } else if (response.status === 500) {
          console.log("Internal server error occurred");
          setError("The server encountered an error. Please try again later.");
        } else if (response.status === 400) {
          console.log("Bad request:", data.error || "Unknown validation error");
          setError(data.error || "Please check your input and try again.");
        } else {
          console.log("Other error:", response.status, data.error || "Unknown error");
          setError(data.error || `Server error (${response.status}). Please try again.`);
        }
      }
    } catch (err) {
      console.error("Exception in page onboarding:", err);
      setError("Failed to connect to the server. Please check your network connection.");
    } finally {
      console.log("Page onboarding process completed");
      setLoading(false);
    }
  };

  const uploadUbaFile = async (pageId, pageTypeName) => {
    if (!selectedUbaFile) {
      console.log("No UBA file selected, skipping UBA upload");
      navigate("/dashboard");
      return;
    }
    
    setLoading(true);
    console.log("Starting UBA data upload...");
    console.log("UBA file:", selectedUbaFile.name, "Type:", selectedUbaFile.type, "Size:", selectedUbaFile.size, "bytes");
    console.log("Page ID:", pageId);
    console.log("Page Type:", pageTypeName);
    
    try {
      const formData = new FormData();
      const token = getAccessToken();
      formData.append('token', token);
      formData.append('file', selectedUbaFile);
      formData.append('page_id', String(pageId));
      formData.append('name', pageTypeName);
      
      console.log("FormData created with token, file, page_id, and name");
      
      const response = await fetch("http://127.0.0.1:8000/upload/create/", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      console.log("Response status:", response.status);
      
      let data;
      try {
        const textResponse = await response.text();
        console.log("Raw response text:", textResponse);
        
        try {
          data = JSON.parse(textResponse);
          console.log("Parsed response data:", data);
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          console.log("Invalid JSON received");
          data = { error: "Server returned invalid data" };
        }
      } catch (textError) {
        console.error("Error reading response text:", textError);
        data = { error: "Couldn't read server response" };
      }
      
      if (response.ok) {
        console.log("UBA data upload successful, navigating to dashboard");
        navigate("/dashboard");
      } else {
        if (response.status === 401) {
          console.log("Unauthorized token for UBA upload");
          setError("Session expired. Please log in again.");
          navigate("/login");
        } else {
          console.log("UBA upload failed:", response.status, data.error || "Unknown error");
          setError("Failed to upload UBA data. " + (data.error || "Please try again."));
          // Still navigate to dashboard even if UBA upload fails
          setTimeout(() => navigate("/dashboard"), 3000);
        }
      }
    } catch (err) {
      console.error("Exception in UBA upload:", err);
      setError("Failed to upload UBA data, but your page was successfully onboarded.");
      // Still navigate to dashboard even if UBA upload fails
      setTimeout(() => navigate("/dashboard"), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedScreenshot) {
      console.log("No screenshot selected");
      return;
    }
    
    if (!pageId && pageId !== 0) {
      console.log("Error: page_id is missing or undefined:", pageId);
      setError("Missing page information. Please try again from the beginning.");
      return;
    }
    
    setUploadingScreenshot(true);
    console.log("Starting screenshot upload...");
    console.log("Screenshot file:", selectedScreenshot.name, "Type:", selectedScreenshot.type, "Size:", selectedScreenshot.size, "bytes");
    console.log("Page ID:", pageId);
    
    try {
      const formData = new FormData();
      const token = getAccessToken();
      formData.append('token', token);
      formData.append('page_id', String(pageId));
      console.log("Page ID being sent:", String(pageId));
      formData.append('screenshot', selectedScreenshot);
      
      console.log("FormData created with token and page_id");
      console.log("Token included:", token ? "Yes" : "No");
      console.log("Page ID included:", pageId ? "Yes" : "No");
      console.log("Screenshot included:", selectedScreenshot ? "Yes" : "No");
      console.log("Sending request to /onboard/upload-screenshot/");
      
      const response = await fetch("http://127.0.0.1:8000/onboard/upload-screenshot/", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      console.log("Response status:", response.status);
      
      let data;
      try {
        const textResponse = await response.text();
        console.log("Raw response text:", textResponse);
        
        try {
          data = JSON.parse(textResponse);
          console.log("Parsed response data:", data);
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          console.log("Invalid JSON received");
          data = { error: "Server returned invalid data" };
        }
      } catch (textError) {
        console.error("Error reading response text:", textError);
        data = { error: "Couldn't read server response" };
      }
      
      if (response.ok) {
        console.log("Screenshot upload successful, navigating to dashboard");
        setShowScreenshotModal(false);
        navigate("/dashboard");
      } else {
        if (response.status === 401) {
          console.log("Unauthorized token for screenshot upload");
          setError("Session expired. Please log in again.");
        } else if (response.status === 500) {
          console.log("Internal server error during screenshot upload");
          setError("The server encountered an error processing your screenshot. Please try again.");
        } else if (response.status === 400) {
          console.log("Bad request for screenshot upload:", data.error);
          setError(data.error || "Invalid screenshot data. Please try another image.");
        } else {
          console.log("Screenshot upload failed:", response.status, data.error || "Unknown error");
          setError(data.error || `Upload failed (${response.status}). Please try again.`);
        }
      }
    } catch (err) {
      console.error("Exception in screenshot upload:", err);
      setError("Failed to connect to the server. Please check your network connection.");
    } finally {
      console.log("Screenshot upload process completed");
      setUploadingScreenshot(false);
    }
  };
  
  const handleScreenshotChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("Screenshot selected:", file.name, "Type:", file.type, "Size:", file.size, "bytes");
      setSelectedScreenshot(file);
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

            <div className="form-content two-column">
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

              <div className="form-group full-width">
                <select
                  id="user_role"
                  className="form-select"
                  value={user_role}
                  onChange={e => setRole(e.target.value)}
                  required
                >
                  <option value="" disabled>Choose your role at your work</option>
                  <option value="Product Owner">Product Owner</option>
                  <option value="Product Analyst">Product Analyst</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="UX Designer">UX Designer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                </select>
                <label htmlFor="user_role" className="floating-label">Your Role</label>
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

            <div className="form-content two-column">
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


              <div className="form-group full-width">
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

            <div className="form-content two-column">
              <div className="form-group">
                <select
                  id="pageType"
                  className="form-select"
                  value={pageType}
                  onChange={e => setPageType(e.target.value)}
                  required
                  disabled={loading}
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
                  disabled={loading}
                />
                <label htmlFor="pageURL" className="floating-label">Page URL</label>
              </div>
              
              <div className="form-group full-width">
                <div className="uba-upload-section">
                  <div className="uba-upload-header">
                    <h4>User Behavior Analytics Data</h4>
                    <p>please upload your page's UBA data</p>
                  </div>
                  
                  {selectedUbaFile ? (
                    <div className="uba-file-selected">
                      <div className="uba-file-info">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span className="uba-filename">{selectedUbaFile.name}</span>
                      </div>
                      <button 
                        type="button" 
                        className="uba-remove-btn"
                        disabled={loading}
                        onClick={() => {
                          console.log("Removing selected UBA file");
                          setSelectedUbaFile(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="uba-upload-area">
                      <input 
                        type="file" 
                        className="uba-file-input" 
                        onChange={handleUbaFileChange}
                        disabled={loading}
                        accept=".csv"
                        required
                      />
                      <div className="uba-upload-content">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span>
                          <strong>Upload a CSV file</strong>
                        </span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="form-footer">
              <button type="submit" disabled={loading} className="onboarding-button">
                {loading ? (
                  <div className="loading-text-container footer-loading">
                    <span className="current-loading-text">{loadingText}</span>
                  </div>
                ) : (
                  <>
                    <span className="button-text">Let's Begin!</span>
                    <span className="button-icon">→</span>
                  </>
                )}
              </button>
              {loading && <div className="footer-progress-bar"></div>}
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
      
      {/* Screenshot Upload Modal */}
      {showScreenshotModal && pageId && (
        <div className="screenshot-modal-overlay">
          <div className="screenshot-modal">
            <div className="screenshot-modal-header">
              <h3>Upload Website Screenshot</h3>
              <button 
                className="screenshot-modal-close" 
                onClick={() => {
                  console.log("Closing screenshot modal");
                  setShowScreenshotModal(false);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="screenshot-modal-body">
              {error && (
                <div className="screenshot-error">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              
              <div className="screenshot-content-wrapper">
                <div className="screenshot-instructions-column">
                  <p className="screenshot-instruction">
                    We were unable to automatically capture a screenshot of your website due to security restrictions. Please upload a screenshot manually.
                  </p>
                  
                  <div className="screenshot-how-to">
                    <h4>How to capture a screenshot:</h4>
                    <div className="screenshot-methods">
                      <div className="screenshot-method">
                        <div className="method-number">1</div>
                        <div className="method-content">
                          <strong>Browser Tools:</strong> Press <code>Ctrl+Shift+S</code> (Windows) or <code>Cmd+Shift+S</code> (Mac)
                        </div>
                      </div>
                      <div className="screenshot-method">
                        <div className="method-number">2</div>
                        <div className="method-content">
                          <strong>Context Menu:</strong> Right-click on page and select "Take Screenshot"
                        </div>
                      </div>
                      <div className="screenshot-method">
                        <div className="method-number">3</div>
                        <div className="method-content">
                          <strong>System Tools:</strong> <code>Win+Shift+S</code> (Windows) or <code>Cmd+Shift+4</code> (Mac)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="screenshot-upload-column">
                  <form onSubmit={handleScreenshotUpload} className="screenshot-form">
                    <div className="screenshot-upload-container">
                      {selectedScreenshot ? (
                        <div className="screenshot-file-selected">
                          <div className="screenshot-file-info">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                              <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <span className="screenshot-filename">{selectedScreenshot.name}</span>
                          </div>
                          <button 
                            type="button" 
                            className="screenshot-remove-btn"
                            onClick={() => {
                              console.log("Removing selected screenshot");
                              setSelectedScreenshot(null);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="screenshot-upload-area">
                          <input 
                            type="file" 
                            className="screenshot-file-input" 
                            onChange={handleScreenshotChange}
                            accept="image/*"
                          />
                          <div className="screenshot-upload-content">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
                              <path d="M16 5h6v6"></path>
                              <path d="M8 12l3 3 8-8"></path>
                            </svg>
                            <span className="screenshot-upload-text">
                              <strong>Click to upload</strong> or drag and drop
                            </span>
                            <span className="screenshot-upload-hint">
                              PNG, JPG, or WEBP (max 10MB)
                            </span>
                          </div>
                        </label>
                      )}
                    </div>
                    
                    <div className="screenshot-modal-actions">
                      <button 
                        type="button" 
                        className="screenshot-cancel-btn"
                        onClick={() => {
                          console.log("Closing screenshot modal");
                          setShowScreenshotModal(false);
                        }}
                        disabled={uploadingScreenshot}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="screenshot-submit-btn"
                        disabled={!selectedScreenshot || uploadingScreenshot}
                      >
                        {uploadingScreenshot ? (
                          <div className="loading-text-container">
                            <span className="current-loading-text">{loadingText}</span>
                          </div>
                        ) : (
                          <span className="btn-text-center">Upload & Continue</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
