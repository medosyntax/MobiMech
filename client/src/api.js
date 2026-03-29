const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mobimech_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('mobimech_token');
    localStorage.removeItem('mobimech_user');
    if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.errors?.map((e) => e.msg).join(', ') || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),

  // Services (public)
  getServices: (category) => request(`/services${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getServiceCategories: () => request('/services/categories'),

  // Services (admin)
  getAllServices: () => request('/services/all'),
  createService: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE' }),

  // Bookings (public)
  createBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  trackBooking: (ref, email) => request(`/bookings/track?ref=${encodeURIComponent(ref)}&email=${encodeURIComponent(email)}`),

  // Bookings (admin)
  getBookings: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/bookings?${qs}`);
  },
  getBooking: (id) => request(`/bookings/${id}`),
  updateBooking: (id, data) => request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createAdminBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),

  // Customers (admin)
  getCustomers: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/customers?${qs}`);
  },
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Vehicles (admin)
  getVehicles: (params) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/vehicles${qs}`);
  },
  createVehicle: (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Invoices (admin)
  getInvoices: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/invoices?${qs}`);
  },
  getInvoice: (id) => request(`/invoices/${id}`),
  createInvoice: (data) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id, data) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),
};
