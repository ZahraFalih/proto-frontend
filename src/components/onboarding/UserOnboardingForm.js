import React, { useState } from "react";
import { toast } from "react-toastify";

const UserOnboardingForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    role: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQ0MjExNzIzLCJpYXQiOjE3NDQxMjUzMjMsImp0aSI6ImQwOWI2NjhkM2Y2NzRkYTg4YzUyODUzZmE0ZTBiNTY5IiwidXNlcl9pZCI6NH0.1H5H-8YhZitNKgpkjwKmbCEw2ZaT_zKvxs1ePjm_DH8"
      const requestBody = { ...form, token };

      const response = await fetch("http://127.0.0.1:8000/onboard/user-onboard/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("User info saved!");
        onSuccess();
      } else {
        setError(data.error || "Submission failed. Try again.");
        toast.error(data.error || "Submission failed.");
      }
    } catch (err) {
      setError("Network error. Try again later.");
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="onboarding-form">
      {error && <p className="error-message">{error}</p>}

      <label className="onboarding-label">First Name</label>
      <input name="first_name" type="text" value={form.first_name} onChange={handleChange} required className="onboarding-input" />

      <label className="onboarding-label">Last Name</label>
      <input name="last_name" type="text" value={form.last_name} onChange={handleChange} required className="onboarding-input" />

      <label className="onboarding-label">Username</label>
      <input name="username" type="text" value={form.username} onChange={handleChange} required className="onboarding-input" />

      <label className="onboarding-label">Role</label>
      <select name="role" value={form.role} onChange={handleChange} required className="onboarding-select">
        <option value="" disabled>Select your role</option>
        {["Product Manager", "UX Designer", "Product Owner", "Product Analyst", "Frontend Developer"].map((role, idx) => (
          <option key={idx} value={role}>{role}</option>
        ))}
      </select>

      <button type="submit" disabled={loading} className="onboarding-button">
        {loading ? "Submitting..." : "Next"}
      </button>
    </form>
  );
};

export default UserOnboardingForm;