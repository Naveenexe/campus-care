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
  AlertTriangle,
  History,
  Check,
} from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';
import AssignModal from '../components/AssignModal';
import ResolveModal from '../components/ResolveModal';
import ReopenModal from '../components/ReopenModal';

const LIFECYCLE_STAGES = [
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'waiting_for_student', label: 'Waiting for Student' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

export default function TicketDetails({ ticketId, user, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [justStatusUpdated, setJustStatusUpdated] = useState(false);

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
      setError(err.message || 'Failed to retrieve ticket record from registry');
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
      setJustStatusUpdated(true);
      setTimeout(() => setJustStatusUpdated(false), 800);
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
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
        <Clock size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--brass)' }} />
        <p className="data-mono">Retrieving ticket dossier from registry...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40, maxWidth: 540, margin: '40px auto' }}>
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          {error || 'This inquiry record does not exist or access has been restricted by the Registrar.'}
        </div>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Return to Ticket Registry
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

  // Calculate lifecycle stepper state
  const stageOrder = {
    open: 0,
    in_progress: 1,
    waiting_for_student: 2,
    resolved: 3,
    closed: 4,
  };
  const currentStageIndex = stageOrder[ticket.status] ?? 0;

  return (
    <div>
      {/* Top Header & Quick Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack} title="Return to registry queue">
            <ArrowLeft size={15} />
            Back
          </button>
          <span className="data-mono" style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)' }}>
            {ticket.ticket_number}
          </span>
          <StatusBadge status={ticket.status} animateSettle={justStatusUpdated} />
          <PriorityBadge priority={ticket.priority} />
          <SlaBadge slaStatus={ticket.sla_status} />
          <div className="ownership-chip">
            Ball's in: <strong>{ticket.next_action_owner || 'Staff'}</strong>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isStaffOrAdmin && (
            <>
              {/* Status Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="meta-small">Status:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '0.825rem' }}
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
                <span className="meta-small">Priority:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '0.825rem' }}
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
                  Resolve Case
                </button>
              )}
            </>
          )}

          {/* Student Reopen Button */}
          {canReopen && (
            <button className="btn btn-secondary btn-sm" onClick={() => setIsReopenOpen(true)}>
              <RefreshCw size={14} />
              Reopen Case
            </button>
          )}
        </div>
      </div>

      {/* Ticket Lifecycle Stepper: Horizontal drawer rail of 5 stages */}
      <div className="ticket-stepper" aria-label="Ticket lifecycle progression">
        {LIFECYCLE_STAGES.map((st, idx) => {
          const isCurrent = idx === currentStageIndex;
          const isCompleted = idx < currentStageIndex;
          const isFuture = idx > currentStageIndex;

          let stageClass = 'future';
          if (isCurrent) stageClass = 'current';
          else if (isCompleted) stageClass = 'completed';

          return (
            <div key={st.key} className={`stepper-stage ${stageClass}`}>
              <span className="stepper-num">{idx + 1}.</span>
              <span>{st.label}</span>
              {isCompleted && <Check size={13} strokeWidth={2.5} style={{ color: 'var(--sage)' }} />}
            </div>
          );
        })}
      </div>

      {/* SLA Alert Strip */}
      <div style={{
        background: ticket.is_overdue
          ? 'rgba(122, 42, 40, 0.08)'
          : ticket.is_approaching
            ? 'rgba(169, 120, 46, 0.1)'
            : 'rgba(92, 122, 82, 0.08)',
        border: `1px solid ${
          ticket.is_overdue
            ? 'var(--oxblood)'
            : ticket.is_approaching
              ? 'var(--brass)'
              : 'var(--sage)'
        }`,
        borderRadius: 2,
        padding: '12px 18px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {ticket.is_overdue ? (
            <AlertTriangle size={18} color="var(--oxblood)" />
          ) : (
            <Clock size={18} color={ticket.is_approaching ? 'var(--brass)' : 'var(--sage)'} />
          )}
          <div>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: ticket.is_overdue ? 'var(--oxblood)' : ticket.is_approaching ? 'var(--brass)' : 'var(--forest)'
            }}>
              SLA Standard: {ticket.sla_status}
            </div>
            <div className="meta-small" style={{ marginTop: 2 }}>
              First Response: {ticket.first_response_due_at ? new Date(ticket.first_response_due_at).toLocaleString() : 'N/A'}{' '}
              {ticket.first_responded_at ? ' (Responded)' : ' (Pending)'} •
              Final Resolution Target: {ticket.resolution_due_at ? new Date(ticket.resolution_due_at).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        <div className="ownership-chip">
          Action expected from: <strong>{ticket.next_action_owner || 'Staff'}</strong>
        </div>
      </div>

      {/* Main Grid: Details + Thread on Left, Meta Cards on Right */}
      <div className="ticket-detail-grid">
        {/* Left Column: Inquiry card and Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Inquiry Card */}
          <div className="card" style={{ position: 'relative' }}>
            {/* Top-Right Priority Ink Stamp on Ticket Card */}
            <PriorityBadge priority={ticket.priority} isCardStamp={true} />

            <div className="data-mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginBottom: 8 }}>
              {ticket.ticket_number} • Category: {ticket.category_name}
            </div>

            <h1 style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--ink)', marginBottom: 12, lineHeight: 1.3 }}>
              {ticket.subject}
            </h1>

            {/* Ticket description: limited to under 80 characters per line */}
            <div className="readable-measure" style={{
              fontSize: '0.95rem',
              color: 'var(--ink)',
              background: 'var(--paper)',
              padding: 16,
              borderRadius: 2,
              border: '1px solid var(--hairline)',
              whiteSpace: 'pre-wrap'
            }}>
              {ticket.description}
            </div>

            {/* Official Resolution Summary if resolved */}
            {ticket.resolution_summary && (
              <div style={{
                marginTop: 20,
                background: 'rgba(92, 122, 82, 0.1)',
                border: '1px solid var(--sage)',
                borderRadius: 2,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--sage)', fontWeight: 700, fontSize: '0.875rem', marginBottom: 6 }}>
                  <CheckCircle2 size={16} />
                  Official Resolution Record
                </div>
                <p className="readable-measure" style={{ fontSize: '0.9rem', color: 'var(--ink)', margin: 0 }}>
                  {ticket.resolution_summary}
                </p>
                {ticket.resolved_at && (
                  <div className="data-mono" style={{ fontSize: '0.725rem', color: 'var(--ink-soft)', marginTop: 8 }}>
                    Closed on {new Date(ticket.resolved_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Conversation Thread */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={17} color="var(--forest)" />
                <h2 className="card-title">Ledger Correspondence Thread</h2>
                <span className="meta-small">({comments.length} entries)</span>
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
                <div style={{ textAlign: 'center', padding: 28, color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                  No official correspondence entered in this ledger thread yet.
                </div>
              ) : (
                visibleComments.map(c => {
                  const isInternal = c.visibility === 'internal';
                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: 16,
                        borderRadius: 2,
                        background: isInternal ? 'rgba(216, 185, 121, 0.15)' : 'var(--paper)',
                        border: `1px solid ${isInternal ? 'var(--brass)' : 'var(--hairline)'}`,
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)' }}>
                            {c.author_name}
                          </span>
                          <span className={`role-tag role-tag-${c.author_role}`}>
                            {c.author_role.toUpperCase()}
                          </span>
                          {isInternal && (
                            <span className="stamp-badge stamp-high" style={{ fontSize: '0.65rem' }}>
                              <Lock size={10} /> INTERNAL NOTE
                            </span>
                          )}
                        </div>
                        <span className="data-mono" style={{ fontSize: '0.725rem', color: 'var(--ink-soft)' }}>
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="readable-measure" style={{ fontSize: '0.9rem', color: 'var(--ink)', margin: 0, whiteSpace: 'pre-wrap' }}>
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
                  {isStaffOrAdmin ? 'Record Staff Reply or Internal Memorandum' : 'Reply to Registrar Staff'}
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder={
                    isStaffOrAdmin
                      ? "Write an official response to the student, or enter a private internal note for other staff members..."
                      : "Type your reply or additional documentation for the registrar staff..."
                  }
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                {isStaffOrAdmin ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.825rem', cursor: 'pointer', color: 'var(--ink)' }}>
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={commentVisibility === 'public'}
                        onChange={() => setCommentVisibility('public')}
                      />
                      Public (Student can read)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.825rem', cursor: 'pointer', color: 'var(--brass)', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="visibility"
                        value="internal"
                        checked={commentVisibility === 'internal'}
                        onChange={() => setCommentVisibility('internal')}
                      />
                      <Lock size={12} />
                      Internal Staff Note
                    </label>
                  </div>
                ) : (
                  <span className="meta-small">
                    Your reply will automatically notify the assigned registrar staff.
                  </span>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingComment || !commentText.trim()}
                >
                  <Send size={14} />
                  {submittingComment ? 'Logging...' : 'Post Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Metadata & Activity History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Ticket Metadata Card */}
          <div className="card">
            <h2 className="card-title" style={{ fontSize: '1rem', marginBottom: 14 }}>
              Inquiry Dossier
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
              <div>
                <span className="meta-small" style={{ textTransform: 'uppercase', display: 'block', fontSize: '0.7rem' }}>
                  Student Requester
                </span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{ticket.requester_name}</span>
                <div className="data-mono" style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }}>
                  {ticket.requester_identifier ? `ID: ${ticket.requester_identifier} • ` : ''}{ticket.requester_email}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 10 }}>
                <span className="meta-small" style={{ textTransform: 'uppercase', display: 'block', fontSize: '0.7rem' }}>
                  Assigned Staff
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: ticket.assignee_name ? 'var(--ink)' : 'var(--ink-soft)' }}>
                    {ticket.assignee_name || 'Unassigned'}
                  </span>
                  {isStaffOrAdmin && (
                    <button
                      onClick={() => setIsAssignOpen(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--forest)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 10 }}>
                <span className="meta-small" style={{ textTransform: 'uppercase', display: 'block', fontSize: '0.7rem' }}>
                  Category & Department
                </span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{ticket.category_name}</span>
                <div className="meta-small">{ticket.department_name || 'General Records'}</div>
              </div>

              <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 10 }}>
                <span className="meta-small" style={{ textTransform: 'uppercase', display: 'block', fontSize: '0.7rem' }}>
                  Creation Timestamp
                </span>
                <span className="data-mono" style={{ color: 'var(--ink)' }}>
                  {new Date(ticket.created_at).toLocaleString()}
                </span>
              </div>

              {ticket.reopen_count > 0 && (
                <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 10 }}>
                  <span className="meta-small" style={{ color: 'var(--brass)', textTransform: 'uppercase', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>
                    Reopened
                  </span>
                  <span className="data-mono" style={{ fontWeight: 700, color: 'var(--brass)' }}>
                    {ticket.reopen_count} time(s)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={16} color="var(--forest)" />
                <h2 className="card-title" style={{ fontSize: '1rem' }}>Ledger Activity Log</h2>
              </div>
            </div>

            <div className="timeline">
              {history.map(item => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.825rem' }}>
                      {item.description}
                    </div>
                    <div className="timeline-time">
                      By {item.actor_name || 'Registrar'} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(item.created_at).toLocaleDateString()}
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
