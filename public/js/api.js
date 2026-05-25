const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('stampsnap_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('stampsnap_token');
    localStorage.removeItem('stampsnap_user');
    window.location.href = '/login.html';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function apiUpload(endpoint, formData) {
  const token = localStorage.getItem('stampsnap_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers, body: formData });
  if (res.status === 401) {
    localStorage.removeItem('stampsnap_token');
    localStorage.removeItem('stampsnap_user');
    window.location.href = '/login.html';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}
