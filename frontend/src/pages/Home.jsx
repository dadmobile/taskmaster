import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import BacklogPanel from '../components/BacklogPanel';

export default function Home({ allBacklogs, onRefreshBacklogs }) {
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const d = await api.daily();
    setData(d);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="loading">Loading...</div>;

  const handleAddTask = async (backlogId, title) => {
    await api.createTask(backlogId, { title });
    load();
  };

  const handleToggleTask = async (task) => {
    await api.updateTask(task.id, { completed: !task.completed });
    load();
  };

  const handleReorder = async (backlogTasks, activeId, overId) => {
    const oldIndex = backlogTasks.findIndex((t) => t.id === activeId);
    const newIndex = backlogTasks.findIndex((t) => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...backlogTasks];
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
    <div className="home">
      <h2>{data.daily.backlog.name}</h2>

      <BacklogPanel
        title="Today"
        tasks={data.daily.tasks}
        onAddTask={(title) => handleAddTask(data.daily.backlog.id, title)}
        onToggleTask={handleToggleTask}
        onReorder={(activeId, overId) => handleReorder(data.daily.tasks, activeId, overId)}
        onMoveTask={handleMoveTask}
        backlogs={allBacklogs}
      />

      <BacklogPanel
        title={data.weekly.backlog.name}
        tasks={data.weekly.tasks}
        onAddTask={(title) => handleAddTask(data.weekly.backlog.id, title)}
        onToggleTask={handleToggleTask}
        onReorder={(activeId, overId) => handleReorder(data.weekly.tasks, activeId, overId)}
        onMoveTask={handleMoveTask}
        backlogs={allBacklogs}
      />

      {data.backlogs.map(({ backlog, tasks }) => (
        <BacklogPanel
          key={backlog.id}
          title={backlog.name}
          tasks={tasks}
          onAddTask={(title) => handleAddTask(backlog.id, title)}
          onToggleTask={handleToggleTask}
          onReorder={(activeId, overId) => handleReorder(tasks, activeId, overId)}
          onMoveTask={handleMoveTask}
          backlogs={allBacklogs}
          compact
          viewAllLink={`#backlog/${backlog.id}`}
        />
      ))}
    </div>
  );
}
