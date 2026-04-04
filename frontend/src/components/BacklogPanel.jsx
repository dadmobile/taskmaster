import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import TaskItem from './TaskItem';
import AddTask from './AddTask';

export default function BacklogPanel({
  title,
  tasks,
  onAddTask,
  onToggleTask,
  onReorder,
  onMoveTask,
  backlogs,
  compact = false,
  showCompleted,
  onToggleShowCompleted,
  viewAllLink,
}) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(active.id, over.id);
  };

  const displayTasks = compact ? tasks.slice(0, 5) : tasks;

  return (
    <div className={`backlog-panel${compact ? ' compact' : ''}`}>
      <div className="backlog-header">
        <h3>{title}</h3>
        {onToggleShowCompleted && (
          <button className="toggle-completed" onClick={onToggleShowCompleted}>
            {showCompleted ? 'Hide completed' : 'Show completed'}
          </button>
        )}
      </div>
      {onAddTask && <AddTask onAdd={onAddTask} />}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={displayTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {displayTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onMove={onMoveTask}
              backlogs={backlogs}
            />
          ))}
        </SortableContext>
      </DndContext>
      {displayTasks.length === 0 && <div className="empty">No tasks</div>}
      {compact && tasks.length > 5 && viewAllLink && (
        <a href={viewAllLink} className="view-all">View all ({tasks.length})</a>
      )}
    </div>
  );
}
