import React, { useState, useEffect } from 'react';
import {
  Search,
  PlusCircle,
  Clock,
  ArrowUpDown,
  RotateCcw,
  Download,
} from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';

export default function TicketList({ user, onSelectTicket, onNavigate }) {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [assignedToId, setAssignedToId] = useState('all');
  const [slaState, setSlaState] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const [loading, setLoading] = useState(true);

  // Load auxiliary data
  useEffect(() => {
    api.getCategories().then(res => setCategories(res.categories || [])).catch(() => {});
    if (['admin', 'staff'].includes(user?.role)) {
      api.getStaff().then(res => setStaffList(res.staff || [])).catch(() => {});
    }
  }, [user]);

  // Load tickets
  const fetchTickets = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.getTickets({
        search,
        status,
        priority,
        category_id: categoryId,
        assigned_to_id: assignedToId,
        sla_state: slaState,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: pagination.limit,
      });
      setTickets(res.tickets || []);
      setPagination(res.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(1);
  }, [status, priority, categoryId, assignedToId, slaState, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTickets(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setPriority('all');
    setCategoryId('all');
    setAssignedToId('all');
    setSlaState('all');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {user?.role === 'student' ? 'My Support Requests' : 'Central Ticket Registry'}
          </h1>
          <p className="page-subtitle">
            Search, filter, prioritize, and track support requests across all departments with SLA monitoring.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {['admin', 'staff'].includes(user?.role) && (
            <a
              href={api.downloadCsvUrl({ category_id: categoryId, status })}
              className="btn btn-secondary"
              download
              title="Export filtered data to CSV"
            >
              <Download size={15} />
              Export Ledger (CSV)
            </a>
          )}
          {['student', 'admin'].includes(user?.role) && (
            <button
              onClick={() => onNavigate('create-ticket')}
              className="btn btn-primary"
            >
              <PlusCircle size={16} />
              Raise New Ticket
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="card" style={{ marginBottom: 20, padding: 18 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--ink-soft)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: 38 }}
              placeholder="Search by ticket ID (e.g. CC-2026-00101), subject, or student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleResetFilters} title="Reset all filters">
            <RotateCcw size={14} />
            Reset
          </button>
        </form>

        {/* Filter Selects */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status Filter */}
          <div style={{ minWidth: 140 }}>
            <select
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '0.825rem' }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_for_student">Waiting for Student</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ minWidth: 130 }}>
            <select
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '0.825rem' }}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: 160 }}>
            <select
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '0.825rem' }}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* SLA State Filter */}
          <div style={{ minWidth: 140 }}>
            <select
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '0.825rem' }}
              value={slaState}
              onChange={(e) => setSlaState(e.target.value)}
            >
              <option value="all">All SLA States</option>
              <option value="overdue">Overdue Only</option>
              <option value="approaching">Approaching Deadline</option>
              <option value="on_track">On Track</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Assignee Filter (Staff & Admin only) */}
          {['admin', 'staff'].includes(user?.role) && (
            <div style={{ minWidth: 150 }}>
              <select
                className="form-control"
                style={{ padding: '6px 10px', fontSize: '0.825rem' }}
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Result Count */}
          <span className="data-mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginLeft: 'auto' }}>
            Showing <strong>{tickets.length}</strong> of <strong>{pagination.total}</strong> records
          </span>
        </div>
      </div>

      {/* Main Ruled-Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('ticket_number')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Ticket ID <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Subject & Category</th>
                {user?.role !== 'student' && <th>Student Requester</th>}
                <th onClick={() => toggleSort('priority')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Priority <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => toggleSort('status')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Status <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Assigned Staff</th>
                <th>SLA State</th>
                <th onClick={() => toggleSort('created_at')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Date Logged <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-soft)' }}>
                    <Clock size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--brass)' }} />
                    <span className="data-mono">Consulting registry records...</span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: 'var(--ink-soft)' }}>
                    This queue is empty. No requests match the selected registrar filters or search query.
                  </td>
                </tr>
              ) : (
                tickets.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    style={{
                      cursor: 'pointer',
                      borderLeft: t.is_overdue ? '3px solid var(--oxblood)' : undefined
                    }}
                  >
                    <td className="data-mono" style={{ fontWeight: 600, color: 'var(--forest)', whiteSpace: 'nowrap' }}>
                      {t.ticket_number}
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.subject}
                      </div>
                      <div className="meta-small" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span>{t.category_name}</span>
                        {t.comment_count > 0 && (
                          <span className="data-mono" style={{ background: 'var(--paper)', padding: '1px 6px', borderRadius: 2, fontSize: '0.675rem' }}>
                            {t.comment_count} notes
                          </span>
                        )}
                      </div>
                    </td>

                    {user?.role !== 'student' && (
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{t.requester_name}</div>
                        <div className="data-mono" style={{ fontSize: '0.725rem', color: 'var(--ink-soft)' }}>
                          {t.requester_identifier || t.requester_email}
                        </div>
                      </td>
                    )}

                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>
                      {t.assignee_name ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 500 }}>{t.assignee_name}</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td><SlaBadge slaStatus={t.sla_status} /></td>
                    <td className="data-mono" style={{ fontSize: '0.775rem', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.id);
                        }}
                      >
                        Inspect
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
