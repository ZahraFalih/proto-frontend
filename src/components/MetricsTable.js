import React, { useEffect, useState, useRef } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "../styles/MetricsTable.css"; // Optional: Create your own CSS for the table if needed

function MetricsTable({ pageId }) {
  const [businessMetrics, setBusinessMetrics] = useState(null);
  const [roleModelMetrics, setRoleModelMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef({}); // Cache metrics by pageId

  // Fixed ideal standards
  const idealStandards = {
    "First Contentful Paint": "≤ 1.8 s",
    "Speed Index": "≤ 4.3 s",
    "Largest Contentful Paint (LCP)": "≤ 2.5 s",
    "Time to Interactive": "≤ 3.8 s",
    "Total Blocking Time (TBT)": "≤ 200 ms",
    "Cumulative Layout Shift (CLS)": "≤ 0.1"
  };

  // For table rows, we use the ideal standards keys as the baseline
  const metricsKeys = Object.keys(idealStandards);

  useEffect(() => {
    if (!pageId) return;

    // If cached, use the cache
    if (cacheRef.current[pageId]) {
      const cached = cacheRef.current[pageId];
      setBusinessMetrics(cached.business);
      setRoleModelMetrics(cached.roleModel);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Retrieve the JWT token (for now you can hard-code it or retrieve from sessionStorage)
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQzNjg1ODI5LCJpYXQiOjE3NDM1OTk0MjksImp0aSI6IjhjMTU3NjgyZjZiZTQ3YmI4MmZiOTJmMzExYzc0NjBlIiwidXNlcl9pZCI6Nn0.Jwk8ZW-i16IKcnbPu_1K4nFi-EXtw1e5GR0Ayhhng_U"

    // Build the endpoint URLs with the pageId query parameter
    const businessURL = `http://127.0.0.1:8000/toolkit/web-metrics/business/?page_id=${pageId}`;
    const roleModelURL = `http://127.0.0.1:8000/toolkit/web-metrics/role-model/?page_id=${pageId}`;

    // Fetch both endpoints concurrently
    Promise.all([
      fetch(businessURL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      }),
      fetch(roleModelURL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })
    ])
      .then(async ([businessRes, roleModelRes]) => {
        if (businessRes.ok && roleModelRes.ok) {
          const businessData = await businessRes.json();
          const roleModelData = await roleModelRes.json();
          // Each response is an object with a key mapping to the metrics object.
          const businessObj = Object.values(businessData)[0] || {};
          const roleModelObj = Object.values(roleModelData)[0] || {};

          setBusinessMetrics(businessObj);
          setRoleModelMetrics(roleModelObj);
          // Cache the results
          cacheRef.current[pageId] = {
            business: businessObj,
            roleModel: roleModelObj
          };
        }
      })
      .catch((error) => {
        console.error("Error fetching metrics:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pageId]);

  return (
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
        {metricsKeys.map((metric) => (
          <tr key={metric}>
            <td>{metric}</td>
            <td>
              {loading ? (
                <Skeleton width={100} height={20} />
              ) : businessMetrics && businessMetrics[metric] ? (
                businessMetrics[metric]
              ) : (
                "N/A"
              )}
            </td>
            <td>
              {loading ? (
                <Skeleton width={100} height={20} />
              ) : roleModelMetrics && roleModelMetrics[metric] ? (
                roleModelMetrics[metric]
              ) : (
                "N/A"
              )}
            </td>
            <td>{idealStandards[metric]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default MetricsTable;
