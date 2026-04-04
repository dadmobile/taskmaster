const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Backlogs
  listBacklogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/backlogs${qs ? '?' + qs : ''}`);
  },
  createBacklog: (data) => request('/backlogs', { method: 'POST', body: JSON.stringify(data) }),
  updateBacklog: (id, data) => request(`/backlogs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Tasks
  listTasks: (backlogId, includeCompleted = false) =>
    request(`/backlogs/${backlogId}/tasks?include_completed=${includeCompleted}`),
  createTask: (backlogId, data) =>
    request(`/backlogs/${backlogId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (taskId, data) =>
    request(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  moveTask: (taskId, data) =>
    request(`/tasks/${taskId}/move`, { method: 'POST', body: JSON.stringify(data) }),
  reorderTasks: (items) =>
    request('/tasks/reorder', { method: 'PATCH', body: JSON.stringify({ items }) }),

  // Daily view
  daily: (date) => {
    const qs = date ? `?target_date=${date}` : '';
    return request(`/daily${qs}`);
  },
};
