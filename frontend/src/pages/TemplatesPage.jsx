import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import AddTask from '../components/AddTask';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWeekday, setNewWeekday] = useState('');

  const load = useCallback(async () => {
    setTemplates(await api.listTemplates());
  }, []);

  useEffect(() => { load(); }, [load]);

  const usedWeekdays = new Set(
    templates.filter((t) => t.weekday !== null && t.weekday !== undefined).map((t) => t.weekday)
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.createTemplate({
        name: newName.trim(),
        weekday: newWeekday === '' ? null : parseInt(newWeekday, 10),
      });
      setNewName('');
      setNewWeekday('');
      setShowCreate(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignWeekday = async (template, value) => {
    const weekday = value === '' ? null : parseInt(value, 10);
    try {
      await api.updateTemplate(template.id, { weekday });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRename = async (template) => {
    const next = window.prompt('Rename template:', template.name);
    if (next && next.trim() && next.trim() !== template.name) {
      await api.updateTemplate(template.id, { name: next.trim() });
      load();
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    await api.deleteTemplate(template.id);
    load();
  };

  const handleAddTask = async (templateId, title) => {
    await api.createTemplateTask(templateId, { title });
    load();
  };

  const handleDeleteTask = async (templateId, taskId) => {
    await api.deleteTemplateTask(templateId, taskId);
    load();
  };

  return (
    <div className="templates-page">
      <h2>Templates</h2>
      <p className="templates-help">
        A template assigned to a weekday auto-seeds the tasks for any new daily backlog on that day.
        Templates without a weekday are inactive (manual-only — placeholder for future use).
      </p>

      {!showCreate ? (
        <button className="create-btn" onClick={() => setShowCreate(true)}>+ New Template</button>
      ) : (
        <form onSubmit={handleCreate} className="create-form templates-create">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Template name"
            autoFocus
          />
          <select value={newWeekday} onChange={(e) => setNewWeekday(e.target.value)}>
            <option value="">No weekday</option>
            {WEEKDAYS.map((w, i) => (
              <option key={i} value={i} disabled={usedWeekdays.has(i)}>
                {w}{usedWeekdays.has(i) ? ' (taken)' : ''}
              </option>
            ))}
          </select>
          <div>
            <button type="submit">Create</button>
            <button type="button" onClick={() => { setShowCreate(false); setNewName(''); setNewWeekday(''); }}>Cancel</button>
          </div>
        </form>
      )}

      {templates.length === 0 && <div className="empty">No templates yet.</div>}

      {templates.map((tpl) => (
        <div key={tpl.id} className="template-card">
          <div className="template-header">
            <h3>{tpl.name}</h3>
            <select
              value={tpl.weekday ?? ''}
              onChange={(e) => handleAssignWeekday(tpl, e.target.value)}
            >
              <option value="">No weekday</option>
              {WEEKDAYS.map((w, i) => (
                <option
                  key={i}
                  value={i}
                  disabled={usedWeekdays.has(i) && tpl.weekday !== i}
                >
                  {w}{usedWeekdays.has(i) && tpl.weekday !== i ? ' (taken)' : ''}
                </option>
              ))}
            </select>
            <button onClick={() => handleRename(tpl)}>Rename</button>
            <button onClick={() => handleDeleteTemplate(tpl)} className="danger-btn">Delete</button>
          </div>
          <AddTask onAdd={(title) => handleAddTask(tpl.id, title)} />
          {tpl.tasks.length === 0 && <div className="empty">No tasks in this template</div>}
          {tpl.tasks.map((t) => (
            <div key={t.id} className="template-task">
              <span className="task-title">{t.title}</span>
              <button className="delete-btn" onClick={() => handleDeleteTask(tpl.id, t.id)} title="Remove">×</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
