import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Tag, Clock, Building, Plus, Check, Save } from 'lucide-react';
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
      setMessage(`SLA Policy for ${prio.toUpperCase()} successfully updated!`);
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
      setMessage('Category created successfully!');
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
      setMessage('Department created successfully!');
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

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
        <button
          className={`btn ${activeTab === 'sla' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sla')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <Clock size={16} />
          SLA Targets Configuration
        </button>

        <button
          className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('categories')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <Tag size={16} />
          Ticket Categories ({categories.length})
        </button>

        <button
          className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('departments')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <Building size={16} />
          Departments ({departments.length})
        </button>
      </div>

      {/* Tab 1: SLA Policy Configuration */}
      {activeTab === 'sla' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 6 }}>
              Priority Response & Resolution Targets (FR-030, FR-054)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 20 }}>
              Specify the maximum allowed time windows before a ticket is flagged as Approaching Deadline or Overdue.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {slaPolicies.map(policy => (
                <SlaPolicyCard key={policy.priority} policy={policy} onSave={handleUpdateSla} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Routing Department</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{c.name}</td>
                      <td>
                        <span style={{ background: '#eff6ff', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, color: '#1d4ed8' }}>
                          {c.department_name || 'General'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.description}</td>
                      <td>
                        <span className="badge badge-status-resolved">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Category Form */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: 14 }}>
              Add New Category
            </h3>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Hostel & Accommodation"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Department</label>
                <select
                  className="form-control"
                  value={newCatDeptId}
                  onChange={(e) => setNewCatDeptId(e.target.value)}
                >
                  <option value="">-- No Specific Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Scope of student requests handled under this category..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={16} /> Add Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Departments */}
      {activeTab === 'departments' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{d.name}</td>
                      <td style={{ fontSize: '0.85rem', color: '#475569' }}>{d.description}</td>
                      <td>
                        <span className="badge badge-status-resolved">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: 14 }}>
              Add Department
            </h3>
            <form onSubmit={handleAddDepartment}>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Placements & Corporate Relations"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Responsibilities and services managed..."
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={16} /> Add Department
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SlaPolicyCard({ policy, onSave }) {
  const [firstResp, setFirstResp] = useState(policy.first_response_minutes);
  const [resMins, setResMins] = useState(policy.resolution_minutes);
  const [pauseWaiting, setPauseWaiting] = useState(Boolean(policy.pause_while_waiting));
  const [dirty, setDirty] = useState(false);

  const colors = {
    urgent: { bg: '#fff1f2', border: '#fecdd3', text: '#e11d48' },
    high: { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c' },
    medium: { bg: '#eef2ff', border: '#c7d2fe', text: '#4f46e5' },
    low: { bg: '#f0fdfa', border: '#99f6e4', text: '#0d9488' },
  };

  const c = colors[policy.priority.toLowerCase()] || colors.medium;

  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: c.text, textTransform: 'uppercase' }}>
            {policy.priority} Priority
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
            {Math.round(resMins / 60)}h Total Target
          </span>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
            First Staff Response (Minutes)
          </label>
          <input
            type="number"
            className="form-control"
            value={firstResp}
            onChange={(e) => { setFirstResp(e.target.value); setDirty(true); }}
            min={5}
          />
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            ≈ {(firstResp / 60).toFixed(1)} hours
          </span>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
            Full Resolution Target (Minutes)
          </label>
          <input
            type="number"
            className="form-control"
            value={resMins}
            onChange={(e) => { setResMins(e.target.value); setDirty(true); }}
            min={15}
          />
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            ≈ {(resMins / 60).toFixed(1)} hours
          </span>
        </div>

        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            id={`pause-${policy.priority}`}
            checked={pauseWaiting}
            onChange={(e) => { setPauseWaiting(e.target.checked); setDirty(true); }}
          />
          <label htmlFor={`pause-${policy.priority}`} style={{ fontSize: '0.775rem', color: '#334155', cursor: 'pointer' }}>
            Pause timer when Waiting for Student
          </label>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', borderColor: c.border }}
          disabled={!dirty}
          onClick={() => {
            onSave(policy.priority, firstResp, resMins, pauseWaiting);
            setDirty(false);
          }}
        >
          <Save size={14} /> Save SLA Target
        </button>
      </div>
    </div>
  );
}
