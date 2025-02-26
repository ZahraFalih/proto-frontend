
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const DataCollectionPage = () => {
  const [file, setFile] = useState(null);
  const [goal, setGoal] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const getAccessToken = () => sessionStorage.getItem("access_token");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile && selectedFile.type !== "text/csv") {
      setError("Only CSV files are allowed.");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (goal.length > 300) {
      setError("Goal description cannot exceed 300 characters.");
      setLoading(false);
      return;
    }

    if (!file) {
      setError("Please upload a CSV file.");
      setLoading(false);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError("Authentication required. Please log in first.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("goal", goal);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/data-collection/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`, // Ensure token is sent
        },
        credentials: "include",
        body: formData, // Sending FormData (multipart/form-data)
      });

      const data = await response.json();

      if (response.ok) {
        alert("Data uploaded successfully!");
        navigate("/"); // Redirect after success
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
      console.error("Data upload error:", error);
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
        Data Collection
      </h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ width: "350px", textAlign: "left" }}>
        <label>Upload CSV File</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          required
          style={{
            width: "100%",
            padding: "5px",
            border: "1px solid #000",
            fontFamily: "Courier New, monospace",
          }}
        />

        {/* Goal Input */}
        <label>Goal (Max 300 characters)</label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          maxLength={300}
          required
          style={{
            width: "100%",
            padding: "5px",
            border: "1px solid #000",
            fontFamily: "Courier New, monospace",
            height: "80px",
            resize: "none",
          }}
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
          {loading ? "Uploading..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default DataCollectionPage;
