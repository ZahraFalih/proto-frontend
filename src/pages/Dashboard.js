import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import '../styles/DashboardPage.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from "../assets/icons/logo.png";
import '../styles/global.css'; 

function DashboardPage() {
  // State for metrics and summary
  const [businessMetrics, setBusinessMetrics] = useState({});
  const [roleModelMetrics, setRoleModelMetrics] = useState({});
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [loadingRole, setLoadingRole] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState("");
  const [fileSummary, setFileSummary] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // API Endpoints
  const API_URL_BUSINESS = "http://127.0.0.1:8000/toolkit/web-metrics/business/";
  const API_URL_ROLE = "http://127.0.0.1:8000/toolkit/web-metrics/role-model/";
  const API_URL_SUMMARY = "http://127.0.0.1:8000/ask-ai/web-agent";

  // Ideal standards for display
  const idealStandards = {
    "First Contentful Paint": "≤ 1.8 s",
    "Speed Index": "≤ 4.3 s",
    "Largest Contentful Paint (LCP)": "≤ 2.5 s",
    "Time to Interactive": "≤ 3.8 s",
    "Total Blocking Time (TBT)": "≤ 200 ms",
    "Cumulative Layout Shift (CLS)": "≤ 0.1"
  };

  const getAccessToken = () => sessionStorage.getItem("access_token");

  // Helper: if value is an object, convert it to a string.
  const renderValue = (value) => {
    return typeof value === "object" ? JSON.stringify(value) : value;
  };

  // Fetch metrics from both endpoints in parallel
  useEffect(() => {
    async function fetchMetrics() {
      const token = getAccessToken();
      if (!token) {
      toast.error("Authentication required. Redirecting to login...");
      navigate("/login")
      }

      try {
        const [businessRes, roleRes] = await Promise.allSettled([
          fetch(API_URL_BUSINESS, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }),
          fetch(API_URL_ROLE, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          })
        ]);

        // Process Business Metrics
        if (businessRes.status === "fulfilled" && businessRes.value.ok) {
          const data = await businessRes.value.json();
          // Unwrap if nested under "url_metrics"
          const bm = data.url_metrics ? data.url_metrics : data;
          setBusinessMetrics(bm);
        } else {
          setError("Failed to load business metrics.");
        }
        setLoadingBusiness(false);

        // Process Role Model Metrics
        if (roleRes.status === "fulfilled" && roleRes.value.ok) {
          const data = await roleRes.value.json();
          // Unwrap if nested under "role_model_metrics"
          const rm = data.role_model_metrics ? data.role_model_metrics : data;
          setRoleModelMetrics(rm);
        } else {
          setError("Failed to load role model metrics.");
        }
        setLoadingRole(false);
      } catch (err) {
        setError("Failed to fetch metrics.");
        setLoadingBusiness(false);
        setLoadingRole(false);
      }
    }

    fetchMetrics();
  }, [navigate]);

  useEffect(() => {
    const stored = sessionStorage.getItem("file_summary");
    if (stored) {
      setFileSummary(stored);
      sessionStorage.removeItem("file_summary"); 
    }
  }, []);

  // When both metrics are loaded, send them to the AI summary endpoint
  useEffect(() => {
    if (
      !loadingBusiness &&
      !loadingRole &&
      Object.keys(businessMetrics).length > 0 &&
      Object.keys(roleModelMetrics).length > 0
    ) {
      generateSummary(businessMetrics, roleModelMetrics);
    }
  }, [loadingBusiness, loadingRole, businessMetrics, roleModelMetrics]);

  const generateSummary = async (urlMetrics, sharkMetrics) => {
    const token = getAccessToken();
    setLoadingSummary(true);

    try {
      const res = await fetch(API_URL_SUMMARY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url_metrics: urlMetrics, shark_metrics: sharkMetrics })
      });

      const data = await res.json();
      setSummary(data.web_evaluation || "No summary returned.");
    } catch (err) {
      setSummary("Failed to get AI summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Compute union of keys from ideal standards and metrics
  const metricKeys = Array.from(
    new Set([
      ...Object.keys(idealStandards),
      ...Object.keys(businessMetrics || {}),
      ...Object.keys(roleModelMetrics || {})
    ])
  );

  return (
    <div className='page-container'>
    <div className="header">
      <img src={logo} alt="logo" className="header-logo" />    
      <div className="header-links">  
      <a href="#">INFO</a>
      <a href="#">ABOUT</a>
      </div>
    </div>
    <div className="dashboard-container">
      <h1 className="title">Web Metrics Dashboard</h1>
      {error && <p className="error-text">{error}</p>}

      <div className="dashboard-content">
        <div className="metrics-container">
          <table className="metrics-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Business Performance</th>
                <th>Role Model Performance</th>
                <th>Ideal Standard</th>
              </tr>
            </thead>
            <tbody>
              {metricKeys.map((metric) => (
                <tr key={metric}>
                  <td>{metric}</td>
                  <td>
                    {loadingBusiness
                      ? "Loading..."
                      : renderValue(businessMetrics[metric] || "N/A")}
                  </td>
                  <td>
                    {loadingRole
                      ? "Loading..."
                      : renderValue(roleModelMetrics[metric] || "N/A")}
                  </td>
                  <td>{idealStandards[metric] || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* AI Summary rendered with Markdown */}
          <div className="answer-section">
            {loadingSummary ? (
              <p>Generating summary...</p>
            ) : (
              <ReactMarkdown>{summary}</ReactMarkdown>
            )}
          </div>
        </div>

        <div className="widgets-container">
          <h2>File Summary</h2>
          {fileSummary ? (
             <ReactMarkdown>{fileSummary}</ReactMarkdown>
            ) : (
          <p>Loading, please wait</p>
           )}
        </div>
      </div>
      <div className="glowing-button-container">
      </div>
    </div>
    </div>
  );
}

export default DashboardPage;
