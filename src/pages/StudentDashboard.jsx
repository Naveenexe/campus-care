import React, { useState, useEffect } from 'react';
import { PlusCircle, Ticket, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SplitFlapCounter from '../components/SplitFlapCounter';

export default function StudentDashboard({ user, onSelectTicket, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getStudentDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load student dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
        <Clock size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--brass)' }} />
        <p className="data-mono">Retrieving your student record file...</p>
      </div>
    );
  }

  const { kpis, recent_tickets = [] } = data || {};

  return (
    <div>
      {/* Official Registrar Letterhead Banner */}
      <div className="card" style={{
        padding: '32px 36px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        borderLeft: '4px solid var(--forest)'
      }}>
        <div style={{ maxWidth: 640 }}>
          <div className="meta-small" style={{
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--brass)',
            marginBottom: 6
          }}>
            STUDENT SERVICES DESK
          </div>
          {/* Display 44px greeting */}
          <div className="display-greeting" style={{ marginBottom: 10 }}>
            Welcome, {user?.full_name}
          </div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', lineHeight: 1.55 }}>
            Submit and track official requests regarding fee schedules, transcripts, enrollment status, campus facilities, and academic appeals. Every inquiry receives a logged timestamp and dedicated resolution owner.
          </p>
        </div>

        <button
          onClick={() => onNavigate('create-ticket')}
          className="btn btn-primary btn-lg"
        >
          <PlusCircle size={18} />
          Raise Support Ticket
        </button>
      </div>

      {/* KPI Cards Strip with Split-Flap Departure Board Counters */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Requests</span>
            <div className="kpi-icon-box">
              <Ticket size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.total ?? 0} />
          <div className="kpi-subtitle">Logged under your student ID</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Active Requests</span>
            <div className="kpi-icon-box">
              <Clock size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.active ?? 0} />
          <div className="kpi-subtitle">Currently under administrative review</div>
        </div>

        <div className="kpi-card" style={{
          borderLeft: (kpis?.waiting_for_you || 0) > 0 ? '3px solid var(--brass)' : '1px solid var(--hairline)'
        }}>
          <div className="kpi-card-header">
            <span className="kpi-title" style={{ color: (kpis?.waiting_for_you || 0) > 0 ? 'var(--brass)' : 'var(--ink-soft)' }}>
              Ball's in: You
            </span>
            <div className="kpi-icon-box" style={{
              color: (kpis?.waiting_for_you || 0) > 0 ? 'var(--brass)' : 'var(--ink-soft)'
            }}>
              <MessageSquare size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.waiting_for_you ?? 0} />
          <div className="kpi-subtitle">Staff requested clarification or documentation</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Resolved</span>
            <div className="kpi-icon-box">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <SplitFlapCounter value={kpis?.resolved ?? 0} />
          <div className="kpi-subtitle">Completed tickets in archive</div>
        </div>
      </div>

      {/* Recent Inquiries Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '20px 24px', margin: 0 }}>
          <div>
            <h2 className="card-title">Recent Inquiries Ledger</h2>
            <p className="meta-small" style={{ marginTop: 2 }}>
              Select an entry to view the case file, staff correspondence, and audit log
            </p>
          </div>
          <button
            onClick={() => onNavigate('tickets')}
            className="btn btn-secondary btn-sm"
          >
            All Inquiries ({kpis?.total || 0})
          </button>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Department Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Staff</th>
                <th>Date Logged</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent_tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-soft)' }}>
                    This queue is empty. You have not submitted any inquiries to the Registrar's office yet. Click "Raise Support Ticket" to start.
                  </td>
                </tr>
              ) : (
                recent_tickets.map(t => (
                  <tr key={t.id} onClick={() => onSelectTicket(t.id)} style={{ cursor: 'pointer' }}>
                    <td className="data-mono" style={{ fontWeight: 600, color: 'var(--forest)' }}>
                      {t.ticket_number}
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.subject}
                      </div>
                    </td>
                    <td>{t.category_name}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>
                      {t.assignee_name ? (
                        <span style={{ fontWeight: 500 }}>{t.assignee_name}</span>
                      ) : (
                        <span style={{ color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: '0.8rem' }}>Queued for Staff</span>
                      )}
                    </td>
                    <td className="data-mono" style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); onSelectTicket(t.id); }}>
                        Open File
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
