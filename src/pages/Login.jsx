import React, { useState } from 'react';
import { GraduationCap, Lock, Mail, User, Shield, ArrowRight, UserPlus, KeyRound } from 'lucide-react';
import { api, setToken, setStoredUser } from '../api';

export default function Login({ onLoginSuccess }) {
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
      setError(err.message || 'Login failed');
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
      setError(err.message || 'Demo login failed');
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
      setError(err.message || 'Registration failed');
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
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 500,
        background: '#ffffff',
        borderRadius: 20,
        boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Header Branding */}
        <div style={{
          padding: '36px 36px 24px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{
            width: 54,
            height: 54,
            margin: '0 auto 16px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
          }}>
            <GraduationCap size={30} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            CampusCare
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 4 }}>
            Student Support & Administrative Ticket Management
          </p>
        </div>

        <div style={{ padding: '28px 36px' }}>
          {error && <div className="alert alert-danger">{error}</div>}

          {!isRegister ? (
            /* Login Form */
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email or Username</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                  <input
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: 38 }}
                    placeholder="name@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                  <input
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: 38 }}
                    placeholder="Enter password"
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
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            /* Student Registration Form */
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
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
                <label className="form-label">Student ID / Roll Number</label>
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
                <label className="form-label">Student Email</label>
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
                <label className="form-label">Password</label>
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
                {loading ? 'Creating Account...' : 'Complete Registration'}
                <UserPlus size={16} />
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isRegister ? 'Already registered? Return to Login' : "New Student? Register here"}
            </button>
          </div>

          {/* One-Click Demo Access Section */}
          <div style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px dashed #cbd5e1'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              marginBottom: 10
            }}>
              <KeyRound size={13} color="#2563eb" />
              One-Click Evaluation Demo Logins
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoQuickLogin('admin@campuscare.edu')}
                style={{ justifyContent: 'flex-start', fontSize: '0.775rem' }}
              >
                <Shield size={13} color="#1d4ed8" />
                <span>Admin / Registrar</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoQuickLogin('finance.staff@campuscare.edu')}
                style={{ justifyContent: 'flex-start', fontSize: '0.775rem' }}
              >
                <User size={13} color="#6d28d9" />
                <span>Staff: Accounts</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoQuickLogin('it.staff@campuscare.edu')}
                style={{ justifyContent: 'flex-start', fontSize: '0.775rem' }}
              >
                <User size={13} color="#6d28d9" />
                <span>Staff: IT Support</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoQuickLogin('rahul.sharma@student.edu')}
                style={{ justifyContent: 'flex-start', fontSize: '0.775rem' }}
              >
                <GraduationCap size={13} color="#059669" />
                <span>Student: Rahul</span>
              </button>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
              Standard password for manual login: <code>Password@123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
