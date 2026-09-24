// Centralized API client for CampusCare

const API_BASE = '/api';

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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Unauthorized: clear storage if not on login attempt
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
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  demoLogin: (email) => request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ email }) }),
  getMe: () => request('/auth/me'),
  getDemoAccounts: () => request('/auth/demo-accounts'),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),

  // Tickets
  getTickets: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    return request(`/tickets?${query.toString()}`);
  },
  getTicket: (id) => request(`/tickets/${id}`),
  createTicket: (data) => request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status, resolution_summary) =>
    request(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, resolution_summary }) }),
  assignTicket: (id, staff_id) =>
    request(`/tickets/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ staff_id }) }),
  updatePriority: (id, priority) =>
    request(`/tickets/${id}/priority`, { method: 'PATCH', body: JSON.stringify({ priority }) }),
  reopenTicket: (id, reason) =>
    request(`/tickets/${id}/reopen`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Comments
  addComment: (ticketId, content, visibility) =>
    request(`/tickets/${ticketId}/comments`, { method: 'POST', body: JSON.stringify({ content, visibility }) }),

  // Dashboard
  getAdminDashboard: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/dashboard/admin${q ? '?' + q : ''}`);
  },
  getStaffDashboard: () => request('/dashboard/staff'),
  getStudentDashboard: () => request('/dashboard/student'),

  // Staff
  getStaff: () => request('/staff'),
  getStaffRecommendation: (categoryId) => request(`/staff/recommendation?category_id=${categoryId || ''}`),
  updateStaff: (id, data) => request(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  createStaff: (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getCategories: () => request('/settings/categories'),
  createCategory: (data) => request('/settings/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/settings/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getSlaPolicies: () => request('/settings/sla-policies'),
  updateSlaPolicy: (priority, data) =>
    request(`/settings/sla-policies/${priority}`, { method: 'PUT', body: JSON.stringify(data) }),
  getDepartments: () => request('/settings/departments'),

  // Reports
  getAnalytics: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/analytics${q ? '?' + q : ''}`);
  },
  downloadCsvUrl: (params = {}) => {
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
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
};
