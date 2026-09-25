import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function CreateTicket({ onTicketCreated, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successTicket, setSuccessTicket] = useState(null);

  useEffect(() => {
    api.getCategories()
      .then(res => {
        const activeCats = (res.categories || []).filter(c => c.is_active !== 0);
        setCategories(activeCats);
        if (activeCats.length > 0) {
          setCategoryId(String(activeCats[0].id));
        }
      })
      .catch(err => setError('Failed to load categories: ' + err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!categoryId) {
      setError('Please select an administrative category from the registry');
      return;
    }

    if (subject.trim().length < 5) {
      setError('Subject must be at least 5 characters');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createTicket({
        category_id: parseInt(categoryId, 10),
        subject: subject.trim(),
        description: description.trim(),
        priority,
        attachment_url: attachmentUrl.trim() || undefined,
      });

      setSuccessTicket(res.ticket);
    } catch (err) {
      setError(err.message || 'Failed to submit ticket to registry');
      setLoading(false);
    }
  };

  if (successTicket) {
    return (
      <div className="card" style={{ maxWidth: 540, margin: '40px auto', textAlign: 'center', padding: 36 }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '2px solid var(--sage)',
          backgroundColor: 'rgba(92, 122, 82, 0.12)',
          color: 'var(--sage)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <CheckCircle2 size={28} />
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>
          Ticket Successfully Logged in Registry
        </h1>
        <div className="data-mono" style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'var(--forest)',
          background: 'var(--paper)',
          padding: '8px 18px',
          border: '1px solid var(--hairline)',
          borderRadius: 2,
          display: 'inline-block',
          marginBottom: 16
        }}>
          {successTicket.ticket_number}
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: 24 }}>
          Your request has been officially cataloged and dispatched to the designated department queue with an active SLA tracking schedule.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => onTicketCreated(null)}>
            View Ticket Registry
          </button>
          <button className="btn btn-primary" onClick={() => onTicketCreated(successTicket.id)}>
            Inspect Case File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Support Request</h1>
          <p className="page-subtitle">
            Provide details of your inquiry. Relevant institutional department staff will be officially notified.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          <ArrowLeft size={15} /> Cancel
        </button>
      </div>

      <div className="card">
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Category Selection */}
          <div className="form-group">
            <label className="form-label">
              Inquiry Department Category <span style={{ color: 'var(--oxblood)' }}>*</span>
            </label>
            <select
              className="form-control"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.department_name ? `(${c.department_name})` : ''}
                </option>
              ))}
            </select>
            <div className="meta-small" style={{ marginTop: 4 }}>
              Routes directly to the appropriate records office staff desk
            </div>
          </div>

          {/* Priority Selection */}
          <div className="form-group">
            <label className="form-label">Urgency Level</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { id: 'low', label: 'Low', desc: 'Standard query' },
                { id: 'medium', label: 'Medium', desc: 'Routine inquiry' },
                { id: 'high', label: 'High', desc: 'Time-sensitive' },
                { id: 'urgent', label: 'Urgent', desc: 'Immediate academic blocker' }
              ].map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: priority === p.id ? 'var(--paper)' : 'var(--paper-raised)',
                    border: priority === p.id ? '2px solid var(--brass)' : '1px solid var(--hairline)',
                    boxShadow: priority === p.id ? 'var(--shadow-offset-sm)' : 'none',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: priority === p.id ? 'var(--brass)' : 'var(--ink)'
                  }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', marginTop: 2 }}>
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject Field */}
          <div className="form-group">
            <label className="form-label">
              Request Subject <span style={{ color: 'var(--oxblood)' }}>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Fee Receipt Verification for Semester 4"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Detailed Description */}
          <div className="form-group">
            <label className="form-label">
              Detailed Statement of Inquiry <span style={{ color: 'var(--oxblood)' }}>*</span>
            </label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Detail your request, mentioning specific course codes, dates, reference numbers, or prior communications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Optional Attachment URL */}
          <div className="form-group">
            <label className="form-label">Supporting Document URL (Optional)</label>
            <input
              type="url"
              className="form-control"
              placeholder="https://drive.institution.edu/file/your-receipt.pdf"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
            <div className="meta-small" style={{ marginTop: 4 }}>
              Provide a link to fee slips, medical certificates, or scanned forms
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting to Registry...' : 'Lodge Support Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
