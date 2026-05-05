import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api';
import BacklogPanel from '../components/BacklogPanel';
import TaskItem from '../components/TaskItem';

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function shiftIso(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function DayView({ date, allBacklogs, onRefreshBacklogs, onNavigateDate, refreshTick }) {
  const [data, setData] = useState(null);
  const today = useMemo(() => isoToday(), []);
  const isPast = date < today;
  const isToday = date === today;

  const load = useCallback(async () => {
    const d = await api.home(date);
    setData(d);
  }, [date]);

  useEffect(() => { load(); }, [load, refreshTick]);

  if (!data) return <div className="loading">Loading…</div>;

  const refresh = () => { load(); onRefreshBacklogs(); };

  const handleAddTask = async (backlogId, title) => {
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

  const handleReorder = async (orderedTasks, activeId, overId) => {
    const oldIndex = orderedTasks.findIndex((t) => t.id === activeId);
    const newIndex = orderedTasks.findIndex((t) => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...orderedTasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    const items = reordered.map((t, i) => ({ id: t.id, position: i + 1 }));
    await api.reorderTasks(items);
    load();
  };

  const handleMoveToBacklog = async (task, targetBacklogId) => {
    await api.moveTask(task.id, { target_backlog_id: targetBacklogId });
    refresh();
  };

  const handleMoveToDate = async (task, targetDate) => {
    try {
      await api.moveTask(task.id, { target_date: targetDate });
      refresh();
    } catch (err) {
      alert(`Couldn't move: ${err.message}`);
    }
  };

  const handleBringAllLeftovers = async () => {
    if (data.leftovers.length === 0) return;
    const dest = isToday ? 'today' : formatDateLabel(date);
    if (!window.confirm(`Bring all ${data.leftovers.length} leftover tasks to ${dest}?`)) return;
    await Promise.all(
      data.leftovers.map((t) => api.moveTask(t.id, { target_date: date }))
    );
    refresh();
  };

  return (
    <div className="day-view">
      <div className="day-nav">
        <button onClick={() => onNavigateDate(shiftIso(date, -1))} title="Previous day">←</button>
        <h2 className="day-title">
          {isToday ? 'Today' : formatDateLabel(date)}
          {!isToday && <span className="day-sub"> · {date}</span>}
        </h2>
        <button onClick={() => onNavigateDate(shiftIso(date, 1))} title="Next day">→</button>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && onNavigateDate(e.target.value)}
          className="day-jump"
        />
        {!isToday && (
          <button onClick={() => onNavigateDate(today)} className="jump-today">Jump to today</button>
        )}
      </div>

      {data.leftovers.length > 0 && (
        <div className="backlog-panel leftovers-panel">
          <div className="backlog-header">
            <h3>Leftovers <span className="leftover-count">({data.leftovers.length})</span></h3>
            <div className="backlog-header-actions">
              <button onClick={handleBringAllLeftovers} className="bring-all-btn">
                {isToday ? 'Bring all to today' : `Bring all to ${formatDateLabel(date)}`}
              </button>
            </div>
          </div>
          {data.leftovers.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
              onMoveToBacklog={handleMoveToBacklog}
              onMoveToDate={handleMoveToDate}
              onDelete={handleDeleteTask}
              backlogs={allBacklogs}
              sourceLabel={`from ${formatDateLabel(task.source_date)}`}
              draggable={false}
            />
          ))}
        </div>
      )}

      {data.today ? (
        <BacklogPanel
          title={isToday ? `Today — ${formatDateLabel(date)}` : data.today.backlog.name}
          tasks={data.today.tasks}
          onAddTask={(title) => handleAddTask(data.today.backlog.id, title)}
          onToggleTask={handleToggleTask}
          onReorder={(activeId, overId) => handleReorder(data.today.tasks, activeId, overId)}
          onMoveToBacklog={handleMoveToBacklog}
          onMoveToDate={handleMoveToDate}
          onDeleteTask={handleDeleteTask}
          backlogs={allBacklogs}
        />
      ) : (
        <div className="backlog-panel empty-day">
          <p>No backlog for {formatDateLabel(date)}.</p>
          <p className="empty-day-sub">Past dates aren't auto-created. Past unfinished work shows up under Leftovers when you visit today.</p>
        </div>
      )}

      {data.pinned.map(({ backlog, tasks }) => (
        <BacklogPanel
          key={backlog.id}
          title={backlog.name}
          tasks={tasks}
          onAddTask={(title) => handleAddTask(backlog.id, title)}
          onToggleTask={handleToggleTask}
          onReorder={(activeId, overId) => handleReorder(tasks, activeId, overId)}
          onMoveToBacklog={handleMoveToBacklog}
          onMoveToDate={handleMoveToDate}
          onDeleteTask={handleDeleteTask}
          backlogs={allBacklogs}
        />
      ))}
    </div>
  );
}
