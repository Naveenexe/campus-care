import React, { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { api } from '../api';

export default function ReopenModal({ ticket, isOpen, onClose, onReopened }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide an explanation of at least 5 characters for reopening the ticket.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.reopenTicket(ticket.id, reason.trim());
      onReopened();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              backgroundColor: 'var(--paper)',
              color: 'var(--brass)',
              border: '1px solid var(--hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={17} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.15rem' }}>Reopen Inquiry Case</h2>
              <p className="data-mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', margin: 0 }}>
                {ticket.ticket_number}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: 16 }}>
              If your request was not adequately resolved, state what remains outstanding so the registrar desk can reassign or review your file.
            </p>

            <div className="form-group">
              <label className="form-label">
                Reason for Reopening Inquiry <span style={{ color: 'var(--oxblood)' }}>*</span>
              </label>
              <textarea
                className="form-control"
                placeholder="Example: The updated transcript still does not reflect the grade correction for course CS302..."
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || reason.trim().length < 5}>
              {submitting ? 'Reopening Case...' : 'Submit Reopen Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
