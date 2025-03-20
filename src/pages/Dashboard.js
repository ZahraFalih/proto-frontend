import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/DashboardPage.css';

function WebMetricsTable() {
    const [metricsData, setMetricsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const API_URL = "http://127.0.0.1:8000/toolkit/web-metrics/";

    function getAccessToken() {
        return sessionStorage.getItem("access_token");
    }

    const idealStandards = {
        "First Contentful Paint": "≤ 1.8 s",
        "Speed Index": "≤ 4.3 s",
        "Largest Contentful Paint (LCP)": "≤ 2.5 s",
        "Time to Interactive": "≤ 3.8 s",
        "Total Blocking Time (TBT)": "≤ 200 ms",
        "Cumulative Layout Shift (CLS)": "≤ 0.1"
    };

    useEffect(() => {
        async function fetchMetrics() {
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
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        setError("Session expired. Please log in again.");
                        sessionStorage.removeItem("access_token");
                        navigate("/login");
                    }
                    throw new Error(`Failed to fetch metrics. Status: ${response.status}`);
                }

                const data = await response.json();
                setMetricsData(data);
            } catch (err) {
                console.error("Error fetching metrics:", err);
                setError(err.message || "Could not load metrics.");
            } finally {
                setLoading(false);
            }
        }

        fetchMetrics();
    }, [navigate]);

    if (loading) return <p>Loading metrics...</p>;
    if (error) return <p className="error-text">{error}</p>;

    const metricKeys = metricsData && metricsData.url_metrics ? Object.keys(metricsData.url_metrics) : [];

    return (
        <div className="dashboard-container">
            <h1 className="title">Web Metrics Dashboard</h1>

            {/* Dashboard Split Layout */}
            <div className="dashboard-content">
                {/* Left Column - Metrics Table */}
                <div className="metrics-container">
                    <table className="metrics-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Website Performance</th>
                                <th>Role Model Performance</th>
                                <th>Ideal Standard</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metricKeys.map(metric => (
                                <tr key={metric}>
                                    <td>{metric}</td>
                                    <td>{metricsData.url_metrics[metric]}</td>
                                    <td>{metricsData.role_model_metrics[metric]}</td>
                                    <td>{idealStandards[metric]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Right Column - Placeholder for Widgets/Future Content */}
                <div className="widgets-container">
                    <h2>Coming Soon</h2>
                    <p>More insights and recommendations will appear here.</p>
                </div>
            </div>

            {/* Glowing Button */}
            <div className="glowing-button-container">
                <button className="glowing-button" onClick={() => navigate("/dashboard")}>
                    Glow Fuck Yourself
                </button>
            </div>
        </div>
    );
}

export default WebMetricsTable;
