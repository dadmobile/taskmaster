const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Backlogs (standing only)
  listBacklogs: () => request('/backlogs'),
  createBacklog: (data) => request('/backlogs', { method: 'POST', body: JSON.stringify(data) }),
  updateBacklog: (id, data) => request(`/backlogs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteBacklog: (id) => request(`/backlogs/${id}`, { method: 'DELETE' }),

  // Tasks
  listTasks: (backlogId, includeCompleted = false) =>
    request(`/backlogs/${backlogId}/tasks?include_completed=${includeCompleted}`),
  createTask: (backlogId, data) =>
    request(`/backlogs/${backlogId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (taskId, data) =>
    request(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (taskId) => request(`/tasks/${taskId}`, { method: 'DELETE' }),
  moveTask: (taskId, data) =>
    request(`/tasks/${taskId}/move`, { method: 'POST', body: JSON.stringify(data) }),
  reorderTasks: (items) =>
    request('/tasks/reorder', { method: 'PATCH', body: JSON.stringify({ items }) }),

  // Home / day view
  home: (date) => {
    const qs = date ? `?date=${date}` : '';
    return request(`/home${qs}`);
  },

  // Templates
  listTemplates: () => request('/templates'),
  createTemplate: (data) => request('/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id, data) => request(`/templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTemplate: (id) => request(`/templates/${id}`, { method: 'DELETE' }),
  createTemplateTask: (templateId, data) =>
    request(`/templates/${templateId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  updateTemplateTask: (templateId, taskId, data) =>
    request(`/templates/${templateId}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTemplateTask: (templateId, taskId) =>
    request(`/templates/${templateId}/tasks/${taskId}`, { method: 'DELETE' }),
};
