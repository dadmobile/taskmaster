import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import BacklogPanel from '../components/BacklogPanel';

export default function BacklogPage({ backlogId, allBacklogs, onRefreshBacklogs }) {
  const [backlog, setBacklog] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);

  const load = useCallback(async () => {
    const backlogs = await api.listBacklogs();
    const bl = backlogs.find((b) => b.id === backlogId);
    setBacklog(bl || null);
    const t = await api.listTasks(backlogId, showCompleted);
    setTasks(t);
  }, [backlogId, showCompleted]);

  useEffect(() => { load(); }, [load]);

  if (!backlog) return <div className="loading">Loading...</div>;

  const handleAddTask = async (title) => {
    await api.createTask(backlogId, { title });
    load();
  };

  const handleToggleTask = async (task) => {
    await api.updateTask(task.id, { completed: !task.completed });
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

  const handleMoveTask = async (task, targetBacklogId) => {
    await api.moveTask(task.id, { target_backlog_id: targetBacklogId });
    load();
    onRefreshBacklogs();
  };

  return (
    <div className="backlog-page">
      <BacklogPanel
        title={backlog.name}
        tasks={tasks}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onReorder={handleReorder}
        onMoveTask={handleMoveTask}
        backlogs={allBacklogs}
        showCompleted={showCompleted}
        onToggleShowCompleted={() => setShowCompleted(!showCompleted)}
      />
    </div>
  );
}
