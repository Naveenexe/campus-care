import React, { useState, useEffect } from 'react';
import { PlusCircle, ArrowLeft, Send, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function CreateTicket({ onTicketCreated, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
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
      .catch(err => setError('Failed to load categories: ' + err.message))
      .finally(() => setLoadingCats(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!categoryId) {
      setError('Please select a support category');
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
      setError(err.message || 'Failed to submit ticket');
      setLoading(false);
    }
  };

  if (successTicket) {
    return (
      <div className="card" style={{ maxWidth: 540, margin: '40px auto', textAlign: 'center', padding: 36 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#ecfdf5',
          color: '#059669',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <CheckCircle2 size={32} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
          Ticket Successfully Raised!
        </h2>
        <div style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#2563eb',
          background: '#eff6ff',
          padding: '8px 16px',
          borderRadius: 8,
          display: 'inline-block',
          marginBottom: 16
        }}>
          {successTicket.ticket_number}
        </div>
        <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 24 }}>
          Your request has been routed to the respective college administrative staff. You will receive in-app notifications as updates occur.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => onTicketCreated(null)}>
            View All Tickets
          </button>
          <button className="btn btn-primary" onClick={() => onTicketCreated(successTicket.id)}>
            Open This Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit a Support Request</h1>
          <p className="page-subtitle">
            Provide the details of your inquiry or issue. Relevant department staff will be automatically notified.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          <ArrowLeft size={16} /> Cancel
        </button>
      </div>

      <div className="card">
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Category Selection */}
          <div className="form-group">
            <label className="form-label">
              Inquiry Category <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="form-control"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loadingCats}
              required
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.department_name ? `(${c.department_name})` : ''}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'block' }}>
              Choosing the accurate category routes your ticket to the correct staff team immediately.
            </span>
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Priority Level</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { id: 'low', label: 'Low', desc: 'General queries (72h target)' },
                { id: 'medium', label: 'Medium', desc: 'Standard requests (48h target)' },
                { id: 'high', label: 'High', desc: 'Exam/Loan deadlines (24h target)' },
                { id: 'urgent', label: 'Urgent', desc: 'Exam lockout/Emergency (4h target)' },
              ].map(p => (
                <label
                  key={p.id}
                  style={{
                    border: `1px solid ${priority === p.id ? '#2563eb' : '#e2e8f0'}`,
                    background: priority === p.id ? '#eff6ff' : '#ffffff',
                    borderRadius: 10,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <input
                      type="radio"
                      name="priority"
                      value={p.id}
                      checked={priority === p.id}
                      onChange={() => setPriority(p.id)}
                    />
                    <strong style={{ fontSize: '0.85rem', color: priority === p.id ? '#1e40af' : '#0f172a', textTransform: 'capitalize' }}>
                      {p.label}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="form-group">
            <label className="form-label">
              Subject Summary <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Payment deducted twice for semester 4 tuition fee"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              minLength={5}
              maxLength={150}
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4, display: 'block' }}>
              Keep it concise and descriptive ({subject.length}/150 chars).
            </span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">
              Detailed Description <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              className="form-control"
              rows={6}
              placeholder="Provide all relevant details such as transaction IDs, subject course codes, date of events, or error messages encountered..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minLength={10}
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4, display: 'block' }}>
              Minimum 10 characters ({description.length} entered).
            </span>
          </div>

          {/* Optional Attachment Reference */}
          <div className="form-group">
            <label className="form-label">Reference Link / Document URL (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. https://drive.google.com/file/d/your-receipt-receipt.pdf"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !subject.trim() || !description.trim()}>
              <Send size={16} />
              {loading ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
