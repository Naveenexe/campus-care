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
  Calendar,
} from 'lucide-react';
import { api } from '../api';
import { StatusDonutChart, CategoryBarChart, AgeingDistributionChart, StaffWorkloadChart } from '../components/Charts';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SplitFlapCounter from '../components/SplitFlapCounter';

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
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
        <Clock size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--brass)' }} />
        <p className="data-mono">Consulting registrar archives...</p>
      </div>
    );
  }

  const { kpis, status_breakdown, category_breakdown, staff_workload, ageing_bins, overdue_tickets, recent_activity } = data || {};
  const activeCount = (kpis?.open || 0) + (kpis?.in_progress || 0);

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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--paper-raised)',
            border: '1px solid var(--hairline)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-input)'
          }}>
            <Calendar size={14} color="var(--ink-soft)" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.825rem', color: 'var(--ink)', outline: 'none' }}
              title="Filter from date"
            />
            <span style={{ color: 'var(--ink-soft)' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.825rem', color: 'var(--ink)', outline: 'none' }}
              title="Filter to date"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="btn btn-secondary btn-sm"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Strip — Split-Flap / Solari departure board display */}
      <div className="kpi-grid">
        {/* Total Inquiries */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Inquiries</span>
            <div className="kpi-icon-box">
              <Ticket size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.total ?? 0} />
          <div className="kpi-subtitle">All-time student tickets logged</div>
        </div>

        {/* Active Open / In-Progress */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Open & Active</span>
            <div className="kpi-icon-box">
              <Clock size={17} />
            </div>
          </div>
          <SplitFlapCounter value={activeCount} />
          <div className="kpi-subtitle">
            {kpis?.open || 0} pending triage • {kpis?.in_progress || 0} under review
          </div>
        </div>

        {/* Overdue / SLA Breaches */}
        <div className="kpi-card" style={{
          borderLeft: (kpis?.overdue || 0) > 0 ? '3px solid var(--oxblood)' : '1px solid var(--hairline)'
        }}>
          <div className="kpi-card-header">
            <span className="kpi-title" style={{ color: (kpis?.overdue || 0) > 0 ? 'var(--oxblood)' : 'var(--ink-soft)' }}>
              Overdue Tickets
            </span>
            <div className="kpi-icon-box" style={{
              color: (kpis?.overdue || 0) > 0 ? 'var(--oxblood)' : 'var(--ink-soft)'
            }}>
              <AlertTriangle size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.overdue ?? 0} />
          <div className="kpi-subtitle" style={{ color: (kpis?.overdue || 0) > 0 ? 'var(--oxblood)' : 'var(--ink-soft)' }}>
            {(kpis?.approaching || 0)} approaching SLA deadline
          </div>
        </div>

        {/* SLA Compliance Rate */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">SLA Compliance</span>
            <div className="kpi-icon-box">
              <CheckCircle size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.sla_compliance_rate ?? 0} suffix="%" />
          <div className="kpi-subtitle">Institutional standard: 95%</div>
        </div>

        {/* Avg Resolution Time */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Avg Resolution</span>
            <div className="kpi-icon-box">
              <TrendingUp size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.avg_resolution_hours ?? 0} suffix="h" />
          <div className="kpi-subtitle">Across completed inquiries</div>
        </div>
      </div>

      {/* Middle Grid: Charts (Status & Categories) */}
      <div className="dashboard-two-col-grid">
        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Ticket Lifecycle Distribution</h2>
            <span className="meta-small">Live counts</span>
          </div>
          <StatusDonutChart statusData={status_breakdown} />
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Volume by Department / Category</h2>
            <span className="meta-small">All inquiries</span>
          </div>
          <CategoryBarChart categoryData={category_breakdown} />
        </div>
      </div>

      {/* Ticket Ageing Bins (FR-044) */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Ticket Ageing Analysis</h2>
            <p className="meta-small" style={{ marginTop: 2 }}>
              Classification of pending & active requests by elapsed response time
            </p>
          </div>
          <span className="stamp-badge stamp-medium">ACTIVE QUEUE</span>
        </div>
        <AgeingDistributionChart ageingBins={ageing_bins} />
      </div>

      {/* Two Column Section: Staff Workload & Overdue Escalations */}
      <div className="dashboard-two-col-grid">
        {/* Staff Workload */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="var(--forest)" />
              <h2 className="card-title">Staff Caseload Distribution</h2>
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
              <ShieldAlert size={18} color="var(--oxblood)" />
              <h2 className="card-title">Action Required: Overdue Tickets</h2>
            </div>
            <button
              onClick={() => onNavigate('tickets')}
              className="btn btn-secondary btn-sm"
            >
              View Registry
            </button>
          </div>

          {(!overdue_tickets || overdue_tickets.length === 0) ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--sage)', fontSize: '0.9rem' }}>
              <CheckCircle size={24} style={{ margin: '0 auto 8px', color: 'var(--sage)' }} />
              All tickets are currently compliant within their SLA resolution deadlines.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {overdue_tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  style={{
                    padding: '14px 16px',
                    border: '1px solid var(--hairline)',
                    borderLeft: '4px solid var(--oxblood)',
                    borderRadius: 'var(--radius-card)',
                    background: 'var(--paper-raised)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-offset-sm)',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="data-mono" style={{ fontWeight: 600, color: 'var(--oxblood)' }}>
                        {t.ticket_number}
                      </span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)' }}>
                      {t.subject}
                    </div>
                    <div className="meta-small" style={{ marginTop: 2 }}>
                      Assigned: {t.assignee_name || 'Unassigned'} • Dept: {t.department_name || 'General Records'}
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--oxblood)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Institutional Activity Feed */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent System Audit Activity</h2>
          <span className="meta-small">Latest 8 ledger entries</span>
        </div>
        <div className="timeline">
          {recent_activity?.map(act => (
            <div key={act.id} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-content">
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {act.actor_name || 'Registrar System'}:
                </span>{' '}
                <span style={{ color: 'var(--ink)' }}>{act.description}</span>
                <span className="data-mono" style={{ color: 'var(--forest)', fontWeight: 600, marginLeft: 8 }}>
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
