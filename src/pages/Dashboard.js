import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/DashboardPage.css';

const LLMAnswer = () => {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const API_URL = `http://127.0.0.1:8000/ask-ai/summarize/${fileId}/`;

  const getAccessToken = () => sessionStorage.getItem("access_token");

  useEffect(() => {
    const fetchAnswer = async () => {
      const token = getAccessToken();
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Authorization": token,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Session expired. Please log in again.");
            sessionStorage.removeItem("access_token");
            navigate("/login");
          }
          throw new Error(`Failed to fetch answer. Status: ${response.status}`);
        }

        const data = await response.json();
        // Assuming the backend returns { answer: "..." }
        setAnswer(data.summary);
      } catch (error) {
        console.error("Error fetching LLM answer:", error);
        setError(error.message || "Could not load the LLM answer.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnswer();
  }, [navigate]);

  return (
    <div className="container">
      <h1 className="title">LLM Agent Answer</h1>
      {loading && <p>Loading answer...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && answer && (
        <div className="answer-section">
          <p>{answer}</p>
        </div>
      )}
      {!loading && !error && !answer && (
        <p>No answer available at this time.</p>
      )}
    </div>
  );
};

export default LLMAnswer;
