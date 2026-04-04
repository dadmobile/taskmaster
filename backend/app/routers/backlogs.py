from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Backlog
from ..schemas import BacklogCreate, BacklogResponse, BacklogUpdate

router = APIRouter(tags=["backlogs"])


@router.get("/backlogs", response_model=list[BacklogResponse])
def list_backlogs(
    type: str | None = Query(None),
    archived: bool = Query(False),
    db: Session = Depends(get_db),
):
    q = db.query(Backlog).filter(Backlog.archived == archived)
    if type:
        q = q.filter(Backlog.type == type)
    return q.order_by(Backlog.position, Backlog.id).all()


@router.post("/backlogs", response_model=BacklogResponse, status_code=201)
def create_backlog(data: BacklogCreate, db: Session = Depends(get_db)):
    backlog = Backlog(**data.model_dump())
    db.add(backlog)
    db.commit()
    db.refresh(backlog)
    return backlog


@router.patch("/backlogs/{backlog_id}", response_model=BacklogResponse)
def update_backlog(backlog_id: int, data: BacklogUpdate, db: Session = Depends(get_db)):
    backlog = db.query(Backlog).filter(Backlog.id == backlog_id).first()
    if not backlog:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Backlog not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(backlog, key, value)
    db.commit()
    db.refresh(backlog)
    return backlog


@router.delete("/backlogs/{backlog_id}", status_code=204)
def delete_backlog(backlog_id: int, db: Session = Depends(get_db)):
    backlog = db.query(Backlog).filter(Backlog.id == backlog_id).first()
    if not backlog:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Backlog not found")
    db.delete(backlog)
    db.commit()
