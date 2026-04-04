from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Backlog, Task
from ..schemas import BacklogResponse, TaskResponse

router = APIRouter(tags=["daily"])


def _get_or_create_backlog(db: Session, type: str, name: str, date_context: date) -> Backlog:
    backlog = db.query(Backlog).filter(
        Backlog.type == type,
        Backlog.date_context == date_context,
        Backlog.archived == False,  # noqa: E712
    ).first()
    if not backlog:
        backlog = Backlog(name=name, type=type, date_context=date_context)
        db.add(backlog)
        db.commit()
        db.refresh(backlog)
    return backlog


def _week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())  # Monday


def _month_start(d: date) -> date:
    return d.replace(day=1)


def _tasks_for_backlog(db: Session, backlog_id: int, limit: int | None = None) -> list[Task]:
    q = db.query(Task).filter(Task.backlog_id == backlog_id, Task.completed == False).order_by(Task.position)  # noqa: E712
    if limit:
        q = q.limit(limit)
    return q.all()


@router.get("/daily")
def daily_view(
    target_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
):
    # Today's daily backlog
    daily_backlog = _get_or_create_backlog(db, "daily", target_date.strftime("%A, %b %d"), target_date)
    daily_tasks = _tasks_for_backlog(db, daily_backlog.id)

    # This week's backlog
    ws = _week_start(target_date)
    weekly_backlog = _get_or_create_backlog(db, "weekly", f"Week of {ws.strftime('%b %d')}", ws)
    weekly_tasks = _tasks_for_backlog(db, weekly_backlog.id)

    # Top items from standing backlogs
    summary_backlogs = []
    for bl in db.query(Backlog).filter(
        Backlog.type.in_(["urgent", "easy_fun", "project", "monthly", "longer_term"]),
        Backlog.archived == False,  # noqa: E712
    ).order_by(Backlog.position, Backlog.id).all():
        tasks = _tasks_for_backlog(db, bl.id, limit=5)
        if tasks:
            summary_backlogs.append({
                "backlog": BacklogResponse.model_validate(bl),
                "tasks": [TaskResponse.model_validate(t) for t in tasks],
            })

    return {
        "date": target_date.isoformat(),
        "daily": {
            "backlog": BacklogResponse.model_validate(daily_backlog),
            "tasks": [TaskResponse.model_validate(t) for t in daily_tasks],
        },
        "weekly": {
            "backlog": BacklogResponse.model_validate(weekly_backlog),
            "tasks": [TaskResponse.model_validate(t) for t in weekly_tasks],
        },
        "backlogs": summary_backlogs,
    }
