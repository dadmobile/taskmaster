import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import BacklogPanel from '../components/BacklogPanel';

export default function BacklogPage({ backlogId, allBacklogs, onRefreshBacklogs }) {
  const [backlog, setBacklog] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);

  const load = useCallback(async () => {
    const all = await api.listBacklogs();
    setBacklog(all.find((b) => b.id === backlogId) || null);
    const t = await api.listTasks(backlogId, showCompleted);
    setTasks(t);
  }, [backlogId, showCompleted]);

  useEffect(() => { load(); }, [load]);

  if (!backlog) return <div className="loading">Loading…</div>;

  const handleAddTask = async (title) => {
    await api.createTask(backlogId, { title });
    load();
  };

  const handleToggleTask = async (task) => {
    await api.updateTask(task.id, { completed: !task.completed });
    load();
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await api.deleteTask(task.id);
    load();
  };

  const handleReorder = async (activeId, overId) => {
    const oldIndex = tasks.findIndex((t) => t.id === activeId);
    const newIndex = tasks.findIndex((t) => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...tasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    const items = reordered.map((t, i) => ({ id: t.id, position: i + 1 }));
    await api.reorderTasks(items);
    load();
  };

  const handleMoveToBacklog = async (task, targetBacklogId) => {
    await api.moveTask(task.id, { target_backlog_id: targetBacklogId });
    load();
    onRefreshBacklogs();
  };

  const handleMoveToDate = async (task, targetDate) => {
    try {
      await api.moveTask(task.id, { target_date: targetDate });
      load();
      onRefreshBacklogs();
    } catch (err) {
      alert(`Couldn't move: ${err.message}`);
    }
  };

  const handleRename = async () => {
    const next = window.prompt('Rename backlog:', backlog.name);
    if (next && next.trim() && next.trim() !== backlog.name) {
      await api.updateBacklog(backlog.id, { name: next.trim() });
      load();
      onRefreshBacklogs();
    }
  };

  const handleDeleteBacklog = async () => {
    if (!window.confirm(`Delete the "${backlog.name}" backlog and all its tasks?`)) return;
    await api.deleteBacklog(backlog.id);
    onRefreshBacklogs();
    window.location.hash = '';
  };

  const headerExtra = (
    <>
      <button onClick={handleRename}>Rename</button>
      <button onClick={handleDeleteBacklog} className="danger-btn">Delete</button>
    </>
  );

  return (
    <div className="backlog-page">
      <BacklogPanel
        title={backlog.name}
        tasks={tasks}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onReorder={handleReorder}
        onMoveToBacklog={handleMoveToBacklog}
        onMoveToDate={handleMoveToDate}
        onDeleteTask={handleDeleteTask}
        backlogs={allBacklogs}
        showCompleted={showCompleted}
        onToggleShowCompleted={() => setShowCompleted(!showCompleted)}
        headerExtra={headerExtra}
      />
    </div>
  );
}
