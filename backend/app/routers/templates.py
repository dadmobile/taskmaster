from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Template, TemplateTask
from ..schemas import (
    TemplateCreate,
    TemplateResponse,
    TemplateTaskCreate,
    TemplateTaskResponse,
    TemplateTaskUpdate,
    TemplateUpdate,
)

router = APIRouter(tags=["templates"])


def _next_position(db: Session, template_id: int) -> float:
    max_pos = (
        db.query(TemplateTask.position)
        .filter(TemplateTask.template_id == template_id)
        .order_by(TemplateTask.position.desc())
        .first()
    )
    return (max_pos[0] + 1.0) if max_pos else 1.0


@router.get("/templates", response_model=list[TemplateResponse])
def list_templates(db: Session = Depends(get_db)):
    return db.query(Template).order_by(Template.position, Template.id).all()


@router.post("/templates", response_model=TemplateResponse, status_code=201)
def create_template(data: TemplateCreate, db: Session = Depends(get_db)):
    if data.weekday is not None:
        existing = db.query(Template).filter(Template.weekday == data.weekday).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"A template is already assigned to weekday {data.weekday}")
    template = Template(name=data.name, weekday=data.weekday, position=data.position)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.patch("/templates/{template_id}", response_model=TemplateResponse)
def update_template(template_id: int, data: TemplateUpdate, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    updates = data.model_dump(exclude_unset=True)
    if "weekday" in updates and updates["weekday"] is not None:
        existing = (
            db.query(Template)
            .filter(Template.weekday == updates["weekday"], Template.id != template_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail=f"A template is already assigned to weekday {updates['weekday']}")
    for key, value in updates.items():
        setattr(template, key, value)
    db.commit()
    db.refresh(template)
    return template


@router.delete("/templates/{template_id}", status_code=204)
def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()


@router.post("/templates/{template_id}/tasks", response_model=TemplateTaskResponse, status_code=201)
def create_template_task(template_id: int, data: TemplateTaskCreate, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    position = data.position if data.position is not None else _next_position(db, template_id)
    tt = TemplateTask(
        template_id=template_id,
        title=data.title,
        notes=data.notes,
        position=position,
    )
    db.add(tt)
    db.commit()
    db.refresh(tt)
    return tt


@router.patch("/templates/{template_id}/tasks/{task_id}", response_model=TemplateTaskResponse)
def update_template_task(template_id: int, task_id: int, data: TemplateTaskUpdate, db: Session = Depends(get_db)):
    tt = (
        db.query(TemplateTask)
        .filter(TemplateTask.id == task_id, TemplateTask.template_id == template_id)
        .first()
    )
    if not tt:
        raise HTTPException(status_code=404, detail="Template task not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(tt, key, value)
    db.commit()
    db.refresh(tt)
    return tt


@router.delete("/templates/{template_id}/tasks/{task_id}", status_code=204)
def delete_template_task(template_id: int, task_id: int, db: Session = Depends(get_db)):
    tt = (
        db.query(TemplateTask)
        .filter(TemplateTask.id == task_id, TemplateTask.template_id == template_id)
        .first()
    )
    if not tt:
        raise HTTPException(status_code=404, detail="Template task not found")
    db.delete(tt)
    db.commit()
