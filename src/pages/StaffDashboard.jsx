import React, { useState, useEffect } from 'react';
import { Ticket, Clock, AlertTriangle, AlertCircle, CheckCircle, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';

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
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
        <Clock size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading your assigned workload...</p>
      </div>
    );
  }

  const { kpis, my_active_tickets = [], overdue_tickets = [], approaching_tickets = [], unassigned_tickets = [] } = data || {};

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Support Workspace</h1>
          <p className="page-subtitle">
            Welcome back, {user?.full_name}. Here is your active ticket queue and SLA urgency triage.
          </p>
        </div>
        <button
          onClick={() => onNavigate('tickets')}
          className="btn btn-primary"
        >
          <Ticket size={16} />
          View All Tickets
        </button>
      </div>

      {/* Staff KPI Grid (FR-045) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Active Workload</span>
            <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Ticket size={20} />
            </div>
          </div>
          <div className="kpi-value">{kpis?.active_pending || 0}</div>
          <div className="kpi-subtitle">Tickets currently pending your action</div>
        </div>

        <div className="kpi-card" style={{ borderColor: (kpis?.overdue || 0) > 0 ? '#fca5a5' : '#e2e8f0' }}>
          <div className="kpi-card-header">
            <span className="kpi-title" style={{ color: (kpis?.overdue || 0) > 0 ? '#b91c1c' : '#64748b' }}>
              Overdue Tickets
            </span>
            <div className="kpi-icon-box" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#dc2626' }}>
            {kpis?.overdue || 0}
          </div>
          <div className="kpi-subtitle">Requires immediate resolution</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Approaching SLA</span>
            <div className="kpi-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#d97706' }}>
            {kpis?.approaching_sla || 0}
          </div>
          <div className="kpi-subtitle">Due within upcoming hours</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Unassigned In Dept</span>
            <div className="kpi-icon-box" style={{ background: '#f1f5f9', color: '#475569' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <div className="kpi-value">{kpis?.unassigned_in_department || 0}</div>
          <div className="kpi-subtitle">Awaiting staff pickup</div>
        </div>
      </div>

      {/* Two Column: Overdue Urgencies & Approaching Deadlines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Overdue */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} color="#dc2626" />
              <h3 className="card-title">Priority Breaches (Overdue)</h3>
            </div>
            <span className="badge badge-priority-urgent">{overdue_tickets.length} breached</span>
          </div>

          {overdue_tickets.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#059669', fontSize: '0.875rem' }}>
              <CheckCircle size={24} style={{ margin: '0 auto 8px', color: '#10b981' }} />
              Zero overdue tickets in your queue!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {overdue_tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid #fecaca',
                    borderRadius: 10,
                    background: '#fff5f5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#991b1b' }}>{t.ticket_number}</span>
                      <PriorityBadge priority={t.priority} />
                      <SlaBadge slaStatus={t.sla_status} />
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{t.subject}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                      Student: {t.requester_name} • Category: {t.category_name}
                    </div>
                  </div>
                  <ArrowRight size={16} color="#dc2626" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approaching SLA Deadlines */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#d97706" />
              <h3 className="card-title">Approaching SLA Target</h3>
            </div>
            <span className="badge badge-priority-high">{approaching_tickets.length} near due</span>
          </div>

          {approaching_tickets.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
              No tickets are currently approaching their SLA cut-off.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {approaching_tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid #fde68a',
                    borderRadius: 10,
                    background: '#fffdf5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#92400e' }}>{t.ticket_number}</span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{t.subject}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                      Due soon: {new Date(t.resolution_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <ArrowRight size={16} color="#d97706" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Assigned Tickets Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Active In-Progress Tickets</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Click any row to open ticket workspace</span>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Requester</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA State</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {my_active_tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                    No active tickets assigned to you right now.
                  </td>
                </tr>
              ) : (
                my_active_tickets.map(t => (
                  <tr key={t.id} onClick={() => onSelectTicket(t.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 700, color: '#2563eb' }}>{t.ticket_number}</td>
                    <td style={{ fontWeight: 600, maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.subject}
                    </td>
                    <td>{t.requester_name}</td>
                    <td>{t.category_name}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SlaBadge slaStatus={t.sla_status} /></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); onSelectTicket(t.id); }}>
                        Process
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
