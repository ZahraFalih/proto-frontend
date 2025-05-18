// src/components/dashboard/AddPageModal.js
import React, { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { useNavigate } from 'react-router-dom';
import ProgressLoader from '../common/ProgressLoader';
import '../../styles/AddPageModal.css';
import { getToken } from '../../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';

const PAGE_TYPES = ['Landing Page', 'Search Results Page', 'Product Page'];

export default function AddPageModal({
  visible,
  onClose,
  onPageAdded,
  existingPageTypes = []
}) {
  const [selectedType, setSelectedType] = useState('');
  const [pageURL, setPageURL] = useState('');
  const [selectedUbaFile, setSelectedUbaFile] = useState(null);
  const [pageId, setPageId] = useState(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [error, setError] = useState(null);
  const [showProgressLoader, setShowProgressLoader] = useState(false);
  const navigate = useNavigate();

  const reset = () => {
    setSelectedType('');
    setPageURL('');
    setSelectedUbaFile(null);
    setSelectedScreenshot(null);
    setShowScreenshotModal(false);
    setError(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleUbaFileChange = e => {
    const file = e.target.files?.[0];
    if (file) setSelectedUbaFile(file);
  };

  // STEP 1: create page record
  const handlePageOnboard = async e => {
    e.preventDefault();
    setError(null);
    if (!selectedType || !pageURL) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    
    console.log('[AddPageModal] Starting page onboarding with type:', selectedType, 'URL:', pageURL);
    
    const token = getToken();
    const payload = { page_type: selectedType, url: pageURL, token };

    try {
      // Build the API URL directly for testing
      const apiUrl = `https://proto-api-kg9r.onrender.com/onboard/page-onboard/`;
      console.log('[AddPageModal] Using direct URL:', apiUrl);
      
      // Use the correct API endpoint
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      console.log('[AddPageModal] Page onboarding response status:', res.status);
      
      const text = await res.text();
      console.log('[AddPageModal] Page onboarding response:', text);
      
      let data;
      try { 
        data = JSON.parse(text); 
        console.log('[AddPageModal] Parsed response:', data);
      } catch (parseErr) { 
        console.error('[AddPageModal] Error parsing response:', parseErr);
        data = { error: 'Invalid server response' }; 
      }

      if (!res.ok) {
        if (res.status === 401) { 
          setError('Session expired.'); 
          navigate('/login'); 
        }
        else { 
          setError(data.error || `Error ${res.status}`); 
        }
      }
      else if (data.url == null) {
        setError('Invalid URL provided.');
      }
      else if (data.id != null) {
        console.log('[AddPageModal] Page created successfully with ID:', data.id);
        setPageId(data.id);

        // screenshot missing? show that step
        if (!data.screenshot_path) {
          console.log('[AddPageModal] No screenshot path, showing screenshot modal');
          setShowScreenshotModal(true);
        }
        // already has screenshot, move to UBA or finish
        else if (selectedUbaFile) {
          console.log('[AddPageModal] Screenshot already exists, uploading UBA file');
          await uploadUbaFile(data.id);
        } else {
          console.log('[AddPageModal] Page created successfully, no UBA to upload');
          onPageAdded(data);
          handleClose();
          navigate('/dashboard');
        }
      } else {
        setError('Server error: Missing page ID.');
      }
    } catch (err) {
      console.error('[AddPageModal] Page onboarding error:', err);
      setError('Network error: ' + (err.message || 'Failed to connect to server'));
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: upload UBA file
  const uploadUbaFile = async id => {
    if (!selectedUbaFile) {
      // If no UBA file, just complete the page addition
      setShowProgressLoader(true);
      onPageAdded({ id, type: selectedType, url: pageURL });
      handleClose();
      return;
    }

    setLoading(true);
    console.log('[AddPageModal] Starting UBA file upload for page ID:', id);
    
    const formData = new FormData();
    const token = getToken();
    formData.append('token', token);
    formData.append('file', selectedUbaFile);
    formData.append('page_id', String(id));
    formData.append('name', selectedType);

    try {
      // Clear any existing UBA cache for this page
      localStorage.removeItem(`uba_cache_${id}`);
      
      console.log('[AddPageModal] Sending UBA file upload request');
      const res = await fetch(buildApiUrl(API_ENDPOINTS.UPLOAD.CREATE), {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      console.log('[AddPageModal] UBA upload response status:', res.status);
      
      // Attempt to get response text and parse it
      let textResponse = '';
      try {
        textResponse = await res.text();
        console.log('[AddPageModal] UBA upload response:', textResponse);
      } catch (textError) {
        console.error('[AddPageModal] Error reading UBA upload response:', textError);
      }
      
      // Parse the response if possible
      let errorMessage = '';
      let responseData = null;
      try {
        if (textResponse) {
          responseData = JSON.parse(textResponse);
          console.log('[AddPageModal] Parsed UBA upload response:', responseData);
        }
      } catch (parseError) {
        console.error('[AddPageModal] Error parsing UBA upload response:', parseError);
      }
      
      if (!res.ok) {
        errorMessage = responseData?.error || 'UBA upload failed';
        console.error('[AddPageModal] UBA upload failed:', errorMessage);
      } else {
        console.log('[AddPageModal] UBA upload successful');
      }
      
      // Whether UBA upload succeeds or fails, we still want to add the page
      setShowProgressLoader(true);
      onPageAdded({ id, type: selectedType, url: pageURL });
      handleClose();

      if (!res.ok) {
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('[AddPageModal] UBA upload error:', err);
      // Show error toast or notification to user
      // But don't prevent page addition
      setShowProgressLoader(true);
      onPageAdded({ id, type: selectedType, url: pageURL });
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: upload screenshot, then chain to UBA if needed
  const handleScreenshotUpload = async (e) => {
    e.preventDefault();
    setError(null);
    if (!selectedScreenshot || pageId == null) {
      setError('Screenshot or page ID missing.');
      return;
    }
    setUploadingScreenshot(true);
    
    console.log('[AddPageModal] Uploading screenshot for page ID:', pageId);
    
    const formData = new FormData();
    const token = getToken();
    formData.append('token', token);
    formData.append('page_id', String(pageId));
    formData.append('screenshot', selectedScreenshot);

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.ONBOARD.UPLOAD_SCREENSHOT), {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      console.log('[AddPageModal] Screenshot upload status:', res.status);
      
      // Get response text and try to parse it
      const textResponse = await res.text();
      console.log('[AddPageModal] Screenshot upload response:', textResponse);
      
      let responseData;
      try {
        responseData = JSON.parse(textResponse);
      } catch (e) {
        console.error('[AddPageModal] Error parsing screenshot response:', e);
      }

      if (!res.ok) {
        setError(responseData?.error || 'Screenshot upload failed.');
        setTimeout(() => navigate('/dashboard'), 3000);
      }
      else {
        // now that screenshot is done, proceed
        if (selectedUbaFile) {
          await uploadUbaFile(pageId);
        } else {
          // Show progress loader and close modal after successful upload
          setShowProgressLoader(true);
          onPageAdded({ id: pageId, type: selectedType, url: pageURL });
          handleClose();
        }
      }
    } catch (err) {
      console.error('[AddPageModal] Screenshot upload error:', err);
      setError('Screenshot upload network error.');
      setTimeout(() => navigate('/dashboard'), 3000);
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!selectedType || !pageURL) {
        throw new Error('Please fill in all required fields');
      }

      console.log('[AddPageModal] Starting page creation with:', {
        type: selectedType,
        url: pageURL,
        ubaFileName: selectedUbaFile?.name
      });

      // First create the page
      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Build API URL and log it
      const apiUrl = buildApiUrl(API_ENDPOINTS.ONBOARD.PAGE);
      console.log('[AddPageModal] Making request to:', apiUrl);
      
      const requestBody = {
        token: token,
        page_type: selectedType,
        url: pageURL
      };
      console.log('[AddPageModal] Request body:', requestBody);
      
      try {
        // Using the correct API endpoint with better error handling
        const pageResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        });

        // Log the response details for debugging
        console.log('[AddPageModal] Response status:', pageResponse.status);
        
        let data;
        try {
          const textResponse = await pageResponse.text();
          console.log('[AddPageModal] Raw response:', textResponse);
          
          try {
            data = JSON.parse(textResponse);
            console.log('[AddPageModal] Parsed response:', data);
          } catch (parseError) {
            console.error('[AddPageModal] Error parsing JSON response:', parseError);
            throw new Error('Server returned invalid data');
          }
        } catch (textError) {
          console.error('[AddPageModal] Error reading response text:', textError);
          throw new Error('Could not read server response');
        }

        if (!pageResponse.ok) {
          if (pageResponse.status === 401) {
            throw new Error('Session expired. Please log in again.');
          } else {
            throw new Error(`Failed to add page: ${data.error || pageResponse.statusText}`);
          }
        }

        // Check URL validity
        if (data.url === null) {
          throw new Error('Invalid URL provided. Please check your URL and try again.');
        }

        // Check if page ID is present
        if (!data.id && data.id !== 0) {
          throw new Error('Server error: Missing page ID.');
        }

        // Set page ID for further processing
        setPageId(data.id);

        // Check if screenshot is needed
        if (!data.screenshot_path) {
          setShowScreenshotModal(true);
          setLoading(false);
          return;
        }

        // If we have a UBA file, upload it
        if (selectedUbaFile && data.id) {
          console.log('[AddPageModal] Uploading UBA file');
          const formData = new FormData();
          formData.append('token', token);
          formData.append('file', selectedUbaFile);
          formData.append('page_id', String(data.id));
          formData.append('name', selectedType);

          const ubaResponse = await fetch(buildApiUrl(API_ENDPOINTS.UPLOAD.CREATE), {
            method: 'POST',
            credentials: 'include',
            body: formData
          });

          // Log UBA upload response
          console.log('[AddPageModal] UBA upload status:', ubaResponse.status);
          
          // Even if UBA upload fails, we still want to add the page
          if (!ubaResponse.ok) {
            console.error('[AddPageModal] UBA upload failed:', await ubaResponse.text());
            console.log('[AddPageModal] Continuing despite UBA upload failure');
          } else {
            console.log('[AddPageModal] UBA file uploaded successfully');
          }
        }
        
        // Only show progress loader after screenshot validation and UBA upload
        setShowProgressLoader(true);
        onPageAdded(data);
      } catch (fetchError) {
        console.error('[AddPageModal] Fetch error details:', fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      }
    } catch (err) {
      console.error('[AddPageModal] Error in handleSubmit:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleProgressComplete = () => {
    setShowProgressLoader(false);
    onClose();
  };

  return (
    <>
      {showProgressLoader && <ProgressLoader onComplete={handleProgressComplete} />}
      
      <CSSTransition in={visible} timeout={300} classNames="modal" unmountOnExit>
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Page</h2>
              <button className="close-button" onClick={handleClose}>&times;</button>
            </div>

            {showScreenshotModal ? (
              <form className="modal-form" onSubmit={handleScreenshotUpload}>
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setSelectedScreenshot(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="cancel-button" onClick={handleClose}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={uploadingScreenshot}
                  >
                    {uploadingScreenshot ? 'Uploading…' : 'Upload Screenshot'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePageOnboard}>
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <select
                    className="form-select"
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select page type
                    </option>
                    {PAGE_TYPES.filter(type => {
                      // Only filter out if it exists in current pages
                      return !existingPageTypes.includes(type);
                    }).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <input
                    type="url"
                    className="form-input"
                    placeholder=" "
                    value={pageURL}
                    onChange={e => setPageURL(e.target.value)}
                    required
                  />
                  <label className="floating-label">Page URL</label>
                </div>

                <div className="form-group uba-upload-section">
                  <div className="uba-upload-header">
                    <h4>UBA Data</h4><p>Upload CSV</p>
                  </div>
                  {selectedUbaFile ? (
                    <div className="uba-file-selected">
                      <div className="uba-file-info">
                        <span className="uba-filename">{selectedUbaFile.name}</span>
                      </div>
                      <button
                        type="button"
                        className="uba-remove-btn"
                        onClick={() => setSelectedUbaFile(null)}
                        disabled={loading}
                      >&times;</button>
                    </div>
                  ) : (
                    <label className="uba-upload-area">
                      <input
                        type="file"
                        className="uba-file-input"
                        accept=".csv"
                        onChange={handleUbaFileChange}
                        disabled={loading}
                        required
                      />
                      <div className="uba-upload-content">
                        <strong>Upload CSV file</strong>
                      </div>
                    </label>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={handleClose}
                    disabled={loading}
                  >Cancel</button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={loading || !selectedType || !pageURL}
                  >
                    {loading ? 'Processing...' : 'Continue'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </CSSTransition>
    </>
  );
}
