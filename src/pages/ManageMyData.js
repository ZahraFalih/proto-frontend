import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/ManageMyData.css'; 
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from "../assets/icons/logo.png";
import '../styles/global.css'; 

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
        toast.error("Authentication required. Redirecting to login...");
        navigate("/login")
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

  const handleSummarize = async () => {
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
      sessionStorage.setItem("file_summary", data.summary);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error summarizing file:", error);
      toast.warning("Could not summarize the file.");
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

      toast.success("File deleted successfully!");
      setUploads(uploads.filter(upload => upload.id !== fileId));

    } catch (error) {
      console.error("Error deleting file:", error);
      toast.warning("Could not delete the file.");
    }
  };

  const handleUpdateClick = (fileId, currentName) => {
    setUpdatingFileId(fileId);
    setNewFileName(currentName);
    setShowUpdateModal(true);
  };

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
    <div className='page-container'>
    <div className="header">
      <img src={logo} alt="logo" className="header-logo" />    
      <div className="header-links">  
      <a href="#">INFO</a>
      <a href="#">ABOUT</a>
      </div>
    </div>
    <div className="container">
      {/* Top Title */}
      <h1 className="page-title">My Data</h1>
  
      {/* Status Messages */}
      {loading && <p>Loading uploads...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && uploads.length === 0 && <p>No uploads found.</p>}
  
      {!loading && !error && uploads.length > 0 && (
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

            // Extract and format date
            const rawDate = fileParts[0];
            const formattedDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;

            // Extract and clean name
            const nameWithExt = fileParts.slice(-3).join("_");
            const nameOnly = nameWithExt.replace(/\.[^/.]+$/, "").replace(/_/g, " ");

            // File type
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
                  {/* Flex container for buttons */}
                  <div className="action-buttons">
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(upload.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 69 14"
                        className="svgIcon bin-top"
                      >
                        <g clipPath="url(#clip0_35_24)">
                          <path
                            d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734ZM64.0023 20.0648C64.0397 19.4882 63.5822 19 63.0044 19H5.99556C5.4178 19 4.96025 19.4882 4.99766 20.0648L8.19375 69.3203C8.44018 73.0758 11.6746 76 15.5712 76H53.4288C57.3254 76 60.5598 73.0758 60.8062 69.3203L64.0023 20.0648Z"
                            fill="white"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_35_24">
                            <rect fill="white" height="14" width="69"></rect>
                          </clipPath>
                        </defs>
                      </svg>

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 69 57"
                        className="svgIcon bin-bottom"
                      >
                        <g clipPath="url(#clip0_35_22)">
                          <path
                            d="M20.8232 -16.3727L19.9948 -14.787C19.8224 -14.4569 19.4808 -14.25 19.1085 -14.25H4.92857C2.20246 -14.25 0 -12.1273 0 -9.5C0 -6.8727 2.20246 -4.75 4.92857 -4.75H64.0714C66.7975 -4.75 69 -6.8727 69 -9.5C69 -12.1273 66.7975 -14.25 64.0714 -14.25H49.8915C49.5192 -14.25 49.1776 -14.4569 49.0052 -14.787L48.1768 -16.3727C47.3451 -17.9906 45.6355 -19 43.7719 -19H25.2281C23.3645 -19 21.6549 -17.9906 20.8232 -16.3727ZM64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z"
                            fill="white"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_35_22">
                            <rect fill="white" height="57" width="69"></rect>
                          </clipPath>
                        </defs>
                      </svg>
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
      <div
        className="plusButton"
        tabIndex="0"
        onClick={() => navigate("/datacollection")}
      >
        <svg
          className="plusIcon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 30 30"
        >
          <g>
            <path d="M13.75 23.75V16.25H6.25V13.75H13.75V6.25H16.25V13.75H23.75V16.25H16.25V23.75H13.75Z" />
          </g>
        </svg>
      </div>

    </>
  )}

  {/* Update Modal */}
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

      {/* Go to Dashboard Button */}
      <div className="dashboard-button-container">
        <button className="uiverse-btn" onClick={handleSummarize}>
          <svg
            height={20}
            width={20}
            fill="#FFFFFF"
            viewBox="0 0 24 24"
            className="sparkle"
          >
            <path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z" />
          </svg>
          <span className="text">Generate</span>
        </button>
      </div>
    </div>
   </div>
  );
};

export default ManageMyData;
