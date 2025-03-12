import React, { useState, useEffect } from "react";

const ManageMyData = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = "http://127.0.0.1:8000/uploads/list";  // Adjust if needed
  const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQxNzg3MTk4LCJpYXQiOjE3NDE3MDA3OTgsImp0aSI6ImNlNWVhZDk2ZjFlZTQ4NzRhYzc4ZmU4YWRmMDg2MzFmIiwidXNlcl9pZCI6OH0.JjFpj0_fsO_myfgHgyjmm2qFd8zXHZRsuG5PtXGFIJ0";  // Replace with the actual JWT token

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Authorization": TOKEN,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch uploads");
        }

        const data = await response.json();
        setUploads(data);
      } catch (error) {
        console.error("Error fetching uploads:", error);
        setError("Could not load uploads. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, []);

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
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'underline' }}>
        My Uploads
      </h1>

      {loading && <p>Loading uploads...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <table style={{
          width: '50%',
          borderCollapse: 'collapse',
          marginTop: '20px',
          textAlign: 'left',
          border: '1px solid black'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '8px', border: '1px solid black' }}>ID</th>
              <th style={{ padding: '8px', border: '1px solid black' }}>Name</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload) => (
              <tr key={upload.id}>
                <td style={{ padding: '8px', border: '1px solid black' }}>{upload.id}</td>
                <td style={{ padding: '8px', border: '1px solid black' }}>{upload.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageMyData;
