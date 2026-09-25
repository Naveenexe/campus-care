import React, { useState, useEffect } from 'react';
import { UserCheck, Sparkles, X } from 'lucide-react';
import { api } from '../api';

export default function AssignModal({ ticket, isOpen, onClose, onAssigned }) {
  const [staffList, setStaffList] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && ticket) {
      setError('');
      setLoading(true);
      Promise.all([
        api.getStaff(),
        api.getStaffRecommendation(ticket.category_id)
      ])
        .then(([staffRes, recRes]) => {
          const list = staffRes.staff || [];
          setStaffList(list);
          const rec = recRes.recommendation;
          setRecommended(rec);
          if (rec) {
            setSelectedStaffId(String(rec.id));
          } else if (ticket.assigned_to_id) {
            setSelectedStaffId(String(ticket.assigned_to_id));
          } else if (list.length > 0) {
            setSelectedStaffId(String(list[0].id));
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, ticket]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    setSubmitting(true);
    setError('');
    try {
      await api.assignTicket(ticket.id, parseInt(selectedStaffId, 10));
      onAssigned();
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
              color: 'var(--forest)',
              border: '1px solid var(--hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserCheck size={17} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.15rem' }}>Assign Staff Officer</h2>
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

            {recommended && (
              <div style={{
                background: 'rgba(92, 122, 82, 0.1)',
                border: '1px solid var(--sage)',
                borderRadius: 2,
                padding: '12px 14px',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="var(--sage)" />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--sage)' }}>
                      Designated Recommendation
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--ink)' }}>
                      {recommended.full_name} ({recommended.department_name || 'General'}) • {recommended.active_workload} active inquiries
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffId(String(recommended.id))}
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: 'var(--sage)', color: 'var(--sage)' }}
                >
                  Apply
                </button>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Select Staff Assignee</label>
              <select
                className="form-control"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Choose Assigned Officer --</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.department_name || 'General Records'}) — {s.active_workload || 0} active tickets
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !selectedStaffId}>
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
