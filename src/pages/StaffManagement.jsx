import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Shield, Mail, Briefcase, Clock, Plus } from 'lucide-react';
import { api } from '../api';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add staff modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, deptRes] = await Promise.all([
        api.getStaff(),
        api.getDepartments()
      ]);
      setStaffList(staffRes.staff || []);
      const depts = deptRes.departments || [];
      setDepartments(depts);
      if (depts.length > 0) setDepartmentId(String(depts[0].id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (staffMember) => {
    const newStatus = staffMember.is_active ? false : true;
    try {
      await api.updateStaff(staffMember.id, { is_active: newStatus });
      setStaffList(prev => prev.map(s => s.id === staffMember.id ? { ...s, is_active: newStatus ? 1 : 0 } : s));
    } catch (err) {
      alert('Failed to update staff status: ' + err.message);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await api.createStaff({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        department_id: departmentId ? parseInt(departmentId, 10) : null,
        employee_id: employeeId.trim() || undefined,
      });

      setIsAddOpen(false);
      setFullName('');
      setEmail('');
      setEmployeeId('');
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to create staff account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Support Staff Management</h1>
          <p className="page-subtitle">
            Manage administrative staff accounts, department assignments, active workloads, and ticket assignment eligibility.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <UserPlus size={16} />
          Add Staff Member
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Active Workload</th>
                <th>Total Resolved</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                    <Clock size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    Loading staff directory...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    No staff accounts configured.
                  </td>
                </tr>
              ) : (
                staffList.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                          {s.full_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#475569' }}>
                      {s.student_or_employee_id || 'STF-' + s.id}
                    </td>
                    <td>
                      <span style={{
                        background: '#f1f5f9',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: '#334155'
                      }}>
                        {s.department_name || 'General / Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: s.active_workload > 4 ? '#dc2626' : '#2563eb'
                      }}>
                        {s.active_workload || 0} active
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>
                      {s.resolved_count || 0} resolved
                    </td>
                    <td>
                      {s.is_active ? (
                        <span className="badge badge-status-resolved">
                          <Check size={12} /> Active
                        </span>
                      ) : (
                        <span className="badge badge-status-closed">
                          <X size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${s.is_active ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleToggleActive(s)}
                      >
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserPlus size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Add Support Staff Account</h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaff}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger">{formError}</div>}

                <div className="form-group">
                  <label className="form-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dr. Rajesh Khanna"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Institutional Email <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="rajesh.khanna@campuscare.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. STF-201"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department Assignment</label>
                  <select
                    className="form-control"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                  >
                    <option value="">-- General / Multi-Department --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input
                    type="text"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !fullName.trim() || !email.trim()}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
