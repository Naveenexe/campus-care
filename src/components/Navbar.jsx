import React, { useState, useEffect } from 'react';
import { GraduationCap, LogOut, User, Shield, ChevronDown, Check } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { api } from '../api';

export default function Navbar({ user, onLogout, onSwitchUser, onSelectTicket }) {
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  useEffect(() => {
    api.getDemoAccounts()
      .then(res => setDemoAccounts(res.accounts || []))
      .catch(() => {});
  }, []);

  const roleColors = {
    admin: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Admin / Manager' },
    staff: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', label: 'Support Staff' },
    student: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Student' },
  };

  const roleStyle = roleColors[user?.role] || roleColors.student;

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon-box">
          <GraduationCap size={22} />
        </div>
        <div>
          <span>CampusCare</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', marginLeft: 8, display: 'inline-block' }}>
            Support Portal
          </span>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Demo Account Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <span>Switch Role / Demo User</span>
            <ChevronDown size={14} />
          </button>

          {showDemoMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: 280,
              maxHeight: 340,
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              zIndex: 60,
              padding: 6
            }}>
              <div style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Instant Switch Demo Accounts
              </div>
              {demoAccounts.map(acc => {
                const isCurrent = acc.id === user?.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setShowDemoMenu(false);
                      onSwitchUser(acc.email);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 6,
                      background: isCurrent ? '#f1f5f9' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: isCurrent ? 700 : 600, color: '#0f172a' }}>
                        {acc.full_name}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                        {acc.role.toUpperCase()} • {acc.department_name || acc.student_or_employee_id || 'Campus'}
                      </div>
                    </div>
                    {isCurrent && <Check size={14} color="#2563eb" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Current Role Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: roleStyle.bg,
          color: roleStyle.color,
          border: `1px solid ${roleStyle.border}`,
          padding: '5px 12px',
          borderRadius: 20,
          fontSize: '0.8rem',
          fontWeight: 700
        }}>
          <Shield size={13} />
          {roleStyle.label}
        </div>

        {/* Notifications Dropdown */}
        <NotificationDropdown onSelectTicket={onSelectTicket} />

        {/* User Info & Logout */}
        <div className="user-profile-menu">
          <div className="avatar">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'none', md: 'block' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
              {user?.full_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              marginLeft: 4
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
