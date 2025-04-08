import React, { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../assets/icons/logo.png";
import "../styles/DashboardPage.css";
import MetricsTable from "../components/MetricsTable";

function Dashboard() {
  const [userPages, setUserPages] = useState([]);
  const navigate = useNavigate();
  const { pageId } = useParams();


  const API_URL = "http://127.0.0.1:8000/toolkit/user-pages/";
  // Hard-coded token for testing (or use sessionStorage)
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQzNjg1ODI5LCJpYXQiOjE3NDM1OTk0MjksImp0aSI6IjhjMTU3NjgyZjZiZTQ3YmI4MmZiOTJmMzExYzc0NjBlIiwidXNlcl9pZCI6Nn0.Jwk8ZW-i16IKcnbPu_1K4nFi-EXtw1e5GR0Ayhhng_U";

  useEffect(() => {
    async function fetchUserPages() {
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token })
        });

        if (res.ok) {
          const data = await res.json();
          setUserPages(data);

          // Redirect to first tab if no page is selected
          if (!pageId && data.length > 0) {
            navigate(`/dashboard/${data[0].id}`);
          }
        } else {
          toast.error("Failed to fetch pages.");
        }
      } catch (err) {
        toast.error("An error occurred while fetching pages.");
      }
    }

    fetchUserPages();
  }, [navigate, pageId]);

  return (
    <div className="page-container">
      {/* Design Header */}
      <div className="header">
        <img src={logo} alt="logo" className="header-logo" />
        <div className="header-links">
          <Link to="/datacollection">Add Files</Link>
          <Link to="/manage-data">Manage my Data</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-container">
        {userPages.map((page) => (
          <Link
            key={page.id}
            to={`/dashboard/${page.id}`}
            className={`tab ${String(page.id) === pageId ? "active-tab" : ""}`}
          >
            {page.type}
          </Link>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {pageId ? (
          <MetricsTable pageId={pageId} />
        ) : (
          <p>Select a page tab to view metrics.</p>
        )}
      </div>

      <ToastContainer position="top-center" />
    </div>
  );
}

export default Dashboard;
