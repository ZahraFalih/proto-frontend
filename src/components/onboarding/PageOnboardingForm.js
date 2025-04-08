import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const PageOnboardingForm = () => {
  const [form, setForm] = useState({
    page_type: "",
    page_url: ""
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

    try {
      const token = sessionStorage.getItem("access_token");
      const requestBody = { ...form, token };

      const response = await fetch("http://127.0.0.1:8000/onboard/page-onboard/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Page onboarded successfully!");
        navigate("/dashboard");
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

  return (
    <form onSubmit={handleSubmit} className="onboarding-form">
      {error && <p className="error-message">{error}</p>}

      <label className="onboarding-label">Page Type</label>
      <select
        name="page_type"
        value={form.page_type}
        onChange={handleChange}
        required
        className="onboarding-select"
      >
        <option value="" disabled>Select a page type</option>
        {["Landing Page", "Search Results Page", "Product Page"].map((type, idx) => (
          <option key={idx} value={type}>{type}</option>
        ))}
      </select>

      <label className="onboarding-label">Page URL</label>
      <input
        type="url"
        name="page_url"
        value={form.page_url}
        onChange={handleChange}
        required
        className="onboarding-input"
        maxLength={100}
      />

      <button type="submit" disabled={loading} className="onboarding-button">
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
};

export default PageOnboardingForm;