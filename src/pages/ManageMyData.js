import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/ManageMyData.css'; 

const ManageMyData = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [updatingFileId, setUpdatingFileId] = useState(null);
  
  const navigate = useNavigate();
  const API_URL = "http://127.0.0.1:8000/upload/list/";

  // Fetch token from session storage
  const getAccessToken = () => sessionStorage.getItem("access_token");

  useEffect(() => {
    const fetchUploads = async () => {
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
            "Authorization": token,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Session expired. Please log in again.");
            sessionStorage.removeItem("access_token");
            navigate("/login");
          }
          throw new Error(`Failed to fetch uploads. Status: ${response.status}`);
        }

        const data = await response.json();
        setUploads(data);
      } catch (error) {
        console.error("Error fetching uploads:", error);
        setError(error.message || "Could not load uploads.");
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, [navigate]);

  const handleSummarize = async (fileId) => {
    console.log("File ID:", fileId);  
    const token = getAccessToken();
    if (!token) {
      setError("Authentication required. Please log in first.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/ask-ai/summarize/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json", 
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to summarize file. Status: ${response.status}`);
      }
      const data = await response.json();
      alert(data.summary);
    } catch (error) {
      console.error("Error summarizing file:", error);
      alert("Could not summarize the file.");
    }
  };

  const handleDelete = async (fileId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this file?");
    if (!confirmDelete) return;

    const token = getAccessToken();
    if (!token) {
      setError("Authentication required.");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/upload/delete/${fileId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file. Status: ${response.status}`);
      }

      alert("File deleted successfully!");
      setUploads(uploads.filter(upload => upload.id !== fileId));

    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Could not delete the file.");
    }
  };

  const handleUpdateClick = (fileId, currentName) => {
    setUpdatingFileId(fileId);
    setNewFileName(currentName);
    setShowUpdateModal(true);
  };

  const handleUpdate = async () => {
    if (!newFileName || !selectedFile) {
      alert("Please provide both a name and a file.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError("Authentication required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", newFileName);
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`http://127.0.0.1:8000/upload/update/${updatingFileId}/`, {
        method: "PUT",
        headers: {
          "Authorization": token,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to update file. Status: ${response.status}`);
      }

      alert("File updated successfully!");
      setShowUpdateModal(false);

      setUploads(uploads.map(upload =>
        upload.id === updatingFileId ? { ...upload, name: newFileName } : upload
      ));

    } catch (error) {
      console.error("Error updating file:", error);
      alert("Could not update the file.");
    }
  };

  return (
    <div className="container">
      <div className="upload-button-container">
        <button onClick={() => navigate("/datacollection")} className="upload-button">
          Upload File
        </button>
      </div>
      <h1 className="title">My Uploads</h1>
      {loading && <p>Loading uploads...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && uploads.length === 0 && <p>No uploads found.</p>}
      {!loading && !error && uploads.length > 0 && (
        <table className="uploads-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload) => (
              <tr key={upload.id}>
                <td>{upload.id}</td>
                <td className="file-name" onClick={() => navigate(`/show/${upload.id}`)}>
                  {upload.path.split("\\").pop()}
                </td>
                <td>
                  <button className="delete-button" onClick={() => handleDelete(upload.id)}>
                    Delete
                  </button>
                  <button className="update-button" onClick={() => handleUpdateClick(upload.id, upload.path.split("\\").pop())}>
                    Update
                  </button>
                  <button className="summarize-button" onClick={() => handleSummarize(upload.id)}>
                    Summarize
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Glowing, blazing, hypnotizing, baffling, bazziling button */}
      <div className="glowing-button-container">
        <button className="glowing-button" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ManageMyData;
