import React, { useState, useEffect } from 'react';
import { Landmark, LogOut, ChevronDown, Check } from 'lucide-react';
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

  const roleStyles = {
    admin: {
      className: 'role-tag-admin',
      avatarClass: 'avatar-admin',
      label: 'Registrar Admin'
    },
    staff: {
      className: 'role-tag-staff',
      avatarClass: 'avatar-staff',
      label: 'Department Staff'
    },
    student: {
      className: 'role-tag-student',
      avatarClass: 'avatar-student',
      label: 'Student Enrollee'
    },
  };

  const currentRoleStyle = roleStyles[user?.role] || roleStyles.student;

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon-box">
          <Landmark size={20} strokeWidth={2} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span className="navbar-brand-name">CampusCare</span>
          <span className="navbar-brand-sub">Registrar's Desk</span>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Demo Account Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-input)', fontSize: '0.8rem' }}
          >
            <span>Switch Role / User</span>
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
              background: 'var(--paper-raised)',
              borderRadius: 'var(--radius-modal)',
              border: '1px solid var(--hairline)',
              boxShadow: 'var(--shadow-offset-lg)',
              zIndex: 60,
              padding: 6
            }}>
              <div style={{
                padding: '8px 10px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Institutional Accounts
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
                      borderRadius: 4,
                      background: isCurrent ? 'var(--paper)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: isCurrent ? 700 : 500, color: 'var(--ink)' }}>
                        {acc.full_name}
                      </div>
                      <div className="data-mono" style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                        {acc.role.toUpperCase()} • {acc.department_name || acc.student_or_employee_id || 'General'}
                      </div>
                    </div>
                    {isCurrent && <Check size={14} color="var(--brass)" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Current Role Tag */}
        <div className={`role-tag ${currentRoleStyle.className}`}>
          {currentRoleStyle.label}
        </div>

        {/* Notifications Dropdown */}
        <NotificationDropdown onSelectTicket={onSelectTicket} />

        {/* User Profile & Logout */}
        <div className="user-profile-menu">
          <div className={`avatar ${currentRoleStyle.avatarClass}`}>
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'R'}
          </div>
          <div style={{ display: 'none', md: 'block' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>
              {user?.full_name}
            </div>
            <div className="data-mono" style={{ fontSize: '0.725rem', color: 'var(--ink-soft)' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Close desk session (Log out)"
            className="btn btn-secondary btn-sm"
            style={{ width: 34, height: 34, padding: 0, borderRadius: 'var(--radius-input)' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
