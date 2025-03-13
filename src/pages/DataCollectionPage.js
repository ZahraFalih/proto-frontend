import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const DataCollectionPage = () => {
  const [files, setFiles] = useState([]);
  const [fileNames, setFileNames] = useState([]); // State for file names
  const [goal, setGoal] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const getAccessToken = () => sessionStorage.getItem("access_token");

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        fontFamily: "Courier New, monospace",
        color: "#000",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: "bold", textDecoration: "underline" }}>
        Data Collection
      </h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ width: "350px", textAlign: "left" }}>
        <label>Upload Files</label>
        <input
          type="file"
          accept=".csv,.pdf,.png,.jpg,.jpeg,.txt"
          onChange={handleFileChange}
          multiple
          required
          style={{
            width: "100%",
            padding: "5px",
            border: "1px solid #000",
            fontFamily: "Courier New, monospace",
          }}
        />

        {/* Display Uploaded Files & Editable File Names */}
        {files.length > 0 && (
          <div style={{ fontSize: "14px", marginTop: "10px" }}>
            {files.map((file, index) => (
              <div key={index} style={{ marginBottom: "10px" }}>
                <span style={{ fontWeight: "bold" }}>{file.name}</span>
                <input
                  type="text"
                  value={fileNames[index]}
                  onChange={(e) => handleFileNameChange(index, e.target.value)}
                  placeholder="Enter file name"
                  required
                  style={{
                    width: "100%",
                    padding: "5px",
                    marginTop: "5px",
                    border: "1px solid #000",
                    fontFamily: "Courier New, monospace",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "none",
            color: "#000",
            padding: "5px 15px",
            border: "1px solid #000",
            cursor: "pointer",
            marginTop: "10px",
            fontFamily: "Courier New, monospace",
          }}
        >
          {loading ? "Uploading..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default DataCollectionPage;
