import React, { useState, useEffect } from 'react';
import { api, getStoredUser, getToken, setToken, setStoredUser } from './api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TicketList from './pages/TicketList';
import TicketDetails from './pages/TicketDetails';
import CreateTicket from './pages/CreateTicket';
import StaffManagement from './pages/StaffManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Auto-authenticate on load
  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();

    if (token && stored) {
      setUser(stored);
      api.getMe()
        .then(res => {
          setUser(res.user);
          setStoredUser(res.user);
        })
        .catch(() => {
          setUser(null);
          setToken(null);
          setStoredUser(null);
        })
        .finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
      setCurrentView('dashboard');
      setSelectedTicketId(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setCurrentView('dashboard');
    setSelectedTicketId(null);
  };

  const handleLogout = () => {
    setToken(null);
    setStoredUser(null);
    setUser(null);
    setCurrentView('dashboard');
    setSelectedTicketId(null);
  };

  const handleSwitchUser = async (email) => {
    try {
      const data = await api.demoLogin(email);
      setToken(data.token);
      setStoredUser(data.user);
      setUser(data.user);
      setCurrentView('dashboard');
      setSelectedTicketId(null);
    } catch (err) {
      alert('Failed to switch user: ' + err.message);
    }
  };

  const handleSelectTicket = (id) => {
    setSelectedTicketId(id);
    setCurrentView('ticket-detail');
  };

  const handleBackToList = () => {
    setSelectedTicketId(null);
    setCurrentView('tickets');
  };

  if (initializing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontFamily: 'var(--font-family)'
      }}>
        Initializing CampusCare...
      </div>
    );
  }

  // Not authenticated -> Show Login Screen 1
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render the appropriate main view
  const renderView = () => {
    if (currentView === 'ticket-detail' && selectedTicketId) {
      return (
        <TicketDetails
          ticketId={selectedTicketId}
          user={user}
          onBack={handleBackToList}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        if (user.role === 'admin') {
          return <AdminDashboard onSelectTicket={handleSelectTicket} onNavigate={setCurrentView} />;
        } else if (user.role === 'staff') {
          return <StaffDashboard user={user} onSelectTicket={handleSelectTicket} onNavigate={setCurrentView} />;
        } else {
          return <StudentDashboard user={user} onSelectTicket={handleSelectTicket} onNavigate={setCurrentView} />;
        }

      case 'tickets':
        return (
          <TicketList
            user={user}
            onSelectTicket={handleSelectTicket}
            onNavigate={setCurrentView}
          />
        );

      case 'create-ticket':
        return (
          <CreateTicket
            onTicketCreated={(newId) => {
              if (newId) handleSelectTicket(newId);
              else setCurrentView('tickets');
            }}
            onCancel={() => setCurrentView('dashboard')}
          />
        );

      case 'staff':
        if (user.role === 'admin') return <StaffManagement />;
        return <TicketList user={user} onSelectTicket={handleSelectTicket} onNavigate={setCurrentView} />;

      case 'reports':
        return <Reports />;

      case 'settings':
        if (user.role === 'admin') return <Settings />;
        return <TicketList user={user} onSelectTicket={handleSelectTicket} onNavigate={setCurrentView} />;

      default:
        return <TicketList user={user} onSelectTicket={handleSelectTicket} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        setView={(v) => {
          setSelectedTicketId(null);
          setCurrentView(v);
        }}
        role={user.role}
      />

      <div className="main-content">
        <Navbar
          user={user}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          onSelectTicket={handleSelectTicket}
        />

        <main className="content-body">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
