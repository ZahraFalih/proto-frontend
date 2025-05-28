import React from 'react';
import '../styles/TermsModal.css';

const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div className="terms-modal-content" onClick={e => e.stopPropagation()}>
        <button className="terms-modal-close" onClick={onClose}>×</button>
        <h2 className="terms-modal-title">Terms and Conditions</h2>
        
        <div className="terms-modal-body">
          <div className="terms-poem">
            <p>In digital realms where data flows,</p>
            <p>Your privacy's guarded, this you should know.</p>
            <p>We store your data with utmost care,</p>
            <p>Encrypted and safe, beyond compare.</p>
            <br />
            <p>Your feedback shapes our service true,</p>
            <p>Helping us build something great for you.</p>
            <p>We'll send updates, but you can choose,</p>
            <p>Which notifications you want to peruse.</p>
            <br />
            <p>Use our platform with good intent,</p>
            <p>Respect others in each comment sent.</p>
            <p>Share knowledge freely, learn and grow,</p>
            <p>In this community we build and know.</p>
            <br />
            <p>By checking that box, you agree indeed,</p>
            <p>To follow these guidelines as you proceed.</p>
            <p>Together we'll make this space so bright,</p>
            <p>A place where users shine with insight.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal; 