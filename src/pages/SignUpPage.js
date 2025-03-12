import React, { useState, useEffect } from "react";


const SignUpPage = () => {
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState(null);


  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({username, email, password, first_name, last_name}),
      });

      const data = await response.json();
      const errorMessage = data.error || Object.values(data).join(" ") || "Something went wrong.";

      if (response.ok) {
        sessionStorage.setItem("access_token", data.access);
        alert("User created successfully!");
        navigate("/login");
      } else {
        setError(errorMessage);

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


      {error && <p style={{ color: 'red' }}>{error}</p>} 

      <form onSubmit={handleSignUp} style={{ width: '300px', textAlign: 'left' }}>
        <label>First Name</label>
        <input type="text" value={first_name} onChange={(e) => setFirstName(e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Last Name</label>
        <input type='text' value={last_name} onChange={(e) => setLastName (e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Username</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

        <label>Confirm Password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
          style={{ width: '100%', padding: '5px', border: '1px solid #000', fontFamily: 'Courier New, monospace' }} />

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
