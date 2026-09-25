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
      setError('Please provide an official resolution summary of at least 5 characters.');
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
              width: 32,
              height: 32,
              borderRadius: 4,
              backgroundColor: 'var(--paper)',
              color: 'var(--sage)',
              border: '1px solid var(--hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={17} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.15rem' }}>Resolve Ticket Record</h2>
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
              Provide a clear description of the administrative actions taken to solve the student's request. This official summary will be permanently archived in the registrar ledger.
            </p>

            <div className="form-group">
              <label className="form-label">
                Official Resolution Statement <span style={{ color: 'var(--oxblood)' }}>*</span>
              </label>
              <textarea
                className="form-control"
                placeholder="Example: Corrected attendance shortage records in the examination portal after verifying medical officer approval..."
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
              <span className="meta-small" style={{ fontSize: '0.7rem', marginTop: 4, display: 'block' }}>
                Minimum 5 characters required for administrative archival.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={submitting || summary.trim().length < 5}>
              {submitting ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
