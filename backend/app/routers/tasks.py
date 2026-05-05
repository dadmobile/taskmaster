from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Task
from ..schemas import TaskCreate, TaskMove, TaskReorder, TaskResponse, TaskUpdate
from .home import get_or_create_daily

router = APIRouter(tags=["tasks"])


def _next_position(db: Session, backlog_id: int) -> float:
    max_pos = (
        db.query(Task.position)
        .filter(Task.backlog_id == backlog_id)
        .order_by(Task.position.desc())
        .first()
    )
    return (max_pos[0] + 1.0) if max_pos else 1.0


@router.get("/backlogs/{backlog_id}/tasks", response_model=list[TaskResponse])
def list_tasks(
    backlog_id: int,
    include_completed: bool = Query(False),
    db: Session = Depends(get_db),
):
    q = db.query(Task).filter(Task.backlog_id == backlog_id)
    if not include_completed:
        q = q.filter(Task.completed == False)  # noqa: E712
    return q.order_by(Task.position).all()


@router.post("/backlogs/{backlog_id}/tasks", response_model=TaskResponse, status_code=201)
def create_task(backlog_id: int, data: TaskCreate, db: Session = Depends(get_db)):
    position = data.position if data.position is not None else _next_position(db, backlog_id)
    task = Task(
        title=data.title,
        notes=data.notes,
        backlog_id=backlog_id,
        position=position,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/tasks/reorder")
def reorder_tasks(data: TaskReorder, db: Session = Depends(get_db)):
    for item in data.items:
        db.query(Task).filter(Task.id == item.id).update({"position": item.position})
    db.commit()
    return {"status": "ok"}


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    updates = data.model_dump(exclude_unset=True)
    if "completed" in updates:
        updates["completed_at"] = datetime.now() if updates["completed"] else None
    for key, value in updates.items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


@router.post("/tasks/{task_id}/move", response_model=TaskResponse)
def move_task(task_id: int, data: TaskMove, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if data.target_date is not None:
        if data.target_date < date.today():
            raise HTTPException(status_code=400, detail="Cannot move task to a past date")
        target_backlog = get_or_create_daily(db, data.target_date)
        if not target_backlog:
            raise HTTPException(status_code=400, detail="Could not resolve target date")
        target_id = target_backlog.id
    elif data.target_backlog_id is not None:
        target_id = data.target_backlog_id
    else:
        raise HTTPException(status_code=400, detail="Must provide target_backlog_id or target_date")

    task.backlog_id = target_id
    task.position = data.position if data.position is not None else _next_position(db, target_id)
    db.commit()
    db.refresh(task)
    return task
