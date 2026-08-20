from datetime import date, datetime, timezone

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    tabs = relationship("Tab", back_populates="owner", cascade="all, delete-orphan")


class Tab(Base):
    __tablename__ = "tabs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    color = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    owner = relationship("User", back_populates="tabs")
    widgets = relationship("Widget", back_populates="tab", cascade="all, delete-orphan")


WIDGET_TYPES = ("single_value", "table", "formula", "currency")


class Widget(Base):
    __tablename__ = "widgets"

    id = Column(Integer, primary_key=True, index=True)
    tab_id = Column(Integer, ForeignKey("tabs.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(Enum(*WIDGET_TYPES, name="widget_type"), nullable=False)
    label = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    config = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    tab = relationship("Tab", back_populates="widgets")
    entries = relationship("WidgetEntry", back_populates="widget", cascade="all, delete-orphan")


class WidgetEntry(Base):
    __tablename__ = "widget_entries"

    id = Column(Integer, primary_key=True, index=True)
    widget_id = Column(Integer, ForeignKey("widgets.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String, nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    entry_date = Column(Date, nullable=False, default=date.today)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    widget = relationship("Widget", back_populates="entries")
