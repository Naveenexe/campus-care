import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { api } from '../api';

export default function NotificationDropdown({ onSelectTicket }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = (n) => {
    if (!n.is_read) {
      api.markNotificationRead(n.id).catch(() => {});
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: 1 } : item));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (n.ticket_id && onSelectTicket) {
      onSelectTicket(n.ticket_id);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: isOpen ? 'var(--paper)' : 'var(--paper-raised)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius-input)',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--ink)',
          boxShadow: 'var(--shadow-offset-sm)'
        }}
        title="Official Desk Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: 'var(--oxblood)',
            color: 'var(--paper)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            fontWeight: 700,
            borderRadius: '50%',
            width: 17,
            height: 17,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 2px var(--paper-raised)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 340,
          background: 'var(--paper-raised)',
          borderRadius: 'var(--radius-modal)',
          boxShadow: 'var(--shadow-offset-lg)',
          border: '1px solid var(--hairline)',
          zIndex: 50,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--paper)'
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
              Ledger Notices {unreadCount > 0 && `(${unreadCount} pending)`}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--forest)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                No active ledger notifications recorded.
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--hairline)',
                    background: n.is_read ? 'var(--paper-raised)' : 'rgba(216, 185, 121, 0.12)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    transition: 'background 0.1s ease'
                  }}
                >
                  <div style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: n.is_read ? 'transparent' : 'var(--brass)',
                    marginTop: 6,
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.825rem',
                      color: 'var(--ink)',
                      fontWeight: n.is_read ? 400 : 600,
                      lineHeight: 1.4,
                      margin: 0
                    }}>
                      {n.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span className="data-mono" style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {n.ticket_number && (
                        <span className="data-mono" style={{ fontSize: '0.7rem', color: 'var(--forest)', fontWeight: 600 }}>
                          {n.ticket_number}
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={(e) => handleMarkRead(n.id, e)}
                      title="Mark as read"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--ink-soft)',
                        cursor: 'pointer',
                        padding: 2
                      }}
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
