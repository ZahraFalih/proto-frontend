import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/DataCollectionPage.css'; 

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
      alert("Authentication required. Redirecting to login...");
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
        alert("Data uploaded successfully!");
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
    <div className="data-collection-container">
      <h1 className="data-collection-title">Data Collection</h1>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="data-collection-form">
        <label>Upload Files</label>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          multiple
          required
          className="file-input"
        />

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

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? "Uploading..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default DataCollectionPage;