import React, { useState, useEffect } from 'react';
import { Clock, Tag, Building, Save, Plus } from 'lucide-react';
import { api } from '../api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('sla'); // 'sla', 'categories', 'departments'
  const [slaPolicies, setSlaPolicies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Add category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatDeptId, setNewCatDeptId] = useState('');

  // Add department form
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [slaRes, catRes, deptRes] = await Promise.all([
        api.getSlaPolicies(),
        api.getCategories(),
        api.getDepartments(),
      ]);
      setSlaPolicies(slaRes.policies || []);
      setCategories(catRes.categories || []);
      setDepartments(deptRes.departments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleUpdateSla = async (prio, firstRespMins, resMins, pauseWaiting) => {
    setMessage('');
    setError('');
    try {
      await api.updateSlaPolicy(prio, {
        first_response_minutes: parseInt(firstRespMins, 10),
        resolution_minutes: parseInt(resMins, 10),
        pause_while_waiting: pauseWaiting,
      });
      setMessage(`SLA Policy for ${prio.toUpperCase()} successfully updated in registry!`);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        department_id: newCatDeptId ? parseInt(newCatDeptId, 10) : null,
      });
      setNewCatName('');
      setNewCatDesc('');
      setMessage('Category record created successfully in registry!');
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      await api.createDepartment({
        name: newDeptName.trim(),
        description: newDeptDesc.trim(),
      });
      setNewDeptName('');
      setNewDeptDesc('');
      setMessage('Department entry added to registry!');
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Institution Settings & SLA Policies</h1>
          <p className="page-subtitle">
            Configure institutional support categories, SLA turnaround targets, and department routing.
          </p>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Settings Navigation Tabs (Drawer Tab divider style) */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '2px solid var(--hairline)',
        marginBottom: 24,
        overflowX: 'auto'
      }}>
        <button
          className="btn"
          onClick={() => setActiveTab('sla')}
          style={{
            borderRadius: '2px 2px 0 0',
            border: '1px solid var(--hairline)',
            borderBottom: activeTab === 'sla' ? '2px solid var(--paper-raised)' : '1px solid var(--hairline)',
            background: activeTab === 'sla' ? 'var(--paper-raised)' : 'transparent',
            color: activeTab === 'sla' ? 'var(--ink)' : 'var(--ink-soft)',
            fontWeight: activeTab === 'sla' ? 700 : 500,
            marginBottom: -2,
            boxShadow: 'none'
          }}
        >
          <Clock size={15} />
          SLA Targets Schedule
        </button>

        <button
          className="btn"
          onClick={() => setActiveTab('categories')}
          style={{
            borderRadius: '2px 2px 0 0',
            border: '1px solid var(--hairline)',
            borderBottom: activeTab === 'categories' ? '2px solid var(--paper-raised)' : '1px solid var(--hairline)',
            background: activeTab === 'categories' ? 'var(--paper-raised)' : 'transparent',
            color: activeTab === 'categories' ? 'var(--ink)' : 'var(--ink-soft)',
            fontWeight: activeTab === 'categories' ? 700 : 500,
            marginBottom: -2,
            boxShadow: 'none'
          }}
        >
          <Tag size={15} />
          Inquiry Categories ({categories.length})
        </button>

        <button
          className="btn"
          onClick={() => setActiveTab('departments')}
          style={{
            borderRadius: '2px 2px 0 0',
            border: '1px solid var(--hairline)',
            borderBottom: activeTab === 'departments' ? '2px solid var(--paper-raised)' : '1px solid var(--hairline)',
            background: activeTab === 'departments' ? 'var(--paper-raised)' : 'transparent',
            color: activeTab === 'departments' ? 'var(--ink)' : 'var(--ink-soft)',
            fontWeight: activeTab === 'departments' ? 700 : 500,
            marginBottom: -2,
            boxShadow: 'none'
          }}
        >
          <Building size={15} />
          Departments ({departments.length})
        </button>
      </div>

      {/* Tab 1: SLA Policy Configuration */}
      {activeTab === 'sla' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 6 }}>
              Institutional SLA Turnaround Standards
            </h2>
            <p className="meta-small" style={{ marginBottom: 20 }}>
              Adjust target response windows and resolution deadlines per priority tier. Time is logged in hours and minutes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {slaPolicies.map(pol => {
                return (
                  <SlaPolicyRow
                    key={pol.priority}
                    policy={pol}
                    onSave={handleUpdateSla}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inquiry Categories */}
      {activeTab === 'categories' && (
        <div className="settings-two-col-grid">
          {/* Categories Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '18px 24px', margin: 0 }}>
              <h2 className="card-title">Registered Inquiry Categories</h2>
              <span className="meta-small">{categories.length} active</span>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Designated Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.name}</div>
                        <div className="meta-small">{c.description}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{c.department_name || 'General Records'}</span>
                      </td>
                      <td>
                        <span className="badge-status badge-status-resolved">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Category Form */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 14 }}>
              Register New Category
            </h2>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Hostel Room Transfer"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Scope</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe the nature of requests cataloged under this header..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Department</label>
                <select
                  className="form-control"
                  value={newCatDeptId}
                  onChange={(e) => setNewCatDeptId(e.target.value)}
                >
                  <option value="">General Records Desk</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                <Plus size={16} />
                Add Category to Registry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Departments */}
      {activeTab === 'departments' && (
        <div className="settings-two-col-grid">
          {/* Departments Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '18px 24px', margin: 0 }}>
              <h2 className="card-title">Configured College Departments</h2>
              <span className="meta-small">{departments.length} total</span>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Operational Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{d.name}</td>
                      <td className="meta-small">{d.description || 'General administrative support'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Department Form */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 14 }}>
              Register Department
            </h2>
            <form onSubmit={handleAddDepartment}>
              <div className="form-group">
                <label className="form-label">Department Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Examinations & Grading Bureau"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mandate / Scope</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Official purview of this department..."
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                <Plus size={16} />
                Register Department
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inner helper row for SLA Policy editing
function SlaPolicyRow({ policy, onSave }) {
  const [firstRespMins, setFirstRespMins] = useState(policy.first_response_minutes || 60);
  const [resMins, setResMins] = useState(policy.resolution_minutes || 1440);
  const [pauseWaiting, setPauseWaiting] = useState(!!policy.pause_while_waiting);
  const [isChanged, setIsChanged] = useState(false);

  const handleFirstChange = (val) => {
    setFirstRespMins(val);
    setIsChanged(true);
  };

  const handleResChange = (val) => {
    setResMins(val);
    setIsChanged(true);
  };

  const handlePauseChange = (val) => {
    setPauseWaiting(val);
    setIsChanged(true);
  };

  const handleSave = () => {
    onSave(policy.priority, firstRespMins, resMins, pauseWaiting);
    setIsChanged(false);
  };

  return (
    <div style={{
      padding: '16px 20px',
      border: '1px solid var(--hairline)',
      borderRadius: 2,
      background: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap'
    }}>
      <div style={{ minWidth: 120 }}>
        <span className={`stamp-badge stamp-${policy.priority.toLowerCase()}`}>
          {policy.priority.toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <label className="meta-small" style={{ display: 'block', fontSize: '0.7rem' }}>
            First Response (Hours)
          </label>
          <input
            type="number"
            className="form-control data-mono"
            style={{ width: 100, padding: '4px 8px', fontSize: '0.85rem' }}
            value={Math.round(firstRespMins / 60)}
            onChange={(e) => handleFirstChange(Math.max(1, parseInt(e.target.value || 1, 10)) * 60)}
          />
        </div>

        <div>
          <label className="meta-small" style={{ display: 'block', fontSize: '0.7rem' }}>
            Final Resolution (Hours)
          </label>
          <input
            type="number"
            className="form-control data-mono"
            style={{ width: 100, padding: '4px 8px', fontSize: '0.85rem' }}
            value={Math.round(resMins / 60)}
            onChange={(e) => handleResChange(Math.max(1, parseInt(e.target.value || 1, 10)) * 60)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 18 }}>
          <input
            type="checkbox"
            id={`pause-${policy.priority}`}
            checked={pauseWaiting}
            onChange={(e) => handlePauseChange(e.target.checked)}
          />
          <label htmlFor={`pause-${policy.priority}`} className="meta-small" style={{ cursor: 'pointer' }}>
            Pause SLA clock during student reply
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="btn btn-primary btn-sm"
        disabled={!isChanged}
      >
        <Save size={13} />
        Update Policy
      </button>
    </div>
  );
}
