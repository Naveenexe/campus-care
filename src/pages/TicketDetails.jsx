import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Lock,
  Send,
  Calendar,
  AlertTriangle,
  History,
  FileText,
  User,
  Shield,
  ChevronDown
} from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';
import AssignModal from '../components/AssignModal';
import ResolveModal from '../components/ResolveModal';
import ReopenModal from '../components/ReopenModal';

export default function TicketDetails({ ticketId, user, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [commentVisibility, setCommentVisibility] = useState('public');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Modals
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);

  // Tab filter for comments (All vs Internal Notes)
  const [commentFilter, setCommentFilter] = useState('all');

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const data = await api.getTicket(ticketId);
      setTicket(data.ticket);
      setComments(data.comments || []);
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) fetchTicket();
  }, [ticketId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await api.addComment(ticketId, commentText.trim(), commentVisibility);
      setCommentText('');
      fetchTicket();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'resolved') {
      setIsResolveOpen(true);
      return;
    }

    try {
      await api.updateStatus(ticketId, newStatus);
      fetchTicket();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await api.updatePriority(ticketId, newPriority);
      fetchTicket();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
        <Clock size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading ticket workspace...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div className="alert alert-danger" style={{ maxWidth: 400, margin: '0 auto 20px' }}>
          {error || 'Ticket not found or access denied'}
        </div>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Return to Ticket List
        </button>
      </div>
    );
  }

  const isStaffOrAdmin = ['admin', 'staff'].includes(user?.role);
  const canReopen = (ticket.status === 'resolved' || ticket.status === 'closed') && (user?.role === 'student' || user?.role === 'admin');

  // Filter comments
  const visibleComments = comments.filter(c => {
    if (commentFilter === 'internal') return c.visibility === 'internal';
    return true;
  });

  return (
    <div>
      {/* Top Navigation & Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack} title="Go back">
            <ArrowLeft size={16} />
            Back
          </button>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            {ticket.ticket_number}
          </span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <SlaBadge slaStatus={ticket.sla_status} />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isStaffOrAdmin && (
            <>
              {/* Status Transition Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Status:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_student">Waiting for Student</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Priority Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Priority:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Assign Button */}
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAssignOpen(true)}>
                <UserCheck size={14} />
                {ticket.assignee_name ? 'Reassign' : 'Assign Staff'}
              </button>

              {/* Resolve Button */}
              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <button className="btn btn-success btn-sm" onClick={() => setIsResolveOpen(true)}>
                  <CheckCircle2 size={14} />
                  Resolve
                </button>
              )}
            </>
          )}

          {/* Student Reopen Button */}
          {canReopen && (
            <button className="btn btn-secondary btn-sm" onClick={() => setIsReopenOpen(true)}>
              <RefreshCw size={14} />
              Reopen Ticket
            </button>
          )}
        </div>
      </div>

      {/* SLA Alert Banner (FR-031 to FR-034) */}
      <div style={{
        background: ticket.is_overdue ? '#fef2f2' : ticket.is_approaching ? '#fffbeb' : '#f0fdf4',
        border: `1px solid ${ticket.is_overdue ? '#fecaca' : ticket.is_approaching ? '#fde68a' : '#bbf7d0'}`,
        borderRadius: 12,
        padding: '14px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {ticket.is_overdue ? (
            <AlertTriangle size={20} color="#dc2626" />
          ) : (
            <Clock size={20} color={ticket.is_approaching ? '#d97706' : '#16a34a'} />
          )}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: ticket.is_overdue ? '#991b1b' : ticket.is_approaching ? '#92400e' : '#166534' }}>
              SLA Policy Status: {ticket.sla_status}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              First Response Target: {ticket.first_response_due_at ? new Date(ticket.first_response_due_at).toLocaleString() : 'N/A'}{' '}
              {ticket.first_responded_at ? ' (Responded)' : ' (Pending)'} •
              Resolution Target: {ticket.resolution_due_at ? new Date(ticket.resolution_due_at).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          padding: '6px 14px',
          borderRadius: 8,
          fontSize: '0.825rem',
          fontWeight: 600,
          color: '#334155'
        }}>
          Next Action Expected From: <strong style={{ color: '#2563eb', textTransform: 'capitalize' }}>{ticket.next_action_owner || 'Staff'}</strong>
        </div>
      </div>

      {/* Main Grid: Details + Thread on Left, Meta Cards on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(280px, 1fr)', gap: 24 }}>
        {/* Left Column: Subject, Description, Resolution Summary, and Conversation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Inquiry Card */}
          <div className="card">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: 12, lineHeight: 1.3 }}>
              {ticket.subject}
            </h2>
            <div style={{
              fontSize: '0.95rem',
              color: '#334155',
              lineHeight: 1.6,
              background: '#f8fafc',
              padding: 16,
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              whiteSpace: 'pre-wrap'
            }}>
              {ticket.description}
            </div>

            {/* Resolution Summary Card if resolved */}
            {ticket.resolution_summary && (
              <div style={{
                marginTop: 20,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 10,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>
                  <CheckCircle2 size={16} />
                  Official Resolution Summary
                </div>
                <p style={{ fontSize: '0.9rem', color: '#065f46', lineHeight: 1.5 }}>
                  {ticket.resolution_summary}
                </p>
                {ticket.resolved_at && (
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 8 }}>
                    Resolved on {new Date(ticket.resolved_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Conversation Thread (Public vs Internal Notes) */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={18} color="#2563eb" />
                <h3 className="card-title">Communication Thread</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({comments.length} entries)</span>
              </div>

              {/* Internal Notes Filter for Staff */}
              {isStaffOrAdmin && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={`btn btn-sm ${commentFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCommentFilter('all')}
                  >
                    All Messages
                  </button>
                  <button
                    className={`btn btn-sm ${commentFilter === 'internal' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCommentFilter('internal')}
                  >
                    <Lock size={12} />
                    Internal Notes Only
                  </button>
                </div>
              )}
            </div>

            {/* Comment List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {visibleComments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: '0.875rem' }}>
                  No replies posted in this section yet.
                </div>
              ) : (
                visibleComments.map(c => {
                  const isInternal = c.visibility === 'internal';
                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: isInternal ? '#fffbeb' : '#f8fafc',
                        border: `1px solid ${isInternal ? '#fde68a' : '#e2e8f0'}`,
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                            {c.author_name}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: c.author_role === 'student' ? '#eff6ff' : '#f5f3ff',
                            color: c.author_role === 'student' ? '#1d4ed8' : '#6d28d9'
                          }}>
                            {c.author_role.toUpperCase()}
                          </span>
                          {isInternal && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#b45309',
                              background: '#fef3c7',
                              padding: '2px 8px',
                              borderRadius: 12
                            }}>
                              <Lock size={11} /> Internal Note
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {c.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Submission Form */}
            <form onSubmit={handlePostComment}>
              <div className="form-group">
                <label className="form-label">
                  {isStaffOrAdmin ? 'Add Staff Reply / Internal Note' : 'Reply to Staff'}
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder={
                    isStaffOrAdmin
                      ? "Write a reply to the student, or record a private internal note for other staff members..."
                      : "Type your message or response to the support staff..."
                  }
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                {isStaffOrAdmin ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer', color: '#334155' }}>
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={commentVisibility === 'public'}
                        onChange={() => setCommentVisibility('public')}
                      />
                      Public Reply (Student can see)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer', color: '#b45309', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="visibility"
                        value="internal"
                        checked={commentVisibility === 'internal'}
                        onChange={() => setCommentVisibility('internal')}
                      />
                      <Lock size={13} />
                      Internal Staff Note
                    </label>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Your reply will automatically notify the assigned support staff.
                  </span>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingComment || !commentText.trim()}
                >
                  <Send size={15} />
                  {submittingComment ? 'Sending...' : 'Post Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Metadata & Activity History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Ticket Metadata Card */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: 14 }}>
              Request Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  Student Requester
                </span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{ticket.requester_name}</span>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  {ticket.requester_identifier ? `ID: ${ticket.requester_identifier} • ` : ''}{ticket.requester_email}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  Assigned Staff
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: ticket.assignee_name ? '#0f172a' : '#94a3b8' }}>
                    {ticket.assignee_name || 'Unassigned'}
                  </span>
                  {isStaffOrAdmin && (
                    <button
                      onClick={() => setIsAssignOpen(true)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  Category & Department
                </span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{ticket.category_name}</span>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{ticket.department_name || 'General'}</div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  Creation Timestamp
                </span>
                <span style={{ color: '#334155' }}>{new Date(ticket.created_at).toLocaleString()}</span>
              </div>

              {ticket.reopen_count > 0 && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                  <span style={{ color: '#b45309', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Reopen Count
                  </span>
                  <span style={{ fontWeight: 700, color: '#b45309' }}>{ticket.reopen_count} time(s)</span>
                </div>
              )}
            </div>
          </div>

          {/* Audit History Timeline (FR-010, FR-056) */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={16} color="#64748b" />
                <h3 className="card-title" style={{ fontSize: '1rem' }}>Activity History</h3>
              </div>
            </div>

            <div className="timeline">
              {history.map(item => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.825rem' }}>
                      {item.description}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: 2 }}>
                      By {item.actor_name || 'System'} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssignModal
        ticket={ticket}
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onAssigned={fetchTicket}
      />

      <ResolveModal
        ticket={ticket}
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        onResolved={fetchTicket}
      />

      <ReopenModal
        ticket={ticket}
        isOpen={isReopenOpen}
        onClose={() => setIsReopenOpen(false)}
        onReopened={fetchTicket}
      />
    </div>
  );
}
