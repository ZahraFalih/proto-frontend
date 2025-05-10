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
    const token = getToken();
    const payload = { page_type: selectedType, url: pageURL, token };

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.ONBOARD.PAGE_ONBOARD), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { error: 'Invalid server response' }; }

      if (!res.ok) {
        if (res.status === 401) { setError('Session expired.'); navigate('/login'); }
        else { setError(data.error || `Error ${res.status}`); }
      }
      else if (data.url == null) {
        setError('Invalid URL provided.');
      }
      else if (data.id != null) {
        setPageId(data.id);

        // screenshot missing? show that step
        if (!data.screenshot_path) {
          setShowScreenshotModal(true);
        }
        // already has screenshot, move to UBA or finish
        else if (selectedUbaFile) {
          await uploadUbaFile(data.id);
        } else {
          onPageAdded(data);
          handleClose();
          navigate('/dashboard');
        }
      } else {
        setError('Server error: Missing page ID.');
      }
    } catch {
      setError('Network error.');
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
    const formData = new FormData();
    const token = getToken();
    formData.append('token', token);
    formData.append('file', selectedUbaFile);
    formData.append('page_id', String(id));
    formData.append('name', selectedType);

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.UPLOAD.CREATE), {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      // Whether UBA upload succeeds or fails, we still want to add the page
      setShowProgressLoader(true);
      onPageAdded({ id, type: selectedType, url: pageURL });
      handleClose();

      if (!res.ok) {
        console.error('UBA upload failed, but page was added');
      }
    } catch (err) {
      console.error('UBA upload error, but page was added:', err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: upload screenshot, then chain to UBA if needed
  const handleScreenshotUpload = async e => {
    e.preventDefault();
    setError(null);
    if (!selectedScreenshot || pageId == null) {
      setError('Screenshot or page ID missing.');
      return;
    }
    setUploadingScreenshot(true);
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

      if (!res.ok) {
        setError('Screenshot upload failed.');
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
    } catch {
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

      console.log('[AddPageModal] Making request to page-onboard endpoint');
      
      const pageResponse = await fetch(buildApiUrl(API_ENDPOINTS.ONBOARD.PAGE_ONBOARD), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: token,
          page_type: selectedType,
          url: pageURL
        })
      });

      if (!pageResponse.ok) {
        const errorText = await pageResponse.text();
        console.error('[AddPageModal] Error response:', {
          status: pageResponse.status,
          statusText: pageResponse.statusText,
          body: errorText
        });
        throw new Error(`Failed to add page: ${pageResponse.status} - ${errorText || pageResponse.statusText}`);
      }

      const newPage = await pageResponse.json();
      console.log('[AddPageModal] Successfully created page:', newPage);

      // Check if screenshot is needed
      if (!newPage.screenshot_path) {
        setPageId(newPage.id);
        setShowScreenshotModal(true);
        setLoading(false);
        return;
      }

      // If we have a UBA file, upload it
      if (selectedUbaFile && newPage.id) {
        console.log('[AddPageModal] Uploading UBA file');
        const formData = new FormData();
        formData.append('token', token);
        formData.append('file', selectedUbaFile);
        formData.append('page_id', String(newPage.id));
        formData.append('name', selectedType);

        const ubaResponse = await fetch(buildApiUrl(API_ENDPOINTS.UPLOAD.CREATE), {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!ubaResponse.ok) {
          console.error('[AddPageModal] UBA upload failed:', await ubaResponse.text());
          throw new Error('Failed to upload UBA file');
        }

        console.log('[AddPageModal] Successfully uploaded UBA file');
      }
      
      // Only show progress loader after screenshot validation and UBA upload
      setShowProgressLoader(true);
      onPageAdded(newPage);
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
              <form onSubmit={handleSubmit}>
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
