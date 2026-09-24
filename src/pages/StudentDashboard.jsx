import React, { useState, useEffect } from 'react';
import { PlusCircle, Ticket, Clock, CheckCircle2, AlertCircle, ArrowRight, MessageSquare } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';

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
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
        <Clock size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading your student portal...</p>
      </div>
    );
  }

  const { kpis, recent_tickets = [] } = data || {};

  return (
    <div>
      {/* Welcome Banner Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        borderRadius: 16,
        padding: '32px 36px',
        color: '#ffffff',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)'
      }}>
        <div style={{ maxWidth: 600 }}>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Student Self-Service Portal
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 10, marginBottom: 8, letterSpacing: '-0.02em' }}>
            Hello, {user?.full_name}
          </h1>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', lineHeight: 1.5 }}>
            Need assistance with fee dues, attendance shortage appeals, official transcripts, or campus Wi-Fi? Submit a support ticket and track its live resolution progress here.
          </p>
        </div>

        <button
          onClick={() => onNavigate('create-ticket')}
          style={{
            background: '#ffffff',
            color: '#1d4ed8',
            border: 'none',
            borderRadius: 10,
            padding: '12px 22px',
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s ease'
          }}
        >
          <PlusCircle size={20} />
          Raise Support Ticket
        </button>
      </div>

      {/* KPI Cards (FR-046) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Requests</span>
            <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Ticket size={20} />
            </div>
          </div>
          <div className="kpi-value">{kpis?.total || 0}</div>
          <div className="kpi-subtitle">Submitted by you</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Active Requests</span>
            <div className="kpi-icon-box" style={{ background: '#eef2ff', color: '#4f46e5' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#4f46e5' }}>{kpis?.active || 0}</div>
          <div className="kpi-subtitle">Currently being addressed</div>
        </div>

        <div className="kpi-card" style={{ borderColor: (kpis?.waiting_for_you || 0) > 0 ? '#fde68a' : '#e2e8f0' }}>
          <div className="kpi-card-header">
            <span className="kpi-title" style={{ color: (kpis?.waiting_for_you || 0) > 0 ? '#b45309' : '#64748b' }}>
              Waiting For Your Reply
            </span>
            <div className="kpi-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
              <MessageSquare size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#d97706' }}>{kpis?.waiting_for_you || 0}</div>
          <div className="kpi-subtitle">Staff requested extra info</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Resolved</span>
            <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>{kpis?.resolved || 0}</div>
          <div className="kpi-subtitle">Completed tickets</div>
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">My Recent Support Tickets</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              Click any ticket to view live progress, staff updates, and conversation
            </p>
          </div>
          <button
            onClick={() => onNavigate('tickets')}
            className="btn btn-secondary btn-sm"
          >
            View All ({kpis?.total || 0})
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Current Status</th>
                <th>Assigned Staff</th>
                <th>Date Raised</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent_tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                    You have not submitted any support tickets yet. Click "Raise Support Ticket" to start.
                  </td>
                </tr>
              ) : (
                recent_tickets.map(t => (
                  <tr key={t.id} onClick={() => onSelectTicket(t.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 700, color: '#2563eb' }}>{t.ticket_number}</td>
                    <td style={{ fontWeight: 600, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.subject}
                    </td>
                    <td>{t.category_name}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>{t.assignee_name || <span style={{ color: '#94a3b8' }}>Queued for Staff</span>}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); onSelectTicket(t.id); }}>
                        Track
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
