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
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Assign Ticket</h3>
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

            {recommended && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>
                      Recommended Staff Member
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#166534' }}>
                      {recommended.full_name} ({recommended.department_name || 'General'}) • {recommended.active_workload} active tickets
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffId(String(recommended.id))}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #86efac',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#15803d',
                    cursor: 'pointer'
                  }}
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
                <option value="">-- Choose Staff Member --</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.department_name || 'No Dept'}) - {s.active_workload || 0} active tickets
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
