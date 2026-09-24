import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, CheckCircle, Clock, ShieldAlert, RotateCcw } from 'lucide-react';
import { api } from '../api';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics({ date_from: dateFrom, date_to: dateTo });
      setData(res);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo]);

  const { summary, priority_stats = {} } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational Reports & Analytics</h1>
          <p className="page-subtitle">
            Longitudinal ticket metrics, resolution turnaround, SLA compliance ratios, and data export.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Date range picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 8 }}>
            <Calendar size={15} color="#64748b" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.825rem', outline: 'none' }}
              title="From date"
            />
            <span style={{ color: '#94a3b8' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.825rem', outline: 'none' }}
              title="To date"
            />
          </div>

          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="btn btn-secondary btn-sm"
              title="Clear date filter"
            >
              <RotateCcw size={14} />
            </button>
          )}

          {/* CSV Export Button (FR-049) */}
          <a
            href={api.downloadCsvUrl({ date_from: dateFrom, date_to: dateTo })}
            className="btn btn-primary"
            download
            title="Download complete ticket registry as CSV"
          >
            <Download size={16} />
            Export CSV Report
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Inquiries Evaluated</span>
            <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="kpi-value">{summary?.total_tickets || 0}</div>
          <div className="kpi-subtitle">During selected reporting window</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Completed Work</span>
            <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>
            {summary?.resolved_tickets || 0}
          </div>
          <div className="kpi-subtitle">Successfully resolved requests</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">SLA Compliance Rate</span>
            <div className="kpi-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#16a34a' }}>
            {summary?.sla_compliance_rate || 0}%
          </div>
          <div className="kpi-subtitle">Within SLA resolution targets</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Mean Turnaround Time</span>
            <div className="kpi-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#7c3aed' }}>
            {summary?.avg_resolution_hours || 0}<span style={{ fontSize: '1.1rem' }}>h</span>
          </div>
          <div className="kpi-subtitle">Average hours to resolve</div>
        </div>
      </div>

      {/* Priority SLA Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Performance Breakdown by Priority Tier</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              Detailed breakdown of volumes, completed cases, and deadline breach incidents.
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Priority Level</th>
                <th>Volume</th>
                <th>Resolved</th>
                <th>Breached SLA</th>
                <th>Resolution Ratio</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'urgent', label: 'Urgent (Emergency)', color: '#dc2626' },
                { key: 'high', label: 'High Priority', color: '#ea580c' },
                { key: 'medium', label: 'Medium Priority', color: '#4f46e5' },
                { key: 'low', label: 'Low Priority', color: '#0d9488' },
              ].map(tier => {
                const stat = priority_stats[tier.key] || { count: 0, resolved: 0, breached: 0 };
                const ratio = stat.count > 0 ? Math.round((stat.resolved / stat.count) * 100) : 0;
                return (
                  <tr key={tier.key}>
                    <td style={{ fontWeight: 700, color: tier.color }}>{tier.label}</td>
                    <td style={{ fontWeight: 600 }}>{stat.count}</td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>{stat.resolved}</td>
                    <td style={{ color: stat.breached > 0 ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                      {stat.breached}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${ratio}%`, background: tier.color, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: 35 }}>{ratio}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
