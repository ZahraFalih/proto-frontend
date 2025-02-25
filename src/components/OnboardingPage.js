// src/components/OnboardingPage.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const OnboardingPage = () => {
  const [businessType, setBusinessType] = useState("");
  const [industrySharks, setIndustrySharks] = useState("");
  const [businessURL, setBusinessURL] = useState("");
  const [businessName, setBusinessName] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (industrySharks.length > 35) {
      alert("Industry sharks field cannot exceed 35 characters.");
      return;
    }

    if (businessURL.length > 70) {
      alert("Business URL field cannot exceed 70 characters.");
      return;
    }

    if (businessName.length > 35) {
      alert("Business name field cannot exceed 35 characters.");
      return;
    }

    // Handle form submission logic (e.g., API call)
    console.log({ businessType, industrySharks, businessURL, businessName });

    // Redirect after submission
    navigate("/");
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
      <form onSubmit={handleSubmit} style={{ width: "350px", textAlign: "left" }}>
        {/* Business Type Dropdown */}
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

        {/* Industry Sharks Input */}
        <label>Sharks of Your Industry</label>
        <input
          type="text"
          value={industrySharks}
          onChange={(e) => setIndustrySharks(e.target.value)}
          maxLength={35}
          required
          style={{ width: "100%", padding: "5px", border: "1px solid #000", fontFamily: "Courier New, monospace" }}
        />

        {/* Business URL Input */}
        <label>Your Business URL</label>
        <input
          type="url"
          value={businessURL}
          onChange={(e) => setBusinessURL(e.target.value)}
          maxLength={70}
          required
          style={{ width: "100%", padding: "5px", border: "1px solid #000", fontFamily: "Courier New, monospace" }}
        />

        {/* Business Name Input */}
        <label>Name of the Business</label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          maxLength={35}
          required
          style={{ width: "100%", padding: "5px", border: "1px solid #000", fontFamily: "Courier New, monospace" }}
        />

        {/* Submit Button */}
        <button
          type="submit"
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
          Submit
        </button>
      </form>
    </div>
  );
};

export default OnboardingPage;
