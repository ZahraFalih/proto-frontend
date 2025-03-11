import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const [llmResponse, setLLMResponse] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const getAccessToken = () => sessionStorage.getItem("access_token");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setError(null);
      const token = getAccessToken();

      if (!token) {
        setError("Authentication required. Please log in first.");
        navigate("/login");
        return;
      }

      try {
        // Fetch LLM-generated text
        const llmRes = await fetch("http://127.0.0.1:8000/api/llm-response/", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        const llmData = await llmRes.json();
        if (!llmRes.ok) throw new Error(llmData.error || "Failed to fetch LLM response");

        // Update state with fetched data
        setLLMResponse(llmData.text);
      } catch (error) {
        console.error("Dashboard Error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

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
        Dashboard
      </h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <div style={{ width: "80%", maxWidth: "600px", textAlign: "left", marginTop: "20px" }}>
          {/* LLM Generated Response */}
          <div style={{ border: "1px solid #000", padding: "10px", marginBottom: "10px" }}>
            <h3>LLM Generated Insights</h3>
            <p style={{ whiteSpace: "pre-line" }}>{llmResponse || "Awaiting response..."}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
