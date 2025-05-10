import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken, clearToken } from '../utils/auth';
import logo from "../assets/icons/logo.png";
import '../styles/global.css'; 
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const ShowFile = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFile = async () => {
      const token = getToken();
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(buildApiUrl(API_ENDPOINTS.UPLOAD.SHOW(fileId)), {
          method: "GET",
          headers: {
            "Authorization": token,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Session expired. Please log in again.");
            clearToken();
            navigate("/auth?mode=login");
          }
          throw new Error(`Failed to fetch file. Status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        setFileType(contentType);

        const blob = await response.blob();

        if (contentType.includes("csv")) {
          const text = await blob.text();
          parseCsvData(text);
        } else {
          setFileUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error("Error fetching file:", err);
        setError(err.message || "Could not load file.");
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [fileId, navigate]);

  const parseCsvData = (text) => {
    const rows = text.split("\n").map((row) => row.split(","));
    setCsvData(rows);
  };

  return (
    <div className='page-container'>
    <div className="header">
      <img src={logo} alt="logo" className="header-logo" />    
      <div className="header-links">  
      <a href="#">INFO</a>
      <a href="#">ABOUT</a>
      </div>
    </div>
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Courier New', monospace",
        color: "#000",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          textDecoration: "underline",
        }}
      >
        File Preview
      </h1>

      {loading && <p>Loading file...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ width: "90%", maxWidth: "1200px" }}>
          {fileType && fileType.startsWith("image") && (
            <img
              src={fileUrl}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "500px",
                borderRadius: "10px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            />
          )}

          {fileType === "application/pdf" && (
            <iframe
              src={fileUrl}
              width="100%"
              height="600px"
              title="PDF Preview"
              style={{
                border: "none",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            ></iframe>
          )}

          {fileType && fileType.includes("csv") && csvData && (
            <div
              style={{
                width: "100%",
                overflowX: "auto",
                maxHeight: "500px",
                border: "1px solid #ddd",
                borderRadius: "10px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#fff",
                marginTop: "20px",
                padding: "10px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                  textAlign: "left",
                }}
              >
                <thead style={{ backgroundColor: "#007bff", color: "#fff" }}>
                  <tr>
                    {csvData[0].map((header, index) => (
                      <th key={index} style={{ padding: "8px", border: "1px solid #ddd" }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(1).map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      style={{ backgroundColor: rowIndex % 2 === 0 ? "#f2f2f2" : "#fff" }}
                    >
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} style={{ padding: "8px", border: "1px solid #ddd" }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {fileType &&
            !fileType.startsWith("image") &&
            fileType !== "application/pdf" &&
            !fileType.includes("csv") && (
              <a
                href={fileUrl}
                download
                style={{
                  display: "inline-block",
                  padding: "10px 15px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "5px",
                  marginTop: "15px",
                }}
              >
                Download File
              </a>
            )}
        </div>
      )}
    </div>
  </div>
  );
};

export default ShowFile;
