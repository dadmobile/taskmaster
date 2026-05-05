from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Backlog(Base):
    __tablename__ = "backlogs"
    __table_args__ = (UniqueConstraint("date", name="uq_backlog_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    kind: Mapped[str] = mapped_column(String, nullable=False)  # "daily" | "standing"
    date: Mapped[date | None] = mapped_column(Date, nullable=True)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="backlog", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    backlog_id: Mapped[int] = mapped_column(Integer, ForeignKey("backlogs.id"), nullable=False)
    position: Mapped[float] = mapped_column(Float, default=0.0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    backlog: Mapped["Backlog"] = relationship("Backlog", back_populates="tasks")


class Template(Base):
    __tablename__ = "templates"
    __table_args__ = (UniqueConstraint("weekday", name="uq_template_weekday"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    weekday: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0=Mon … 6=Sun, null = manual-only
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    tasks: Mapped[list["TemplateTask"]] = relationship(
        "TemplateTask",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="TemplateTask.position",
    )


class TemplateTask(Base):
    __tablename__ = "template_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    template_id: Mapped[int] = mapped_column(Integer, ForeignKey("templates.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    template: Mapped["Template"] = relationship("Template", back_populates="tasks")
