import React, { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { api } from '../api';

export default function ResolveModal({ ticket, isOpen, onClose, onResolved }) {
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary.trim() || summary.trim().length < 5) {
      setError('Please provide a meaningful resolution summary of at least 5 characters.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.updateStatus(ticket.id, 'resolved', summary.trim());
      onResolved();
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
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Resolve Ticket</h3>
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
              Provide a clear description of the actions taken to solve the student's request. This summary will be permanently saved to the ticket history.
            </p>

            <div className="form-group">
              <label className="form-label">
                Resolution Summary <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="form-control"
                placeholder="Example: Corrected attendance shortage records in the examination portal after verifying medical officer approval..."
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4, display: 'block' }}>
                Minimum 5 characters required.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={submitting || summary.trim().length < 5}>
              {submitting ? 'Resolving...' : 'Complete & Resolve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
