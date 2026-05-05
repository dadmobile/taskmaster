from datetime import date, datetime

from pydantic import BaseModel, Field


# --- Backlog schemas ---

class BacklogCreate(BaseModel):
    name: str
    pinned: bool = False
    position: int = 0


class BacklogUpdate(BaseModel):
    name: str | None = None
    pinned: bool | None = None
    position: int | None = None
    archived: bool | None = None


class BacklogResponse(BaseModel):
    id: int
    name: str
    kind: str  # "daily" | "standing"
    date: date | None
    pinned: bool
    position: int
    archived: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Task schemas ---

class TaskCreate(BaseModel):
    title: str
    notes: str | None = None
    position: float | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    completed: bool | None = None
    position: float | None = None


class TaskMove(BaseModel):
    target_backlog_id: int | None = None
    target_date: date | None = None
    position: float | None = None


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


class LeftoverTask(TaskResponse):
    source_date: date


# --- Template schemas ---

class TemplateTaskCreate(BaseModel):
    title: str
    notes: str | None = None
    position: float | None = None


class TemplateTaskUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    position: float | None = None


class TemplateTaskResponse(BaseModel):
    id: int
    template_id: int
    title: str
    notes: str | None
    position: float

    model_config = {"from_attributes": True}


class TemplateCreate(BaseModel):
    name: str
    weekday: int | None = Field(default=None, ge=0, le=6)
    position: int = 0


class TemplateUpdate(BaseModel):
    name: str | None = None
    weekday: int | None = Field(default=None, ge=0, le=6)
    position: int | None = None


class TemplateResponse(BaseModel):
    id: int
    name: str
    weekday: int | None
    position: int
    created_at: datetime
    tasks: list[TemplateTaskResponse] = []

    model_config = {"from_attributes": True}
