import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      fontFamily: 'Courier New, monospace',
      color: '#000',
      textAlign: 'center',
      padding: "20px",
      position: "relative"
    }}>
  
      {/* Upload File Button in the Top-Right Corner */}
      <div style={{
        position: "absolute",
        top: "20px",
        right: "20px",
      }}>
        <button 
          onClick={() => navigate("/datacollection")}
          style={{
            padding: "10px 15px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Upload File
        </button>
      </div>
  
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'underline' }}>
        My Uploads
      </h1>
  
      {loading && <p>Loading uploads...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
  
      {!loading && !error && uploads.length === 0 && <p>No uploads found.</p>}
  
      {!loading && !error && uploads.length > 0 && (
        <table style={{
          width: '70%',
          borderCollapse: 'collapse',
          marginTop: '20px',
          textAlign: 'left',
          border: '1px solid black'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload) => (
              <tr key={upload.id}>
                <td>{upload.id}</td>
                <td 
                  style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate(`/show/${upload.id}`)}  
                >
                  {upload.path.split("\\").pop()}
                </td>
                <td>
                  <button 
                    style={{ marginRight: "10px", background: "red", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}
                    onClick={() => handleDelete(upload.id)}
                  >
                    Delete
                  </button>
                  <button 
                    style={{ background: "blue", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}
                    onClick={() => handleUpdateClick(upload.id, upload.path.split("\\").pop())}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
  
      {showUpdateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px" }}>
            <h3>Update File</h3>
            <input type="text" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} />
            <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
            <button onClick={handleUpdate}>Save</button>
            <button onClick={() => setShowUpdateModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
  
};

export default ManageMyData;
