import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const OnboardingPage = () => {
  const [businessType, setBusinessType] = useState("");
  const [industrySharks, setIndustrySharks] = useState("");
  const [businessURL, setBusinessURL] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const getAccessToken = () => sessionStorage.getItem("access_token");

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
      const response = await fetch("http://127.0.0.1:8000/api/onboarding/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          category: businessType,
          url: businessURL,
          name: businessName,
          role_model: industrySharks,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Business onboarded successfully!");
        navigate("/dashboard");
      } else {
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          sessionStorage.removeItem("access_token");
          navigate("/login");
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        fontFamily: "Courier New, monospace",
        color: "#000",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: "bold", textDecoration: "underline" }}>
        Business Onboarding
      </h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ width: "350px", textAlign: "left" }}>
        <label>Type of Business</label>
        <select
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          required
          style={{ width: "100%", padding: "5px", border: "1px solid #000", fontFamily: "Courier New, monospace" }}
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

        <label>Sharks of Your Industry</label>
        <input
          type="text"
          value={industrySharks}
          onChange={(e) => setIndustrySharks(e.target.value)}
          maxLength={35}
          required
          style={{ width: "100%", padding: "5px", border: "1px solid #000", fontFamily: "Courier New, monospace" }}
        />

        <label>Your Business URL</label>
        <input
          type="url"
          value={businessURL}
          onChange={(e) => setBusinessURL(e.target.value)}
          maxLength={70}
          required
          style={{ width: "100%", padding: "5px", border: "1px solid #000", fontFamily: "Courier New, monospace" }}
        />

        <label>Name of the Business</label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          maxLength={35}
          required
          style={{ width: "100%", padding: "5px", border: "1px solid #000", fontFamily: "Courier New, monospace" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "none",
            color: "#000",
            padding: "5px 15px",
            border: "1px solid #000",
            cursor: "pointer",
            marginTop: "10px",
            fontFamily: "Courier New, monospace",
          }}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default OnboardingPage;
