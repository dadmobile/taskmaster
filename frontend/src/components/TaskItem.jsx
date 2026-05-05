import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function TaskItem({
  task,
  onToggle,
  onMoveToBacklog,
  onMoveToDate,
  onDelete,
  backlogs,
  sourceLabel,
  draggable = true,
}) {
  const sortable = useSortable({ id: task.id, disabled: !draggable });
  const { attributes, listeners, setNodeRef, transform, transition } = sortable;

  const style = draggable
    ? { transform: CSS.Transform.toString(transform), transition }
    : undefined;

  const handleMove = (value) => {
    if (!value) return;
    if (value === '__today') {
      onMoveToDate?.(task, isoToday());
    } else if (value === '__tomorrow') {
      onMoveToDate?.(task, isoOffset(1));
    } else if (value === '__pick') {
      const picked = window.prompt('Move to date (YYYY-MM-DD):', isoToday());
      if (picked && /^\d{4}-\d{2}-\d{2}$/.test(picked)) {
        onMoveToDate?.(task, picked);
      } else if (picked) {
        alert('Please use YYYY-MM-DD format');
      }
    } else {
      const id = parseInt(value, 10);
      if (!Number.isNaN(id)) onMoveToBacklog?.(task, id);
    }
  };

  return (
    <div ref={draggable ? setNodeRef : null} style={style} className={`task-item${task.completed ? ' completed' : ''}`}>
      {draggable ? (
        <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
      ) : (
        <span className="drag-handle disabled">·</span>
      )}
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle?.(task)}
      />
      <span className="task-title">
        {task.title}
        {sourceLabel && <span className="source-tag"> {sourceLabel}</span>}
      </span>
      {(onMoveToBacklog || onMoveToDate) && (
        <select
          className="move-select"
          value=""
          onChange={(e) => { handleMove(e.target.value); e.target.value = ''; }}
        >
          <option value="">Move…</option>
          {onMoveToDate && (
            <optgroup label="Day">
              <option value="__today">→ Today</option>
              <option value="__tomorrow">→ Tomorrow</option>
              <option value="__pick">→ Pick a date…</option>
            </optgroup>
          )}
          {onMoveToBacklog && backlogs && backlogs.length > 0 && (
            <optgroup label="Backlog">
              {backlogs
                .filter((b) => b.id !== task.backlog_id)
                .map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
            </optgroup>
          )}
        </select>
      )}
      {onDelete && (
        <button className="delete-btn" onClick={() => onDelete(task)} title="Delete task">×</button>
      )}
    </div>
  );
}
