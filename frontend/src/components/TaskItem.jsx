import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function TaskItem({ task, onToggle, onMove, backlogs }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`task-item${task.completed ? ' completed' : ''}`}>
      <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
      />
      <span className="task-title">{task.title}</span>
      {onMove && backlogs && (
        <select
          className="move-select"
          value=""
          onChange={(e) => {
            if (e.target.value) onMove(task, parseInt(e.target.value));
          }}
        >
          <option value="">Move to...</option>
          {backlogs
            .filter((b) => b.id !== task.backlog_id)
            .map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
        </select>
      )}
    </div>
  );
}
