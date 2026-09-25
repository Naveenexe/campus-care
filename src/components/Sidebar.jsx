import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  BarChart3,
  Settings,
  FolderKanban,
} from 'lucide-react';

export default function Sidebar({ currentView, setView, role }) {
  const getNavSections = () => {
    if (role === 'admin') {
      return [
        {
          drawerLabel: 'REGISTRAR DESK',
          items: [
            { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
            { id: 'tickets', label: 'Ticket Registry', icon: Ticket },
            { id: 'create-ticket', label: 'Lodge Request', icon: PlusCircle },
          ]
        },
        {
          drawerLabel: 'ADMINISTRATION',
          items: [
            { id: 'staff', label: 'Staff Directory', icon: Users },
            { id: 'reports', label: 'Ledger Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Desk Settings', icon: Settings },
          ]
        }
      ];
    } else if (role === 'staff') {
      return [
        {
          drawerLabel: 'STAFF QUEUE',
          items: [
            { id: 'dashboard', label: 'Staff Workspace', icon: LayoutDashboard },
            { id: 'tickets', label: 'Assigned Registry', icon: Ticket },
            { id: 'reports', label: 'Caseload Reports', icon: BarChart3 },
          ]
        }
      ];
    } else {
      // student
      return [
        {
          drawerLabel: 'STUDENT DESK',
          items: [
            { id: 'dashboard', label: 'Student Portal', icon: LayoutDashboard },
            { id: 'tickets', label: 'My Inquiries', icon: Ticket },
            { id: 'create-ticket', label: 'Submit Ticket', icon: PlusCircle },
          ]
        }
      ];
    }
  };

  const sections = getNavSections();

  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            <div className="sidebar-drawer-label">
              {section.drawerLabel}
            </div>

            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  className={`sidebar-link ${isActive ? `active role-${role}` : ''}`}
                  onClick={() => setView(item.id)}
                >
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div style={{
          border: '1px solid rgba(201, 194, 172, 0.25)',
          padding: '10px 12px',
          borderRadius: 2,
          fontSize: '0.75rem',
          color: 'var(--paper)',
          background: 'rgba(30, 42, 50, 0.25)'
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            color: 'var(--brass-soft)',
            fontSize: '0.85rem',
            marginBottom: 2
          }}>
            Registrar's Office
          </div>
          <div style={{ opacity: 0.8, fontSize: '0.7rem' }}>
            Academic Records & Support
          </div>
        </div>
      </div>
    </aside>
  );
}
