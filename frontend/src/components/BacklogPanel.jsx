import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import TaskItem from './TaskItem';
import AddTask from './AddTask';

export default function BacklogPanel({
  title,
  tasks,
  onAddTask,
  onToggleTask,
  onReorder,
  onMoveToBacklog,
  onMoveToDate,
  onDeleteTask,
  backlogs,
  showCompleted,
  onToggleShowCompleted,
  headerExtra,
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder?.(active.id, over.id);
  };

  return (
    <div className="backlog-panel">
      <div className="backlog-header">
        <h3>{title}</h3>
        <div className="backlog-header-actions">
          {headerExtra}
          {onToggleShowCompleted && (
            <button className="toggle-completed" onClick={onToggleShowCompleted}>
              {showCompleted ? 'Hide completed' : 'Show completed'}
            </button>
          )}
        </div>
      </div>
      {onAddTask && <AddTask onAdd={onAddTask} />}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onMoveToBacklog={onMoveToBacklog}
              onMoveToDate={onMoveToDate}
              onDelete={onDeleteTask}
              backlogs={backlogs}
              draggable={!!onReorder}
            />
          ))}
        </SortableContext>
      </DndContext>
      {tasks.length === 0 && <div className="empty">No tasks</div>}
    </div>
  );
}
