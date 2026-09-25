import React, { useState, useEffect } from 'react';
import { UserPlus, Clock, X } from 'lucide-react';
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
          <h1 className="page-title">Support Staff Directory</h1>
          <p className="page-subtitle">
            Manage administrative staff records, department assignments, active caseloads, and desk eligibility.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <UserPlus size={16} />
          Register Staff Member
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Staff Officer</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Active Caseload</th>
                <th>Resolved Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-soft)' }}>
                    <Clock size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--brass)' }} />
                    <span className="data-mono">Consulting personnel register...</span>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-soft)' }}>
                    No staff records currently registered in the ledger. Use "Register Staff Member" above to create a profile.
                  </td>
                </tr>
              ) : (
                staffList.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-staff" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          {s.full_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.full_name}</div>
                          <div className="data-mono" style={{ fontSize: '0.725rem', color: 'var(--ink-soft)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="data-mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                      {s.student_or_employee_id || 'STF-' + s.id}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{s.department_name || 'General Records'}</span>
                    </td>
                    <td>
                      <span className="data-mono" style={{ fontWeight: 600, color: (s.active_tickets || 0) > 4 ? 'var(--oxblood)' : 'var(--forest)' }}>
                        {s.active_tickets || 0} active
                      </span>
                    </td>
                    <td>
                      <span className="data-mono" style={{ fontWeight: 600, color: 'var(--sage)' }}>
                        {s.resolved_count || 0}
                      </span>
                    </td>
                    <td>
                      {s.is_active ? (
                        <span className="badge-status badge-status-resolved">Active Duty</span>
                      ) : (
                        <span className="badge-status badge-status-closed">Deactivated</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${s.is_active ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => handleToggleActive(s)}
                        title={s.is_active ? 'Suspend staff desk access' : 'Reinstate staff desk access'}
                      >
                        {s.is_active ? 'Deactivate' : 'Reactivate'}
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
              <h2 className="modal-title">Register Staff Member</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddStaff}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger">{formError}</div>}

                <div className="form-group">
                  <label className="form-label">Full Legal Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Eleanor Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. EMP-2024-04"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Institutional Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="eleanor.vance@campuscare.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Department</label>
                  <select
                    className="form-control"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    required
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Registering...' : 'Confirm Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
