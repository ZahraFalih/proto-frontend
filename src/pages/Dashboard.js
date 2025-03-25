import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "../styles/DashboardPage.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../assets/icons/logo.png";


function DashboardPage() {
  const [businessMetrics, setBusinessMetrics] = useState({});
  const [roleModelMetrics, setRoleModelMetrics] = useState({});
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [loadingRole, setLoadingRole] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState("");
  const [chunkedSummary, setChunkedSummary] = useState([]);
  const [fileSummary, setFileSummary] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_URL_BUSINESS = "http://127.0.0.1:8000/toolkit/web-metrics/business/";
  const API_URL_ROLE = "http://127.0.0.1:8000/toolkit/web-metrics/role-model/";
  const API_URL_SUMMARY = "http://127.0.0.1:8000/ask-ai/web-agent";

  const idealStandards = {
    "First Contentful Paint": "≤ 1.8 s",
    "Speed Index": "≤ 4.3 s",
    "Largest Contentful Paint (LCP)": "≤ 2.5 s",
    "Time to Interactive": "≤ 3.8 s",
    "Total Blocking Time (TBT)": "≤ 200 ms",
    "Cumulative Layout Shift (CLS)": "≤ 0.1"
  };

  const getAccessToken = () => sessionStorage.getItem("access_token");

  const renderValue = (value) => {
    return typeof value === "object" ? JSON.stringify(value) : value;
  };

  useEffect(() => {
    async function fetchMetrics() {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required. Redirecting to login...");
        navigate("/login");
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

        if (businessRes.status === "fulfilled" && businessRes.value.ok) {
          const data = await businessRes.value.json();
          const bm = data.url_metrics ? data.url_metrics : data;
          setBusinessMetrics(bm);
        } else {
          setError("Failed to load business metrics.");
        }
        setLoadingBusiness(false);

        if (roleRes.status === "fulfilled" && roleRes.value.ok) {
          const data = await roleRes.value.json();
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
      const fullSummary = data.web_evaluation || "No summary returned.";
      setSummary(fullSummary);

      const words = fullSummary.split(" ");
      const chunkSize = 9;
      const chunks = [];
      for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(" "));
      }
      setChunkedSummary(chunks);
    } catch (err) {
      setSummary("Failed to get AI summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const metricKeys = Array.from(
    new Set([
      ...Object.keys(idealStandards),
      ...Object.keys(businessMetrics || {}),
      ...Object.keys(roleModelMetrics || {})
    ])
  );

  return (
    <div className="page-container">
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
                        ? <Skeleton width={100} height={20} />
                        : renderValue(businessMetrics[metric] || "N/A")}
                    </td>
                    <td>
                      {loadingRole
                        ? <Skeleton width={100} height={20} />
                        : renderValue(roleModelMetrics[metric] || "N/A")}
                    </td>
                    <td>{idealStandards[metric] || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="answer-section">
              {!summary &&
                !loadingSummary &&
                !loadingBusiness &&
                !loadingRole &&
                Object.keys(businessMetrics).length > 0 &&
                Object.keys(roleModelMetrics).length > 0 && (
                  <div className="dashboard-button-container">
                    <button
                      className="uiverse-btn"
                      onClick={() => generateSummary(businessMetrics, roleModelMetrics)}
                    >
                      <svg
                        height={20}
                        width={20}
                        fill="#FFFFFF"
                        viewBox="0 0 24 24"
                        className="sparkle"
                      >
                        <path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z" />
                      </svg>
                      <span className="text">Generate</span>
                    </button>
                  </div>
              )}

              {loadingSummary && (
                <div className="summary-loader">
                  <Skeleton count={4} height={20} style={{ marginBottom: "8px" }} />
                </div>
              )}

              {!loadingSummary && chunkedSummary.length > 0 && (
                <div className="chunk-fade-wrapper summary-result">
                  {chunkedSummary.map((chunk, idx) => (
                    <span
                      key={idx}
                      className="chunk-fade"
                      style={{ animationDelay: `${idx * 0.5}s` }}
                    >
                      <ReactMarkdown components={{ p: "span" }}>{chunk}</ReactMarkdown>{" "}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="widgets-container">
            <h2>File Summary</h2>
            {fileSummary ? (
              <div className="chunk-fade-wrapper">
                {fileSummary
                  .split(" ")
                  .reduce((chunks, word, idx) => {
                    const chunkSize = 9;
                    const chunkIndex = Math.floor(idx / chunkSize);
                    if (!chunks[chunkIndex]) chunks[chunkIndex] = [];
                    chunks[chunkIndex].push(word);
                    return chunks;
                  }, [])
                  .map((chunk, idx) => (
                    <span
                      key={idx}
                      className="chunk-fade"
                      style={{ animationDelay: `${idx * 0.5}s` }}
                    >
                      <ReactMarkdown components={{ p: "span" }}>{chunk.join(" ")}</ReactMarkdown>{" "}
                    </span>
                  ))}
              </div>
            ) : (
              <p>Loading, please wait</p>
            )}
          </div>
        </div>

        <div className="glowing-button-container"></div>
      </div>

      <ToastContainer position="top-center" />
    </div>
  );
}

export default DashboardPage;
