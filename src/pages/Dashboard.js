import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/DashboardPage.css';

function DashboardPage() {
  const [businessMetrics, setBusinessMetrics] = useState({});
  const [roleModelMetrics, setRoleModelMetrics] = useState({});
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [loadingRole, setLoadingRole] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Endpoints for the two parallel API calls
  const API_URL_BUSINESS = "http://127.0.0.1:8000/toolkit/web-metrics/business/";
  const API_URL_ROLE = "http://127.0.0.1:8000/toolkit/web-metrics/role-model/";

  function getAccessToken() {
    return sessionStorage.getItem("access_token");
  }

  // Ideal standards for each metric.
  const idealStandards = {
    "First Contentful Paint": "≤ 1.8 s",
    "Speed Index": "≤ 4.3 s",
    "Largest Contentful Paint (LCP)": "≤ 2.5 s",
    "Time to Interactive": "≤ 3.8 s",
    "Total Blocking Time (TBT)": "≤ 200 ms",
    "Cumulative Layout Shift (CLS)": "≤ 0.1"
  };

  // Helper: if a value is an object, convert it to a JSON string.
  function renderValue(value) {
    return typeof value === "object" ? JSON.stringify(value) : value;
  }

  useEffect(() => {
    async function fetchMetrics() {
      const token = getAccessToken();
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoadingBusiness(false);
        setLoadingRole(false);
        return;
      }

      try {
        // Run both API requests in parallel.
        const [businessResult, roleResult] = await Promise.allSettled([
          fetch(API_URL_BUSINESS, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }),
          fetch(API_URL_ROLE, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          })
        ]);

        // Process Business Metrics.
        if (businessResult.status === "fulfilled" && businessResult.value.ok) {
          const businessData = await businessResult.value.json();
          // Unwrap if data is nested
          const bm = businessData.url_metrics ? businessData.url_metrics : businessData;
          setBusinessMetrics(bm);
        } else {
          setError("Failed to fetch business metrics.");
        }
        setLoadingBusiness(false);

        // Process Role Model Metrics.
        if (roleResult.status === "fulfilled" && roleResult.value.ok) {
          const roleData = await roleResult.value.json();
          // Unwrap if data is nested
          const rm = roleData.role_model_metrics ? roleData.role_model_metrics : roleData;
          setRoleModelMetrics(rm);
        } else {
          setError("Failed to fetch role model metrics.");
        }
        setLoadingRole(false);
      } catch (err) {
        setError(err.message || "Could not load metrics.");
        setLoadingBusiness(false);
        setLoadingRole(false);
      }
    }

    fetchMetrics();
  }, [navigate]);

  // Create a union of keys from businessMetrics, roleModelMetrics, and idealStandards.
  const metricKeys = Array.from(new Set([
    ...Object.keys(businessMetrics),
    ...Object.keys(roleModelMetrics),
    ...Object.keys(idealStandards)
  ]));

  return (
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
              {metricKeys.length > 0 ? (
                metricKeys.map(metric => (
                  <tr key={metric}>
                    <td>{metric}</td>
                    <td>
                      {loadingBusiness
                        ? "Loading..."
                        : businessMetrics[metric]
                        ? renderValue(businessMetrics[metric])
                        : "N/A"}
                    </td>
                    <td>
                      {loadingRole
                        ? "Loading..."
                        : roleModelMetrics[metric]
                        ? renderValue(roleModelMetrics[metric])
                        : "N/A"}
                    </td>
                    <td>{idealStandards[metric] || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No metrics available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="widgets-container">
          <h2>Coming Soon</h2>
          <p>More insights and recommendations will appear here.</p>
        </div>
      </div>
      <div className="glowing-button-container">
      </div>
    </div>
  );
}

export default DashboardPage;
