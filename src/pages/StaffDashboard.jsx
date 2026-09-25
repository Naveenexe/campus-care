import React, { useState, useEffect } from 'react';
import { Ticket, Clock, AlertTriangle, AlertCircle, CheckCircle, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';
import SplitFlapCounter from '../components/SplitFlapCounter';

export default function StaffDashboard({ user, onSelectTicket, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStaffDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getStaffDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load staff dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
        <Clock size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--brass)' }} />
        <p className="data-mono">Accessing staff queue ledger...</p>
      </div>
    );
  }

  const { kpis, my_active_tickets = [], overdue_tickets = [], approaching_tickets = [], unassigned_tickets = [] } = data || {};

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Caseload & Queue</h1>
          <p className="page-subtitle">
            Welcome back, {user?.full_name}. Active department queue, awaiting responses, and SLA triage.
          </p>
        </div>
        <button
          onClick={() => onNavigate('tickets')}
          className="btn btn-primary"
        >
          <Ticket size={16} />
          View Full Registry
        </button>
      </div>

      {/* Staff KPI Grid with Split-Flap departure board counters */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Active Workload</span>
            <div className="kpi-icon-box">
              <Ticket size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.active_pending ?? 0} />
          <div className="kpi-subtitle">Inquiries pending your action</div>
        </div>

        <div className="kpi-card" style={{
          borderLeft: (kpis?.overdue || 0) > 0 ? '3px solid var(--oxblood)' : '1px solid var(--hairline)'
        }}>
          <div className="kpi-card-header">
            <span className="kpi-title" style={{ color: (kpis?.overdue || 0) > 0 ? 'var(--oxblood)' : 'var(--ink-soft)' }}>
              Overdue Inquiries
            </span>
            <div className="kpi-icon-box" style={{
              color: (kpis?.overdue || 0) > 0 ? 'var(--oxblood)' : 'var(--ink-soft)'
            }}>
              <AlertTriangle size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.overdue ?? 0} />
          <div className="kpi-subtitle" style={{ color: (kpis?.overdue || 0) > 0 ? 'var(--oxblood)' : 'var(--ink-soft)' }}>
            Requires immediate resolution
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Approaching SLA</span>
            <div className="kpi-icon-box">
              <Clock size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.approaching_sla ?? 0} />
          <div className="kpi-subtitle">Due within upcoming hours</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Unassigned In Dept</span>
            <div className="kpi-icon-box">
              <UserCheck size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.unassigned_in_department ?? 0} />
          <div className="kpi-subtitle">Awaiting staff claim / pickup</div>
        </div>
      </div>

      {/* Two Column: Overdue Urgencies & Approaching Deadlines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Overdue */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} color="var(--oxblood)" />
              <h2 className="card-title">Priority Breaches (Overdue)</h2>
            </div>
            <span className="stamp-badge stamp-urgent">{overdue_tickets.length} OVERDUE</span>
          </div>

          {overdue_tickets.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--sage)', fontSize: '0.875rem' }}>
              <CheckCircle size={24} style={{ margin: '0 auto 8px', color: 'var(--sage)' }} />
              Zero overdue inquiries in your queue. All current tickets are on schedule.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {overdue_tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid var(--hairline)',
                    borderLeft: '4px solid var(--oxblood)',
                    borderRadius: 'var(--radius-card)',
                    background: 'var(--paper-raised)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-offset-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="data-mono" style={{ fontWeight: 600, color: 'var(--oxblood)' }}>
                        {t.ticket_number}
                      </span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>
                      {t.subject}
                    </div>
                    <div className="meta-small" style={{ marginTop: 2 }}>
                      Student: {t.requester_name} • Due: {t.resolution_due_at ? new Date(t.resolution_due_at).toLocaleDateString() : 'Immediate'}
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--oxblood)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approaching SLA */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="var(--brass)" />
              <h2 className="card-title">Approaching SLA Target</h2>
            </div>
            <span className="stamp-badge stamp-high">{approaching_tickets.length} PENDING</span>
          </div>

          {approaching_tickets.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-soft)', fontSize: '0.875rem' }}>
              No inquiries are nearing imminent SLA breach deadlines.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {approaching_tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid var(--hairline)',
                    borderLeft: '4px solid var(--brass)',
                    borderRadius: 'var(--radius-card)',
                    background: 'var(--paper-raised)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-offset-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="data-mono" style={{ fontWeight: 600, color: 'var(--forest)' }}>
                        {t.ticket_number}
                      </span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>
                      {t.subject}
                    </div>
                    <div className="meta-small" style={{ marginTop: 2 }}>
                      Requester: {t.requester_name}
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--brass)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unassigned Department Queue */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Department Queue Awaiting Assignment</h2>
            <p className="meta-small" style={{ marginTop: 2 }}>
              New tickets routed to your department requiring triage or personal assignment
            </p>
          </div>
          <span className="stamp-badge stamp-medium">{unassigned_tickets.length} QUEUED</span>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject & Category</th>
                <th>Requester</th>
                <th>Priority</th>
                <th>Logged Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unassigned_tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 36, color: 'var(--ink-soft)' }}>
                    This queue is empty. New requests will appear here as students submit them.
                  </td>
                </tr>
              ) : (
                unassigned_tickets.map(t => (
                  <tr key={t.id} onClick={() => onSelectTicket(t.id)} style={{ cursor: 'pointer' }}>
                    <td className="data-mono" style={{ fontWeight: 600, color: 'var(--forest)' }}>
                      {t.ticket_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{t.subject}</div>
                      <div className="meta-small">{t.category_name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.requester_name}</div>
                      <div className="data-mono" style={{ fontSize: '0.725rem', color: 'var(--ink-soft)' }}>{t.requester_identifier || t.requester_email}</div>
                    </td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td className="data-mono" style={{ fontSize: '0.775rem', color: 'var(--ink-soft)' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); onSelectTicket(t.id); }}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
