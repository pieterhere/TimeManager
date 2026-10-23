const BASE = '/api';

// Browser-local "today" (YYYY-MM-DD) — sent with anything that logs
// worked time, so activity lands on the user's own calendar day rather
// than the server's (which may be in a different timezone).
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (name, status) => request('/projects', { method: 'POST', body: JSON.stringify({ name, status }) }),
  updateProject: (id, patch) => request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify({ ...patch, client_date: localDateKey() }) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  reorderProjects: (order) => request('/projects/reorder', { method: 'POST', body: JSON.stringify({ order }) }),

  createTask: (project_id, name) => request('/tasks', { method: 'POST', body: JSON.stringify({ project_id, name }) }),
  updateTask: (id, patch) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ ...patch, client_date: localDateKey() }) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  startTimer: (type, id, mode, preset_seconds) =>
    request(`/timers/${type}/${id}/start`, { method: 'POST', body: JSON.stringify({ mode, preset_seconds, client_date: localDateKey() }) }),
  stopTimer: (type, id) => request(`/timers/${type}/${id}/stop`, { method: 'POST', body: JSON.stringify({ client_date: localDateKey() }) }),
  getActiveTimer: () => request('/timers/active'),

  getWeekStats: () => request(`/stats/week?today=${localDateKey()}`),
};

export function formatSeconds(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

// Accepts "H:MM:SS", "MM:SS", or a bare number of minutes.
export function parseHMS(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(':').map((p) => p.trim());
  if (parts.some((p) => p === '' || Number.isNaN(Number(p)))) return null;
  if (parts.length === 1) return Math.round(Number(parts[0]) * 60);
  if (parts.length === 2) return Math.round(Number(parts[0]) * 60 + Number(parts[1]));
  if (parts.length === 3) return Math.round(Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]));
  return null;
}
