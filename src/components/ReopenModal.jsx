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
      setError('Please provide a reason of at least 5 characters for reopening the ticket.');
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
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Reopen Ticket</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{ticket.ticket_number}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 16 }}>
              If your request was not completely addressed, state what remains unresolved so staff can assist you further.
            </p>

            <div className="form-group">
              <label className="form-label">
                Reason for Reopening <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="form-control"
                placeholder="Example: The updated marksheet still does not reflect the change in subject CS302..."
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
              {submitting ? 'Reopening...' : 'Reopen Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
