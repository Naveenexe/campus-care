import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';

export default function Sidebar({ currentView, setView, role }) {
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
        { id: 'tickets', label: 'Ticket Management', icon: Ticket },
        { id: 'create-ticket', label: 'Create Ticket', icon: PlusCircle },
        { id: 'staff', label: 'Staff Directory', icon: Users },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ];
    } else if (role === 'staff') {
      return [
        { id: 'dashboard', label: 'Staff Dashboard', icon: LayoutDashboard },
        { id: 'tickets', label: 'Assigned Tickets', icon: Ticket },
        { id: 'reports', label: 'Operational Reports', icon: BarChart3 },
      ];
    } else {
      // student
      return [
        { id: 'dashboard', label: 'Student Portal', icon: LayoutDashboard },
        { id: 'tickets', label: 'My Tickets', icon: Ticket },
        { id: 'create-ticket', label: 'Raise Support Ticket', icon: PlusCircle },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        <div style={{ padding: '0 8px 10px', fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Navigation
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div style={{
          background: '#f8fafc',
          borderRadius: 8,
          padding: 12,
          border: '1px solid #e2e8f0',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
            CampusCare v1.0
          </div>
          <div>Pre-Drive Product Assessment Edumerge Solutions</div>
        </div>
      </div>
    </aside>
  );
}
