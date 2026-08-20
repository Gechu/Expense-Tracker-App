from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr

WidgetTypeLiteral = Literal["single_value", "table", "formula", "currency"]


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr


class WidgetEntryCreate(BaseModel):
    label: str | None = None
    amount: Decimal
    entry_date: date
    position: int = 0


class WidgetEntryUpdate(BaseModel):
    label: str | None = None
    amount: Decimal | None = None
    entry_date: date | None = None
    position: int | None = None


class WidgetEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str | None
    amount: Decimal
    entry_date: date
    position: int
    created_at: datetime


class WidgetCreate(BaseModel):
    type: WidgetTypeLiteral
    label: str
    position: int = 0
    config: dict | None = None


class WidgetUpdate(BaseModel):
    label: str | None = None
    position: int | None = None
    config: dict | None = None


class WidgetOut(BaseModel):
    id: int
    tab_id: int
    type: WidgetTypeLiteral
    label: str
    position: int
    config: dict | None
    created_at: datetime
    updated_at: datetime | None
    entries: list[WidgetEntryOut] = []
    value: Decimal | None = None


class TabCreate(BaseModel):
    name: str
    color: str
    position: int = 0


class TabUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    position: int | None = None


class TabOut(BaseModel):
    id: int
    name: str
    color: str
    position: int
    created_at: datetime
    widgets: list[WidgetOut] = []
