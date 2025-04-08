import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const roleModelMap = {
  "Cosmetics & Beauty": [
    { id: 11, name: "Sephora" },
    { id: 14, name: "Watsons" },
    { id: 12, name: "Ulta beauty" },
    { id: 15, name: "Gratis" },
    { id: 13, name: "Glossier" },
  ],
  "Electronics & Gadgets": [
    { id: 16, name: "Best Buy" },
    { id: 19, name: "Teknosa" },
    { id: 17, name: "Newegg" },
    { id: 20, name: "Vatan Bilgisayar" },
    { id: 18, name: "Media Market" },
  ],
  "Fashion & Apparel": [
    { id: 6, name: "Zara" },
    { id: 8, name: "Uniqlo" },
    { id: 7, name: "ASOS" },
    { id: 10, name: "Mavi" },
    { id: 9, name: "Ipekyol" },
  ],
  "Furniture & Home Decor": [
    { id: 31, name: "IKEA" },
    { id: 32, name: "wayfair" },
    { id: 33, name: "westelm" },
    { id: 34, name: "Vivense" },
    { id: 35, name: "Madam Coco" },
  ],
  "Online Retail & Marketplace": [
    { id: 1, name: "Amazon" },
    { id: 4, name: "Trendyol" },
    { id: 3, name: "Walmart" },
    { id: 5, name: "Hepsiburada" },
    { id: 2, name: "eBey" },
  ],
  "Luxury Goods": [
    { id: 45, name: "Vakko" },
    { id: 41, name: "Farfetch" },
    { id: 44, name: "Beymen" },
    { id: 42, name: "Net-a-Porter" },
    { id: 43, name: "Ounass" },
  ],
  "Toys & Baby Products": [
    { id: 26, name: "Toys R Us" },
    { id: 28, name: "chicco" },
    { id: 29, name: "Joker" },
    { id: 30, name: "Ebebek" },
    { id: 27, name: "Hamleys" },
  ],
  "Jewelry & Accessories": [
    { id: 38, name: "Swarovski" },
    { id: 36, name: "Tiffany & Co" },
    { id: 37, name: "Pandora" },
    { id: 40, name: "Altınbaş" },
    { id: 39, name: "Atasay" },
  ],
  "Food & Grocery": [
    { id: 23, name: "Migros" },
    { id: 21, name: "Instacart" },
    { id: 24, name: "Getir" },
    { id: 22, name: "carrefoursa" },
    { id: 25, name: "Doordash" },
  ]
};

const BusinessOnboardingForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    category: "",
    role_model: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getAccessToken = () => sessionStorage.getItem("access_token");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication required. Redirecting to login...");
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = getAccessToken();
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      role_model: parseInt(form.role_model) // Ensure ID is sent as integer
    };

    try {
      const token = sessionStorage.getItem("access_token");
      const requestBody = { ...form, token };

      const response = await fetch("http://127.0.0.1:8000/onboard/business-onboard/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Business onboarded successfully!");
        onSuccess();
      } else {
        if (response.status === 401) {
          sessionStorage.removeItem("access_token");
          toast.error("Session expired. Redirecting...");
          navigate("/login");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
          toast.error(data.error || "Error submitting form.");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const roleModels = roleModelMap[form.category] || [];

  return (
    <form onSubmit={handleSubmit} className="onboarding-form">
      {error && <p className="error-message">{error}</p>}

      <label className="onboarding-label">Name of the Business</label>
      <input name="name" type="text" value={form.name} onChange={handleChange} required className="onboarding-input" maxLength={35} />

      <label className="onboarding-label">Business Category</label>
      <select name="category" value={form.category} onChange={handleChange} required className="onboarding-select">
        <option value="" disabled>Select a category</option>
        {Object.keys(roleModelMap).map((cat, idx) => (
          <option key={idx} value={cat}>{cat}</option>
        ))}
      </select>

      {form.category && (
        <>
          <label className="onboarding-label">Industry Role Model</label>
          <select name="role_model" value={form.role_model} onChange={handleChange} required className="onboarding-select">
            {roleModels.length > 0 ? (
              <>
                <option value="" disabled>Select a role model</option>
                {roleModels.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </>
            ) : (
              <option disabled>No role models available</option>
            )}
          </select>
        </>
      )}

      <button type="submit" disabled={loading} className="onboarding-button">
        {loading ? "Submitting..." : "Next"}
      </button>
    </form>
  );
};

export default BusinessOnboardingForm;