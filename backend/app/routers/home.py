from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Backlog, Task, Template
from ..schemas import BacklogResponse, TaskResponse

router = APIRouter(tags=["home"])


def get_or_create_daily(db: Session, target_date: date, *, allow_create: bool = True) -> Backlog | None:
    """Return the daily backlog for `target_date`. Creates it (and seeds from a matching weekday
    template) only if it's today or in the future. Past dates are never auto-created."""
    backlog = (
        db.query(Backlog)
        .filter(Backlog.kind == "daily", Backlog.date == target_date)
        .first()
    )
    if backlog:
        return backlog
    if not allow_create or target_date < date.today():
        return None

    backlog = Backlog(
        name=target_date.strftime("%A, %b %d"),
        kind="daily",
        date=target_date,
    )
    db.add(backlog)
    db.flush()

    template = db.query(Template).filter(Template.weekday == target_date.weekday()).first()
    if template:
        for tt in template.tasks:
            db.add(Task(
                title=tt.title,
                notes=tt.notes,
                backlog_id=backlog.id,
                position=tt.position,
            ))

    db.commit()
    db.refresh(backlog)
    return backlog


def _incomplete_tasks(db: Session, backlog_id: int) -> list[Task]:
    return (
        db.query(Task)
        .filter(Task.backlog_id == backlog_id, Task.completed == False)  # noqa: E712
        .order_by(Task.position)
        .all()
    )


@router.get("/home")
def home_view(
    target_date: date = Query(default_factory=date.today, alias="date"),
    db: Session = Depends(get_db),
):
    today_backlog = get_or_create_daily(db, target_date)

    today_payload = None
    if today_backlog:
        today_payload = {
            "backlog": BacklogResponse.model_validate(today_backlog),
            "tasks": [TaskResponse.model_validate(t) for t in _incomplete_tasks(db, today_backlog.id)],
        }

    pinned = []
    pinned_backlogs = (
        db.query(Backlog)
        .filter(
            Backlog.kind == "standing",
            Backlog.pinned == True,  # noqa: E712
            Backlog.archived == False,  # noqa: E712
        )
        .order_by(Backlog.position, Backlog.id)
        .all()
    )
    for bl in pinned_backlogs:
        pinned.append({
            "backlog": BacklogResponse.model_validate(bl),
            "tasks": [TaskResponse.model_validate(t) for t in _incomplete_tasks(db, bl.id)],
        })

    leftover_rows = (
        db.query(Task, Backlog.date)
        .join(Backlog, Task.backlog_id == Backlog.id)
        .filter(
            Backlog.kind == "daily",
            Backlog.date < target_date,
            Task.completed == False,  # noqa: E712
        )
        .order_by(Backlog.date.desc(), Task.position)
        .all()
    )
    leftovers = []
    for task, source_date in leftover_rows:
        item = TaskResponse.model_validate(task).model_dump(mode="json")
        item["source_date"] = source_date.isoformat()
        leftovers.append(item)

    return {
        "date": target_date.isoformat(),
        "today": today_payload,
        "pinned": pinned,
        "leftovers": leftovers,
    }
