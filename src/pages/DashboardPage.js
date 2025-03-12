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
    <div className="dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>

      {error && <p className="dashboard-error">{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <div className="dashboard-content">
          <div className="dashboard-llm-box">
            <h3>LLM Generated Insights</h3>
            <p className="dashboard-llm-text">{llmResponse || "Awaiting response..."}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
