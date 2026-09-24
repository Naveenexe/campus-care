import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  ShieldAlert,
  ArrowRight,
  Filter,
  Calendar,
} from 'lucide-react';
import { api } from '../api';
import { StatusDonutChart, CategoryBarChart, AgeingDistributionChart, StaffWorkloadChart } from '../components/Charts';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';

export default function AdminDashboard({ onSelectTicket, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminDashboard({ date_from: dateFrom, date_to: dateTo });
      setData(res);
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [dateFrom, dateTo]);

  if (loading && !data) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
        <Clock size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading real-time operational dashboard...</p>
      </div>
    );
  }

  const { kpis, status_breakdown, category_breakdown, staff_workload, ageing_bins, overdue_tickets, recent_activity } = data || {};

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Operations Dashboard</h1>
          <p className="page-subtitle">
            Centralized institutional oversight, ticket ageing, staff workloads, and SLA compliance metrics.
          </p>
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: 8 }}>
            <Calendar size={14} color="#64748b" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.825rem', color: '#334155', outline: 'none' }}
              title="Filter from date"
            />
            <span style={{ color: '#94a3b8' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.825rem', color: '#334155', outline: 'none' }}
              title="Filter to date"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Grid (FR-041) */}
      <div className="kpi-grid">
        {/* Total Tickets */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Inquiries</span>
            <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Ticket size={20} />
            </div>
          </div>
          <div className="kpi-value">{kpis?.total || 0}</div>
          <div className="kpi-subtitle">All-time student tickets</div>
        </div>

        {/* Active In-Progress & Open */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Open & Active</span>
            <div className="kpi-icon-box" style={{ background: '#eef2ff', color: '#4f46e5' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#4f46e5' }}>
            {(kpis?.open || 0) + (kpis?.in_progress || 0)}
          </div>
          <div className="kpi-subtitle">
            {kpis?.open || 0} pending triage • {kpis?.in_progress || 0} in progress
          </div>
        </div>

        {/* Overdue / SLA Breaches */}
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
          <div className="kpi-subtitle">
            {(kpis?.approaching || 0)} tickets approaching deadline
          </div>
        </div>

        {/* SLA Compliance Rate */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">SLA Compliance</span>
            <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>
            {kpis?.sla_compliance_rate || 0}%
          </div>
          <div className="kpi-subtitle">Target: 95% compliance</div>
        </div>

        {/* Avg Resolution Time */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Avg Resolution</span>
            <div className="kpi-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value">
            {kpis?.avg_resolution_hours || 0}<span style={{ fontSize: '1.1rem', fontWeight: 600 }}>h</span>
          </div>
          <div className="kpi-subtitle">Across resolved requests</div>
        </div>
      </div>

      {/* Middle Grid: Charts (Status & Categories) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Ticket Lifecycle Distribution</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Live counts</span>
          </div>
          <StatusDonutChart statusData={status_breakdown} />
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Volume by Department / Category</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>All requests</span>
          </div>
          <CategoryBarChart categoryData={category_breakdown} />
        </div>
      </div>

      {/* Ticket Ageing Bins (FR-044) */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Ticket Ageing Analysis</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              Classification of pending & active requests by elapsed response time
            </p>
          </div>
          <span className="badge badge-priority-medium">Active Requests</span>
        </div>
        <AgeingDistributionChart ageingBins={ageing_bins} />
      </div>

      {/* Two Column Section: Staff Workload & Overdue Escalations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Staff Workload */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="#2563eb" />
              <h3 className="card-title">Staff Workload Distribution</h3>
            </div>
            <button
              onClick={() => onNavigate('staff')}
              className="btn btn-secondary btn-sm"
            >
              Directory
            </button>
          </div>
          <StaffWorkloadChart staffWorkload={staff_workload} />
        </div>

        {/* Overdue / Urgent Escalations */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} color="#dc2626" />
              <h3 className="card-title">Action Required: Overdue Tickets</h3>
            </div>
            <button
              onClick={() => onNavigate('tickets')}
              className="btn btn-secondary btn-sm"
            >
              View All
            </button>
          </div>

          {(!overdue_tickets || overdue_tickets.length === 0) ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#059669', fontSize: '0.875rem' }}>
              <CheckCircle size={24} style={{ margin: '0 auto 8px', color: '#10b981' }} />
              Great news! No tickets are currently overdue.
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
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#991b1b' }}>{t.ticket_number}</span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                      {t.subject}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                      Assigned to: {t.assignee_name || 'Unassigned'} • Dept: {t.department_name || 'General'}
                    </div>
                  </div>
                  <ArrowRight size={16} color="#dc2626" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Institutional Activity Feed */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent System Audit Activity</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Latest 8 events</span>
        </div>
        <div className="timeline">
          {recent_activity?.map(act => (
            <div key={act.id} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-content">
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {act.actor_name || 'System'}:
                </span>{' '}
                <span style={{ color: '#475569' }}>{act.description}</span>
                <span style={{ color: '#2563eb', fontWeight: 600, marginLeft: 8 }}>
                  ({act.ticket_number})
                </span>
                <div className="timeline-time">
                  {new Date(act.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
