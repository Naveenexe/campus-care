// Centralized API client for CampusCare
// Automatically operates with real Express/SQLite backend when running locally,
// and gracefully switches to full-featured in-browser mock store when hosted statically on Netlify.

import { mockStore } from './mockStore';

const API_BASE = '/api';

export const isStaticDeployment =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('netlify.app') ||
    window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('vercel.app') ||
    (window.location.port === '' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'));

export function getToken() {
  return localStorage.getItem('campuscare_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('campuscare_token', token);
  } else {
    localStorage.removeItem('campuscare_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('campuscare_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('campuscare_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('campuscare_user');
  }
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new Error('Backend server is unreachable. Running in static demonstration mode.');
  }

  // Netlify SPA fallback returns 200 with HTML when route is not found
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error('Static host: No backend API route available.');
  }

  if (response.status === 401) {
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/demo-login')) {
      setToken(null);
      setStoredUser(null);
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }

  if (options.responseType === 'blob') {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return response.blob();
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data;
}

export const api = {
  // Auth
  login: async (email, password) => {
    if (isStaticDeployment) {
      return mockStore.login(email, password);
    }
    try {
      return await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    } catch (err) {
      if (err.message.includes('Static host') || err.message.includes('unreachable')) {
        return mockStore.login(email, password);
      }
      throw err;
    }
  },

  demoLogin: async (email) => {
    if (isStaticDeployment) {
      return mockStore.demoLogin(email);
    }
    try {
      return await request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ email }) });
    } catch (err) {
      return mockStore.demoLogin(email);
    }
  },

  getMe: async () => {
    if (isStaticDeployment) {
      const u = getStoredUser();
      return { user: mockStore.getCurrentUser(u) };
    }
    try {
      return await request('/auth/me');
    } catch (err) {
      const u = getStoredUser();
      return { user: mockStore.getCurrentUser(u) };
    }
  },

  getDemoAccounts: async () => {
    if (isStaticDeployment) {
      return { accounts: mockStore.getDemoAccounts() };
    }
    try {
      return await request('/auth/demo-accounts');
    } catch (err) {
      return { accounts: mockStore.getDemoAccounts() };
    }
  },

  register: async (userData) => {
    if (isStaticDeployment) {
      return mockStore.register(userData);
    }
    try {
      return await request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
    } catch (err) {
      return mockStore.register(userData);
    }
  },

  // Tickets
  getTickets: async (params = {}) => {
    if (isStaticDeployment) {
      return mockStore.getTickets(params, getStoredUser());
    }
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    try {
      return await request(`/tickets?${query.toString()}`);
    } catch (err) {
      return mockStore.getTickets(params, getStoredUser());
    }
  },

  getTicket: async (id) => {
    if (isStaticDeployment) {
      return mockStore.getTicket(id, getStoredUser());
    }
    try {
      return await request(`/tickets/${id}`);
    } catch (err) {
      return mockStore.getTicket(id, getStoredUser());
    }
  },

  createTicket: async (data) => {
    if (isStaticDeployment) {
      return mockStore.createTicket(data, getStoredUser());
    }
    try {
      return await request('/tickets', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      return mockStore.createTicket(data, getStoredUser());
    }
  },

  updateStatus: async (id, status, resolution_summary) => {
    if (isStaticDeployment) {
      return mockStore.updateStatus(id, status, resolution_summary, getStoredUser());
    }
    try {
      return await request(`/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolution_summary }),
      });
    } catch (err) {
      return mockStore.updateStatus(id, status, resolution_summary, getStoredUser());
    }
  },

  assignTicket: async (id, staff_id) => {
    if (isStaticDeployment) {
      return mockStore.assignTicket(id, staff_id, getStoredUser());
    }
    try {
      return await request(`/tickets/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ staff_id }),
      });
    } catch (err) {
      return mockStore.assignTicket(id, staff_id, getStoredUser());
    }
  },

  updatePriority: async (id, priority) => {
    if (isStaticDeployment) {
      return mockStore.updatePriority(id, priority, getStoredUser());
    }
    try {
      return await request(`/tickets/${id}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({ priority }),
      });
    } catch (err) {
      return mockStore.updatePriority(id, priority, getStoredUser());
    }
  },

  reopenTicket: async (id, reason) => {
    if (isStaticDeployment) {
      return mockStore.reopenTicket(id, reason, getStoredUser());
    }
    try {
      return await request(`/tickets/${id}/reopen`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    } catch (err) {
      return mockStore.reopenTicket(id, reason, getStoredUser());
    }
  },

  // Comments
  addComment: async (ticketId, content, visibility) => {
    if (isStaticDeployment) {
      const comment = mockStore.addComment(ticketId, content, visibility, getStoredUser());
      return { comment };
    }
    try {
      return await request(`/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, visibility }),
      });
    } catch (err) {
      const comment = mockStore.addComment(ticketId, content, visibility, getStoredUser());
      return { comment };
    }
  },

  // Dashboard
  getAdminDashboard: async (params = {}) => {
    if (isStaticDeployment) {
      return mockStore.getAdminDashboard();
    }
    const q = new URLSearchParams(params).toString();
    try {
      return await request(`/dashboard/admin${q ? '?' + q : ''}`);
    } catch (err) {
      return mockStore.getAdminDashboard();
    }
  },

  getStaffDashboard: async () => {
    if (isStaticDeployment) {
      return mockStore.getStaffDashboard(getStoredUser());
    }
    try {
      return await request('/dashboard/staff');
    } catch (err) {
      return mockStore.getStaffDashboard(getStoredUser());
    }
  },

  getStudentDashboard: async () => {
    if (isStaticDeployment) {
      return mockStore.getStudentDashboard(getStoredUser());
    }
    try {
      return await request('/dashboard/student');
    } catch (err) {
      return mockStore.getStudentDashboard(getStoredUser());
    }
  },

  // Staff
  getStaff: async () => {
    if (isStaticDeployment) {
      return { staff: mockStore.getStaff() };
    }
    try {
      return await request('/staff');
    } catch (err) {
      return { staff: mockStore.getStaff() };
    }
  },

  getStaffRecommendation: async (categoryId) => {
    if (isStaticDeployment) {
      return { recommendation: mockStore.getStaffRecommendation(categoryId) };
    }
    try {
      return await request(`/staff/recommendation?category_id=${categoryId || ''}`);
    } catch (err) {
      return { recommendation: mockStore.getStaffRecommendation(categoryId) };
    }
  },

  updateStaff: async (id, data) => {
    if (isStaticDeployment) {
      return { staff: mockStore.updateStaff(id, data) };
    }
    try {
      return await request(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    } catch (err) {
      return { staff: mockStore.updateStaff(id, data) };
    }
  },

  createStaff: async (data) => {
    if (isStaticDeployment) {
      return { staff: mockStore.createStaff(data) };
    }
    try {
      return await request('/staff', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      return { staff: mockStore.createStaff(data) };
    }
  },

  // Settings
  getCategories: async () => {
    if (isStaticDeployment) {
      return { categories: mockStore.getCategories() };
    }
    try {
      return await request('/settings/categories');
    } catch (err) {
      return { categories: mockStore.getCategories() };
    }
  },

  createCategory: async (data) => {
    if (isStaticDeployment) {
      return { category: mockStore.createCategory(data) };
    }
    try {
      return await request('/settings/categories', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      return { category: mockStore.createCategory(data) };
    }
  },

  updateCategory: async (id, data) => {
    if (isStaticDeployment) {
      return { category: mockStore.updateCategory(id, data) };
    }
    try {
      return await request(`/settings/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    } catch (err) {
      return { category: mockStore.updateCategory(id, data) };
    }
  },

  getSlaPolicies: async () => {
    if (isStaticDeployment) {
      return { policies: mockStore.getSlaPolicies() };
    }
    try {
      return await request('/settings/sla-policies');
    } catch (err) {
      return { policies: mockStore.getSlaPolicies() };
    }
  },

  updateSlaPolicy: async (priority, data) => {
    if (isStaticDeployment) {
      return { policy: mockStore.updateSlaPolicy(priority, data) };
    }
    try {
      return await request(`/settings/sla-policies/${priority}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err) {
      return { policy: mockStore.updateSlaPolicy(priority, data) };
    }
  },

  getDepartments: async () => {
    if (isStaticDeployment) {
      return { departments: mockStore.getDepartments() };
    }
    try {
      return await request('/settings/departments');
    } catch (err) {
      return { departments: mockStore.getDepartments() };
    }
  },

  // Reports
  getAnalytics: async (params = {}) => {
    if (isStaticDeployment) {
      return mockStore.getAnalytics();
    }
    const q = new URLSearchParams(params).toString();
    try {
      return await request(`/reports/analytics${q ? '?' + q : ''}`);
    } catch (err) {
      return mockStore.getAnalytics();
    }
  },

  downloadCsvUrl: (params = {}) => {
    if (isStaticDeployment) {
      const blob = mockStore.exportCsvBlob();
      return URL.createObjectURL(blob);
    }
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        q.append(k, v);
      }
    });
    const token = getToken();
    if (token) q.append('token', token);
    const qs = q.toString();
    return `${API_BASE}/reports/export-csv${qs ? '?' + qs : ''}`;
  },

  // Notifications
  getNotifications: async () => {
    if (isStaticDeployment) {
      return mockStore.getNotifications(getStoredUser());
    }
    try {
      return await request('/notifications');
    } catch (err) {
      return mockStore.getNotifications(getStoredUser());
    }
  },

  markNotificationRead: async (id) => {
    if (isStaticDeployment) {
      return mockStore.markNotificationRead(id);
    }
    try {
      return await request(`/notifications/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      return mockStore.markNotificationRead(id);
    }
  },

  markAllNotificationsRead: async () => {
    if (isStaticDeployment) {
      return mockStore.markAllNotificationsRead(getStoredUser());
    }
    try {
      return await request('/notifications/mark-all-read', { method: 'POST' });
    } catch (err) {
      return mockStore.markAllNotificationsRead(getStoredUser());
    }
  },
};
