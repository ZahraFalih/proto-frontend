import React, { useState } from 'react';
import "../../styles/Dashboard.css";

const PAGE_TYPES = [
  'Landing Page',
  'Search Results Page',
  'Product Page'
];

export default function AddPageModal({
  visible,
  onClose,
  onPageAdded,
  onPageDeleted,       // 👈 add this
  pages = [],          // 👈 add this
  existingPageTypes = []
}) {
  if (!visible) return null;

  // Determine which types are still available
  const availableTypes = PAGE_TYPES.filter(
    t => !existingPageTypes.includes(t)
  );
  const [url, setUrl] = useState('');
  const [pageType, setPageType] = useState(availableTypes[0] || '');

  const handleSubmit = async e => {
    e.preventDefault();
    const token = sessionStorage.getItem('access_token');
    const payload = { url, page_type: pageType, token };

    try {
      const res = await fetch(
        'http://127.0.0.1:8000/onboard/page-onboard/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const newPage = await res.json();
      onPageAdded(newPage);
      onClose();
    } catch (err) {
      console.error('Failed to add page:', err);
      // TODO: display error to user
    }
  };
  const handleAdd = async e => {
    e.preventDefault();
    const token = sessionStorage.getItem('access_token');
    const payload = { url, page_type: pageType, token };

    try {
      const res = await fetch(
        'http://127.0.0.1:8000/onboard/page-onboard/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const newPage = await res.json();
      onPageAdded(newPage);
      onClose();
    } catch (err) {
      console.error('Failed to add page:', err);
    }
  };
  const handleDelete = async id => {
    const token = sessionStorage.getItem('access_token');
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/onboard/page-onboard/${id}/`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      onPageDeleted(id);
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box panel-box" onClick={e => e.stopPropagation()}>
        <h2>Manage Pages</h2>

        {/* Existing pages */}
        <ul className="modal-page-list">
          {pages.map(p => (
            <li key={p.id} className="modal-page-item">
              {p.type}
              <button
                type="button"
                className="delete-page-button"
                onClick={() => handleDelete(p.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        {/* Add new page form */}
        {availableTypes.length > 0 ? (
          <form onSubmit={handleAdd} className="modal-add-form">
            <label>
              URL:
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                required
              />
            </label>

            <label>
              Page Type:
              <select
                value={pageType}
                onChange={e => setPageType(e.target.value)}
                required
              >
                {availableTypes.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <div className="modal-actions">
              <button type="submit">Add Page</button>
              <button type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </form>
        ) : (
          <p>All three page types have been added.</p>
        )}
      </div>
    </div>
  );
}