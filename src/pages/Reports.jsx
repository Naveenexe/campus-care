import React, { useState, useEffect } from 'react';
import { Download, Calendar, RotateCcw } from 'lucide-react';
import { api } from '../api';
import SplitFlapCounter from '../components/SplitFlapCounter';

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
          <h1 className="page-title">Ledger Reports & Analytics</h1>
          <p className="page-subtitle">
            Longitudinal ticket metrics, resolution turnaround, SLA compliance ratios, and archival CSV data export.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Date range picker */}
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
              title="From date"
            />
            <span style={{ color: 'var(--ink-soft)' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.825rem', color: 'var(--ink)', outline: 'none' }}
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
            <Download size={15} />
            Export Ledger Archive (CSV)
          </a>
        </div>
      </div>

      {/* Summary KPI Cards Strip with Split-Flap Counters */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Inquiries Evaluated</span>
          </div>
          <SplitFlapCounter value={summary?.total_tickets ?? 0} />
          <div className="kpi-subtitle">During selected reporting window</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Completed Cases</span>
          </div>
          <SplitFlapCounter value={summary?.resolved_tickets ?? 0} />
          <div className="kpi-subtitle">Successfully resolved requests</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">SLA Compliance Ratio</span>
          </div>
          <SplitFlapCounter value={summary?.sla_compliance_rate ?? 0} suffix="%" />
          <div className="kpi-subtitle">Within SLA resolution targets</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Average Turnaround</span>
          </div>
          <SplitFlapCounter value={summary?.avg_resolution_hours ?? 0} suffix="h" />
          <div className="kpi-subtitle">Mean elapsed case duration</div>
        </div>
      </div>

      {/* Breakdown by Priority Ruled-Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '20px 24px', margin: 0 }}>
          <div>
            <h2 className="card-title">Priority & Turnaround Breakdown</h2>
            <p className="meta-small" style={{ marginTop: 2 }}>
              Historical resolution performance cataloged by initial inquiry urgency
            </p>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Priority Level</th>
                <th>Total Lodged</th>
                <th>Resolved Total</th>
                <th>Mean Resolution Time</th>
                <th>SLA Compliance</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(priority_stats).length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-soft)' }}>
                    No activity recorded for the specified reporting period.
                  </td>
                </tr>
              ) : (
                Object.entries(priority_stats).map(([prio, stats]) => (
                  <tr key={prio}>
                    <td>
                      <span className={`stamp-badge stamp-${prio.toLowerCase()}`}>
                        {prio.toUpperCase()}
                      </span>
                    </td>
                    <td className="data-mono" style={{ fontWeight: 600 }}>{stats.total || 0}</td>
                    <td className="data-mono" style={{ fontWeight: 600, color: 'var(--sage)' }}>{stats.resolved || 0}</td>
                    <td className="data-mono">
                      {stats.avg_hours ? `${stats.avg_hours} hours` : 'N/A'}
                    </td>
                    <td className="data-mono" style={{
                      fontWeight: 600,
                      color: (stats.compliance_rate || 0) >= 90 ? 'var(--sage)' : 'var(--oxblood)'
                    }}>
                      {stats.compliance_rate || 0}%
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
