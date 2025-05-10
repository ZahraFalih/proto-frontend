import React, { useState } from 'react';
import '../styles/UserPreferencesModal.css';
import { getToken } from '../utils/auth';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const UserPreferencesModal = ({ isOpen, onClose, pages = [], onPageDeleted, refreshPages }) => {
  const [activeTab, setActiveTab] = useState('data');
  const [deletingPage, setDeletingPage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Form states
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  if (!isOpen) return null;

  const tabs = [
    { id: 'data', label: 'My Data' },
    { id: 'settings', label: 'Settings' }
  ];

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!emailForm.newEmail || !emailForm.currentPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.CHANGE_EMAIL), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_email: emailForm.newEmail,
          current_password: emailForm.currentPassword,
          token: token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change email');
      }

      setFormSuccess('Email updated successfully');
      setEmailForm({ newEmail: '', currentPassword: '' });
      setExpandedSection(null);
    } catch (error) {
      setFormError(error.message || 'An error occurred');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFormError('New passwords do not match');
      return;
    }

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.CHANGE_PASSWORD), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_password: passwordForm.oldPassword,
          new_password: passwordForm.newPassword,
          token: token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      setFormSuccess('Password updated successfully');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setExpandedSection(null);
    } catch (error) {
      setFormError(error.message || 'An error occurred');
    }
  };

  const handleDelete = async (pageId, pageType) => {
    if (pages.length <= 1) {
      alert("You must keep at least one page.");
      return;
    }

    const token = getToken();
    console.log('Attempting to delete page:', { pageId, pageType });
    console.log('Using token:', token);
    
    try {
      const url = buildApiUrl(API_ENDPOINTS.ONBOARD.DELETE_PAGE(pageId, pageType));
      console.log('Delete request URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete failed. Server response:', errorText);
        throw new Error(`Failed to delete page. Status: ${response.status}`);
      }

      console.log('Delete successful for page:', pageId);
      onPageDeleted?.(pageId);
      setDeletingPage(null);
      setConfirmDelete(null);
      refreshPages?.();
    } catch (error) {
      console.error('Error in delete operation:', error);
      setDeletingPage(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="preferences-modal" onClick={e => e.stopPropagation()}>
        <div className="preferences-modal-header">
          <div className="tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="preferences-modal-content">
          {activeTab === 'data' && (
            <div className="tab-content">
              <div className="pages-list">
                {pages.length > 0 ? (
                  pages.map(page => (
                    <div key={page.id} className="page-item">
                      <div className="page-header">
                        <span className="page-type">{page.type}</span>
                        <button 
                          className={`delete-button ${deletingPage === page.id ? 'deleting' : ''}`}
                          onClick={() => setConfirmDelete(page)}
                          disabled={deletingPage === page.id || pages.length <= 1}
                          title={pages.length <= 1 ? "Cannot delete the last page" : "Delete page"}
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="page-file">
                        <div className="file-icon">📄</div>
                        <span className="file-name">{page.type} UBA File</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>No Pages Yet</h3>
                    <p>Your uploaded pages and files will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="tab-content">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">{formSuccess}</div>}
              
              <div className="settings-sections">
                <div className="settings-section">
                  <button 
                    className="section-header"
                    onClick={() => setExpandedSection(expandedSection === 'email' ? null : 'email')}
                  >
                    <span>Change Email</span>
                    <span className="expand-icon">{expandedSection === 'email' ? '−' : '+'}</span>
                  </button>
                  
                  {expandedSection === 'email' && (
                    <form className="settings-form" onSubmit={handleEmailChange}>
                      <div className="form-group">
                        <input
                          type="email"
                          placeholder="New Email"
                          value={emailForm.newEmail}
                          onChange={(e) => setEmailForm({...emailForm, newEmail: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="password"
                          placeholder="Current Password"
                          value={emailForm.currentPassword}
                          onChange={(e) => setEmailForm({...emailForm, currentPassword: e.target.value})}
                        />
                      </div>
                      <button type="submit" className="submit-button">Update Email</button>
                    </form>
                  )}
                </div>

                <div className="settings-section">
                  <button 
                    className="section-header"
                    onClick={() => setExpandedSection(expandedSection === 'password' ? null : 'password')}
                  >
                    <span>Change Password</span>
                    <span className="expand-icon">{expandedSection === 'password' ? '−' : '+'}</span>
                  </button>
                  
                  {expandedSection === 'password' && (
                    <form className="settings-form" onSubmit={handlePasswordChange}>
                      <div className="form-group">
                        <input
                          type="password"
                          placeholder="Current Password"
                          value={passwordForm.oldPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="password"
                          placeholder="New Password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        />
                      </div>
                      <button type="submit" className="submit-button">Update Password</button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {confirmDelete && (
          <div className="confirm-delete-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="confirm-delete-modal" onClick={e => e.stopPropagation()}>
              <h3>Delete Page</h3>
              <p>Are you sure you want to delete the {confirmDelete.type} page?</p>
              <p className="confirm-delete-warning">This action cannot be undone.</p>
              <div className="confirm-delete-actions">
                <button 
                  className="cancel-button" 
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button 
                  className="delete-confirm-button"
                  onClick={() => {
                    setDeletingPage(confirmDelete.id);
                    handleDelete(confirmDelete.id, confirmDelete.type);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPreferencesModal; 