import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/DataCollectionPage.css'; 
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DataCollectionPage = () => {
  const [files, setFiles] = useState([]);
  const [fileNames, setFileNames] = useState([]); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const getAccessToken = () => sessionStorage.getItem("access_token");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication required. Redirecting to login...");
      navigate("/login")
    }
  }, [navigate]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    setFiles(selectedFiles);
    setFileNames(selectedFiles.map((file) => file.name)); // Default file names
    setError(null);
  };

  const handleFileNameChange = (index, newName) => {
    const updatedNames = [...fileNames];
    updatedNames[index] = newName.trim(); // Prevent empty names
    setFileNames(updatedNames);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (files.length === 0) {
      setError("Please upload at least one file.");
      setLoading(false);
      return;
    }

    if (fileNames.some((name) => !name.trim())) {
      setError("Every file must have a name.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append("file", file); // Match your API format
      formData.append("name", fileNames[index]); // Name input
    });

    formData.append("token", getAccessToken()); // Token input

    try {
      const response = await fetch("http://127.0.0.1:8000/upload/create/", {
        method: "POST",
        credentials: "include",
        body: formData, // No headers included
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Data uploaded successfully!");
        navigate("/manage-data");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Data upload error:", error);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="data-collection-wrapper">
    <h1 className="data-collection-title">Data Collection</h1>

    <div className="data-collection-form-wrapper">
      <form onSubmit={handleSubmit} className="data-collection-form">
        {error && <p className="error-message">{error}</p>}

        <div className="custom-file-upload">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            multiple
            required
            id="hiddenFileInput"
            className="hidden-input"
          />
          <label htmlFor="hiddenFileInput" className="custom-upload-button">
            <svg
              aria-hidden="true"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeWidth="2"
                stroke="#ffffff"
                d="M13.5 3H12H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H11M13.5 3L19 8.625M13.5 3V7.625C13.5 8.17728 13.9477 8.625 14.5 8.625H19M19 8.625V11.8125"
                strokeLinejoin="round"
                strokeLinecap="round"
              ></path>
              <path
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2"
                stroke="#ffffff"
                d="M17 15V18M17 21V18M17 18H14M17 18H20"
              ></path>
            </svg>
            ADD FILE
          </label>
        </div>

        {files.length > 0 && (
          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-name">{file.name}</span>
                <input
                  type="text"
                  value={fileNames[index]}
                  onChange={(e) => handleFileNameChange(index, e.target.value)}
                  placeholder="Enter file name"
                  required
                  className="file-name-input"
                />
              </div>
            ))}
          </div>
        )}
      </form>
    </div>

    <div className="submit-wrapper">
      <button type="submit" disabled={loading} className="submit-button">
        {loading ? "Uploading..." : "Submit"}
      </button>
    </div>

    <ToastContainer position="top-center" />
  </div>

  );
};

export default DataCollectionPage;