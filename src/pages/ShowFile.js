import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import '../styles/ShowFile.css'; 

const ShowFile = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAccessToken = () => sessionStorage.getItem("access_token");

  useEffect(() => {
    const fetchFile = async () => {
      const token = getAccessToken();
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:8000/upload/show/${fileId}/`, {
          method: "GET",
          headers: {
            "Authorization": token,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Session expired. Please log in again.");
            sessionStorage.removeItem("access_token");
            navigate("/login");
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
    <div className="file-preview-container">
      <h1 className="file-preview-title">File Preview</h1>

      {loading && <p>Loading file...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <div className="file-preview-wrapper">
          {fileType && fileType.startsWith("image") && (
            <img src={fileUrl} alt="Preview" className="image-preview" />
          )}

          {fileType === "application/pdf" && (
            <iframe src={fileUrl} className="pdf-preview" title="PDF Preview"></iframe>
          )}

          {fileType && fileType.includes("csv") && csvData && (
            <div className="csv-container">
              <table className="csv-table">
                <thead>
                  <tr>
                    {csvData[0].map((header, index) => (
                      <th key={index} className="csv-header">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? "even-row" : "odd-row"}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="csv-cell">
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
              <a href={fileUrl} download className="download-button">
                Download File
              </a>
            )}
        </div>
      )}
    </div>
  );
};

export default ShowFile;
