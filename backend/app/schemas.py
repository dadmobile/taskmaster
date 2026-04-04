from datetime import date, datetime

from pydantic import BaseModel


# --- Backlog schemas ---

class BacklogCreate(BaseModel):
    name: str
    type: str  # daily, weekly, urgent, easy_fun, project, monthly, longer_term
    date_context: date | None = None
    position: int = 0


class BacklogUpdate(BaseModel):
    name: str | None = None
    position: int | None = None
    archived: bool | None = None


class BacklogResponse(BaseModel):
    id: int
    name: str
    type: str
    date_context: date | None
    position: int
    archived: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Task schemas ---

class TaskCreate(BaseModel):
    title: str
    notes: str | None = None
    position: float | None = None  # auto-assigned if not provided


class TaskUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    completed: bool | None = None
    position: float | None = None


class TaskMove(BaseModel):
    target_backlog_id: int
    position: float | None = None  # auto-assigned if not provided


class TaskReorderItem(BaseModel):
    id: int
    position: float


class TaskReorder(BaseModel):
    items: list[TaskReorderItem]


class TaskResponse(BaseModel):
    id: int
    title: str
    notes: str | None
    backlog_id: int
    position: float
    completed: bool
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
