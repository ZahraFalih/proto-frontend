import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/ManageMyData.css'; 
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from "../assets/icons/logo.png";
import '../styles/global.css'; 

const ManageMyData = () => {
  // State for uploads, loading, error
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for new file upload modal
  const [showNewUploadModal, setShowNewUploadModal] = useState(false);
  const [newUploadFile, setNewUploadFile] = useState(null);
  const [newUploadName, setNewUploadName] = useState("");
  const [newUploadPageId, setNewUploadPageId] = useState("");
  const [userPages, setUserPages] = useState([]);

  // State for update modal (if needed)
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [updatingFileId, setUpdatingFileId] = useState(null);

  const navigate = useNavigate();
  const API_URL = "http://127.0.0.1:8000/upload/list/";
  const getAccessToken = () => sessionStorage.getItem("access_token");

  // Fetch uploads using GET with token in headers
  useEffect(() => {
    const fetchUploads = async () => {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required. Redirecting to login...");
        navigate("/login");
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
        setError(error.message || "Could not load uploads.");
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, [navigate]);

  // Fetch user pages (POST with token in the body)
  const fetchUserPages = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const response = await fetch("http://127.0.0.1:8000/toolkit/user-pages/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        const pages = await response.json();
        setUserPages(pages);
      } else {
        console.error("Failed to fetch pages");
      }
    } catch (err) {
      console.error("Error fetching user pages:", err);
    }
  };

  // Handle new file upload submission
  const handleNewUploadSubmit = async (e) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication required.");
      return;
    }
    if (!newUploadFile || newUploadName.trim() === "" || !newUploadPageId) {
      toast.warning("Please fill in all fields.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", newUploadFile);
      formData.append("name", newUploadName);
      formData.append("page_id", newUploadPageId);
      formData.append("token", token); // Token passed in the body

      const response = await fetch("http://127.0.0.1:8000/upload/create/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed. Status: ${response.status}`);
      }

      toast.success("File uploaded successfully!");
      setShowNewUploadModal(false);
      setNewUploadFile(null);
      setNewUploadName("");
      setNewUploadPageId("");
      window.location.reload(); // Refresh the upload list
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Could not upload file.");
    }
  };

  // Handle summarization (using GET with Bearer token in headers)
  const handleSummarize = async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication required.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/ask-ai/ultra/?page_id=14", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Summarization failed.");
      const data = await response.json();
      sessionStorage.setItem("file_summary", data.summary);
      navigate("/dashboard");
    } catch (err) {
      console.error("Summarization error:", err);
      toast.warning("Could not summarize the file.");
    }
  };

  // Handle deletion of a file
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
      toast.success("File deleted successfully!");
      setUploads(uploads.filter(upload => upload.id !== fileId));
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.warning("Could not delete the file.");
    }
  };

  // Handle update modal trigger (if update functionality is used)
  const handleUpdateClick = (fileId, currentName) => {
    setUpdatingFileId(fileId);
    setNewFileName(currentName);
    setShowUpdateModal(true);
  };

  // (Optional) Handle updating a file – similar token logic in FormData
  const handleUpdate = async () => {
    if (!newFileName || !selectedFile) {
      toast.warning("Please provide both a name and a file.");
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
    formData.append("token", token);
    try {
      const response = await fetch(`http://127.0.0.1:8000/upload/update/${updatingFileId}/`, {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Failed to update file. Status: ${response.status}`);
      }
      toast.success("File updated successfully!");
      setShowUpdateModal(false);
      setUploads(uploads.map(upload =>
        upload.id === updatingFileId ? { ...upload, name: newFileName } : upload
      ));
    } catch (error) {
      console.error("Error updating file:", error);
      toast.warning("Could not update the file.");
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="header">
        <img src={logo} alt="logo" className="header-logo" />
        <div className="header-links">
          <a href="#">INFO</a>
          <a href="#">ABOUT</a>
        </div>
      </div>

      {/* Main Body */}
      <div className="container">
        <h1 className="page-title">My Data</h1>
        {loading && <p>Loading uploads...</p>}
        {error && <p className="error-text">{error}</p>}

        {/* If no uploads, show "Add New File" button; if uploads exist, show table */}
        {!loading && !error && uploads.length === 0 ? (
          <div className="no-uploads">
            <p>No uploads found.</p>
            <button
              className="add-upload-button"
              onClick={() => {
                fetchUserPages();
                setShowNewUploadModal(true);
              }}
            >
              Add New File
            </button>
          </div>
        ) : (
          <>
            <table className="uploads-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => {
                  const fileName = upload.path.split("\\").pop();
                  const fileParts = fileName.split("_");

                  // Extract date from the first part (assumed to be in YYYYMMDD format)
                  const rawDate = fileParts[0];
                  const formattedDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;

                  // Extract file name from the last three parts and remove extension
                  const nameWithExt = fileParts.slice(-3).join("_");
                  const nameOnly = nameWithExt.replace(/\.[^/.]+$/, "").replace(/_/g, " ");

                  // Get file type from extension
                  const fileType = fileName.split('.').pop();

                  return (
                    <tr key={upload.id}>
                      <td>{formattedDate}</td>
                      <td
                        className="file-name"
                        onClick={() => navigate(`/show/${upload.id}`)}
                      >
                        {nameOnly}
                      </td>
                      <td>{fileType}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="delete-button"
                            onClick={() => handleDelete(upload.id)}
                          >
                            Delete
                          </button>
                          <button
                            className="update-button"
                            onClick={() => handleUpdateClick(upload.id, fileName)}
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="dashboard-button-container">
              <button className="uiverse-btn" onClick={handleSummarize}>
                <span className="text">Generate</span>
              </button>
            </div>
          </>
        )}

        {/* Modal for New File Upload */}
        {showNewUploadModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Add New File</h3>
              <form onSubmit={handleNewUploadSubmit}>
                <label>File</label>
                <input
                  type="file"
                  onChange={(e) => setNewUploadFile(e.target.files[0])}
                  required
                />
                <label>Name</label>
                <input
                  type="text"
                  value={newUploadName}
                  onChange={(e) => setNewUploadName(e.target.value)}
                  required
                />
                <label>Page</label>
                <select
                  value={newUploadPageId}
                  onChange={(e) => setNewUploadPageId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a page</option>
                  {userPages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.type} - {page.url}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="submit" className="update-button">Submit</button>
                  <button type="button" className="delete-button" onClick={() => setShowNewUploadModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Updating a File */}
        {showUpdateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Update File</h3>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="New File Name"
                style={{ marginBottom: '10px', padding: '8px', width: '100%' }}
              />
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                style={{ marginBottom: '10px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={handleUpdate} className="update-button">
                  Submit
                </button>
                <button onClick={() => setShowUpdateModal(false)} className="delete-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ManageMyData;
