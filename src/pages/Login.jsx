import React, { useState } from 'react';
import { Landmark, Lock, Mail, UserPlus, KeyRound, Shield, User, GraduationCap } from 'lucide-react';
import { api, setToken, setStoredUser } from '../api';

export default function Login({ onLoginSuccess }) {
  const [activeRoleTab, setActiveRoleTab] = useState('admin'); // 'student', 'staff', 'admin'
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@campuscare.edu');
  const [password, setPassword] = useState('Password@123');

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regStudentId, setRegStudentId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Role Tab Switching
  const handleRoleTabClick = (role) => {
    setActiveRoleTab(role);
    setError('');
    if (role === 'admin') {
      setEmail('admin@campuscare.edu');
      setPassword('Password@123');
    } else if (role === 'staff') {
      setEmail('it.staff@campuscare.edu');
      setPassword('Password@123');
    } else {
      setEmail('rahul.sharma@student.edu');
      setPassword('Password@123');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      setToken(data.token);
      setStoredUser(data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Authentication credentials could not be verified by the Registrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickLogin = async (demoEmail) => {
    setError('');
    setLoading(true);
    try {
      const data = await api.demoLogin(demoEmail);
      setToken(data.token);
      setStoredUser(data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Demo ledger sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.register({
        full_name: regFullName,
        email: regEmail,
        password: regPassword,
        student_id: regStudentId,
      });
      setToken(data.token);
      setStoredUser(data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Student registration record could not be established.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--paper)',
      padding: '32px 16px',
      position: 'relative'
    }}>
      {/* Centered Registrar's Ledger Card (solid --forest cover) */}
      <div style={{
        width: '100%',
        maxWidth: 520,
        backgroundColor: 'var(--forest)',
        color: 'var(--paper)',
        borderRadius: 4,
        boxShadow: 'var(--shadow-offset-lg), 0 12px 30px rgba(15, 25, 20, 0.4)',
        border: '2px solid var(--brass)',
        outline: '1px solid rgba(216, 185, 121, 0.35)',
        outlineOffset: '-6px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ledger Header / Letterhead */}
        <div style={{
          padding: '40px 36px 20px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(201, 194, 172, 0.25)',
          position: 'relative'
        }}>
          {/* Official Emblem */}
          <div style={{
            width: 48,
            height: 48,
            margin: '0 auto 14px',
            borderRadius: '50%',
            border: '2px solid var(--brass-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brass-soft)',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            <Landmark size={24} strokeWidth={2} />
          </div>

          <div style={{
            fontSize: '0.725rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--brass-soft)',
            marginBottom: 4
          }}>
            OFFICE OF THE REGISTRAR & SUPPORT
          </div>

          {/* Fraunces Wordmark */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.2rem',
            fontWeight: 500,
            color: 'var(--paper-raised)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: '0 0 6px'
          }}>
            CampusCare
          </h1>

          <p style={{
            fontSize: '0.85rem',
            color: 'var(--paper)',
            opacity: 0.85,
            fontFamily: 'var(--font-body)',
            maxWidth: 380,
            margin: '0 auto'
          }}>
            Administrative records office, student ticket lifecycle, and SLA tracking registry.
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '28px 36px 36px' }}>
          {error && (
            <div className="alert alert-danger" style={{ background: 'var(--paper-raised)', color: 'var(--oxblood)', marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* Three Stamped Tabs Role Picker */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brass-soft)',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              SELECT DESK ROLE RECORD
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              background: 'rgba(0, 0, 0, 0.2)',
              padding: 6,
              borderRadius: 3,
              border: '1px solid rgba(201, 194, 172, 0.2)'
            }}>
              <button
                type="button"
                onClick={() => handleRoleTabClick('student')}
                style={{
                  background: activeRoleTab === 'student' ? 'var(--paper-raised)' : 'transparent',
                  color: activeRoleTab === 'student' ? 'var(--ink)' : 'var(--paper)',
                  border: activeRoleTab === 'student' ? '1.5px dashed var(--slate)' : '1px solid transparent',
                  padding: '8px 4px',
                  borderRadius: 2,
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  boxShadow: activeRoleTab === 'student' ? '1px 1px 0 var(--ink)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                <GraduationCap size={13} />
                Student
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabClick('staff')}
                style={{
                  background: activeRoleTab === 'staff' ? 'var(--paper-raised)' : 'transparent',
                  color: activeRoleTab === 'staff' ? 'var(--ink)' : 'var(--paper)',
                  border: activeRoleTab === 'staff' ? '1.5px dashed var(--forest)' : '1px solid transparent',
                  padding: '8px 4px',
                  borderRadius: 2,
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  boxShadow: activeRoleTab === 'staff' ? '1px 1px 0 var(--ink)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                <User size={13} />
                Staff
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabClick('admin')}
                style={{
                  background: activeRoleTab === 'admin' ? 'var(--paper-raised)' : 'transparent',
                  color: activeRoleTab === 'admin' ? 'var(--ink)' : 'var(--paper)',
                  border: activeRoleTab === 'admin' ? '1.5px dashed var(--brass)' : '1px solid transparent',
                  padding: '8px 4px',
                  borderRadius: 2,
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  boxShadow: activeRoleTab === 'admin' ? '1px 1px 0 var(--ink)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                <Shield size={13} />
                Admin
              </button>
            </div>
          </div>

          {!isRegister ? (
            /* Login Form */
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--paper)' }}>
                  Institutional Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--ink-soft)' }} />
                  <input
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: 38 }}
                    placeholder="name@campuscare.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--paper)' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--ink-soft)' }} />
                  <input
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: 38 }}
                    placeholder="Enter ledger password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 8 }}
                disabled={loading}
              >
                {loading ? 'Authenticating with Registrar...' : `Sign In as ${activeRoleTab.toUpperCase()}`}
              </button>
            </form>
          ) : (
            /* Student Registration Form */
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--paper)' }}>
                  Student Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Maya Patel"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--paper)' }}>
                  Student ID / Roll Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 2024-CS-099"
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--paper)' }}>
                  Student Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="maya.patel@student.edu"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--paper)' }}>
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Create secure password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 8 }}
                disabled={loading}
              >
                {loading ? 'Entering in Student Register...' : 'Complete Registration'}
                <UserPlus size={16} />
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brass-soft)',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isRegister ? 'Already registered? Return to Sign In' : 'New student enrollee? Register ledger record here'}
            </button>
          </div>

          {/* Quick-Access Stamped Demo Logins */}
          <div style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop: '1px dashed rgba(201, 194, 172, 0.25)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--brass-soft)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 10
            }}>
              <KeyRound size={13} color="var(--brass-soft)" />
              Instant Evaluation Access
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoQuickLogin('admin@campuscare.edu')}
                style={{
                  justifyContent: 'flex-start',
                  fontSize: '0.75rem',
                  color: 'var(--paper)',
                  borderColor: 'rgba(201, 194, 172, 0.35)',
                  background: 'rgba(0, 0, 0, 0.15)'
                }}
              >
                <Shield size={13} color="var(--brass)" />
                <span>Admin Registrar</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoQuickLogin('it.staff@campuscare.edu')}
                style={{
                  justifyContent: 'flex-start',
                  fontSize: '0.75rem',
                  color: 'var(--paper)',
                  borderColor: 'rgba(201, 194, 172, 0.35)',
                  background: 'rgba(0, 0, 0, 0.15)'
                }}
              >
                <User size={13} color="var(--paper-raised)" />
                <span>Staff: IT Support</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoQuickLogin('finance.staff@campuscare.edu')}
                style={{
                  justifyContent: 'flex-start',
                  fontSize: '0.75rem',
                  color: 'var(--paper)',
                  borderColor: 'rgba(201, 194, 172, 0.35)',
                  background: 'rgba(0, 0, 0, 0.15)'
                }}
              >
                <User size={13} color="var(--paper-raised)" />
                <span>Staff: Accounts</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoQuickLogin('rahul.sharma@student.edu')}
                style={{
                  justifyContent: 'flex-start',
                  fontSize: '0.75rem',
                  color: 'var(--paper)',
                  borderColor: 'rgba(201, 194, 172, 0.35)',
                  background: 'rgba(0, 0, 0, 0.15)'
                }}
              >
                <GraduationCap size={13} color="var(--slate)" />
                <span>Student: Rahul</span>
              </button>
            </div>
            <div className="data-mono" style={{ fontSize: '0.7rem', color: 'rgba(237, 235, 224, 0.65)', marginTop: 8, textAlign: 'center' }}>
              Standard ledger password: Password@123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
